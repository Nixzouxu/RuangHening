/**
 * ALAT PENYENSOR DATA PRIBADI (ANONIMISASI)
 * 
 * Bagian ini bertugas seperti petugas sensor naskah. Tujuannya sangat penting, 
 * yaitu menjaga privasi pengguna agar informasi rahasia mereka tidak ikut 
 * terbaca atau tersimpan secara sembarangan oleh sistem.
 * 
 * Pertama, kita membuat beberapa cetakan atau pola pencarian khusus:
 * - Pola Nama: Mengenali tulisan yang diawali kata "saya", "aku", "gue", atau "gua" 
 *   (baik dengan awalan huruf kapital maupun kecil) lalu diikuti kata berawalan huruf besar. 
 *   Ia juga mengenali gaya nama dengan tambahan "bin" atau "binti" di tengahnya.
 * - Pola Nomor Identitas: Mengenali deretan enam belas angka tanpa putus 
 *   (biasanya ini adalah ciri-ciri nomor KTP).
 * - Pola Nomor Telepon: Mengenali nomor yang diawali dengan kode Indonesia 
 *   (seperti nol delapan, atau enam dua) beserta deretan angka di belakangnya.
 * 
 * Cara kerjanya:
 * 1. Fungsi ini akan membaca seluruh cerita pengguna dari awal sampai akhir.
 * 2. Jika ia melihat ada kata atau angka yang cocok dengan pola pencarian tadi, 
 *    ia akan langsung mencoret data aslinya dan menggantinya dengan label penyamar 
 *    seperti "[nama]" atau "[nomor telepon]".
 * 3. Terakhir, teks yang sudah disensor ini akan dirapikan spasi berlebihnya 
 *    dan dipotong agar panjangnya pas, tidak lebih dari lima ratus dua belas huruf.
 */

// Perbaikan regex: Kami menghapus flag 'i' dan mendefinisikan variasi awalan huruf besar/kecil
// secara manual seperti [Ss]aya dan [Aa]ku. Jika kita menggunakan flag 'i', aturan [A-Z] pada pola
// nama akan terabaikan, sehingga kata sifat biasa seperti "senang" dalam kalimat "Saya senang" 
// akan ikut tersensor menjadi "[nama]". Pendekatan ini menjaga privasi tanpa merusak makna kalimat.

const NAME_PATTERNS = [
  /\b([Ss]aya|[Aa]ku|[Gg]ue|[Gg]ua)\s+([A-Z][a-z]+)\b/g,
  /\b[A-Z][a-z]+\s(bin|binti)\s[A-Z][a-z]+\b/g,
];
const ID_NUMBER_PATTERN = /\b\d{16}\b/g;
const PHONE_PATTERN = /\b(?:\+62|62|0)8\d{8,11}\b/g;

export function anonymizeText(text: string): string {
  let result = text;
  for (const pattern of NAME_PATTERNS) {
    result = result.replace(pattern, '[nama]');
  }
  result = result.replace(ID_NUMBER_PATTERN, '[nomor identitas]');
  result = result.replace(PHONE_PATTERN, '[nomor telepon]');
  return result.trim().slice(0, 512);
}

// KETERBATASAN (KNOWN LIMITATIONS):
//  Sistem ini menggunakan pencocokan pola dasar (regex), bukan Kecerdasan Buatan (NER).
//  Nama orang yang berdiri sendiri atau tidak didahului kata ganti (misal: "Kemarin ketemu Dinda di kampus") 
//  TIDAK AKAN tersensor. Ini bertindak sebagai pencegahan dasar, bukan anonimisasi sempurna.
