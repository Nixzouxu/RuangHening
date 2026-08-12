import { createHash } from 'crypto';
import { env } from '../config/env';
import { anonymizeText } from './anonymization.service';
import { redis } from '../lib/redis';

/**
 * PENGANALISIS EMOSI TEKS (SENTIMENT ANALYSIS)
 * 
 * Bagian ini bertugas membaca teks jurnal pengguna dan menebak apakah teks tersebut 
 * mengandung emosi positif (senang/bahagia), negatif (sedih/marah), atau netral.
 * 
 * Kita menggunakan model Kecerdasan Buatan (AI) gratis dari HuggingFace yang 
 * sudah dilatih khusus untuk mengerti tata bahasa Indonesia (termasuk bahasa sehari-hari).
 */
const HF_ENDPOINT = 'https://api-inference.huggingface.co/models/w11wo/indonesian-roberta-base-sentiment-classifier';

interface SentimentResult {
  score: number; // Angka dari -1 (sangat sedih/marah) sampai 1 (sangat bahagia)
  label: string; // Teks penanda: 'positif', 'negatif', atau 'netral'
}

export async function analyzeSentiment(rawText: string): Promise<SentimentResult> {
  // SENSOR DATA PRIBADI
  // Sebelum dikirim ke AI pihak ketiga, pastikan tidak ada nama, NIK, atau nomor HP di dalam teks.
  const anonymized = anonymizeText(rawText);

  // CEK INGATAN PADA CACHE
  // Memproses data AI membutuhkan waktu. Jika teks yang sama persis pernah dianalisis sebelumnya,
  // kita cukup mengambil hasil yang sudah tersimpan di memori sementara (Redis) agar lebih cepat.
  const cacheKey = `sentiment:${createHash('sha256').update(anonymized).digest('hex')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as SentimentResult;

  // PERMINTAAN ANALISIS KE AI
  // Mengirimkan teks yang sudah disensor ke server AI HuggingFace.
  const response = await fetch(HF_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Kunci API (HuggingFace Token) akan digunakan jika tersedia di environment variable.
      ...(env.HUGGINGFACE_API_KEY ? { Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}` } : {}),
    },
    body: JSON.stringify({ inputs: anonymized }),
    // Memberikan batas waktu maksimal 10 detik. Jika permintaan menggantung lebih dari itu,
    // batalkan proses agar aplikasi secara keseluruhan tidak macet atau terhenti.
    signal: AbortSignal.timeout(10_000),
  });

  // Penanganan ketika aplikasi terlalu sering meminta data ke AI melampaui kuota gratisan.
  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }
  
  // Penanganan ketika server AI sedang mengalami gangguan.
  if (!response.ok) {
    throw new Error(`SENTIMENT_API_ERROR: ${response.status}`);
  }

  // TERJEMAHKAN HASIL
  const raw: unknown = await response.json();
  const mapped = mapHuggingFaceResult(raw);

  // SIMPAN HASIL KE CACHE
  // Menyimpan hasil analisis selama satu jam ke depan. Tujuannya agar analisis 
  // untuk teks yang sama tidak perlu diproses ulang ke server AI dalam waktu dekat.
  await redis.set(cacheKey, JSON.stringify(mapped), { EX: 3600 });
  
  return mapped;
}

/**
 * PENTERJEMAH HASIL AI
 * 
 * Server AI mengembalikan data dalam format persentase tebakan untuk masing-masing emosi.
 * Fungsi ini bertugas menyederhanakan format rumit tersebut menjadi standar 
 * yang dimengerti oleh sistem database kita (skor berupa rentang -1 hingga 1).
 */
function mapHuggingFaceResult(raw: unknown): SentimentResult {
  // Memastikan struktur data balasan dari AI sesuai dengan format yang dapat kita proses.
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) {
    throw new Error('SENTIMENT_UNEXPECTED_FORMAT');
  }

  // Mengambil daftar probabilitas emosi yang dihasilkan AI.
  const predictions = raw[0] as Array<{ label: string; score: number }>;
  
  // Mencari label emosi dengan tingkat keyakinan (skor) yang paling tinggi.
  const top = predictions.reduce((a, b) => (b.score > a.score ? b : a));
  
  let normalizedScore = 0;
  let labelId = 'netral';

  const aiLabel = top.label.toLowerCase();

  // Menentukan skor dan label akhir ke dalam bahasa Indonesia 
  // berdasarkan tebakan terkuat dari AI.
  if (aiLabel.includes('positive')) {
    normalizedScore = 1; // Merepresentasikan sangat positif
    labelId = 'positif';
  } else if (aiLabel.includes('negative')) {
    normalizedScore = -1; // Merepresentasikan sangat negatif
    labelId = 'negatif';
  } else {
    normalizedScore = 0; // Merepresentasikan kondisi netral
    labelId = 'netral';
  }

  return { score: normalizedScore, label: labelId };
}