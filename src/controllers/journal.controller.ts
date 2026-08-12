/**
 * PENGATUR BUKU HARIAN DAN ATURAN PENULISAN
 * 
 * Bagian ini adalah pelayan (controller) yang khusus mengurus lalu lintas tulisan pengguna.
 * Di sini kita juga memanggil alat-alat bantu yang dibutuhkan dan membuat aturan tegas 
 * untuk formulir penulisan catatan baru:
 * - Isi cerita tidak boleh kosong dan panjangnya tidak boleh lebih dari lima ribu huruf.
 * - Pengguna boleh menempelkan label untuk mengelompokkan cerita, tapi maksimal hanya sepuluh label.
 *   Kalau pengguna tidak menempelkan label sama sekali, sistem otomatis menganggapnya kosong.
 */
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as journalRepo from '../repositories/journal.repository';

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).max(10).default([]),
});

/**
 * PELAYAN PENYIMPAN CATATAN BARU
 * 
 * Tugas fungsi ini mirip seperti petugas penerima naskah:
 * 1. Menerima cerita dan label yang dikirim oleh pengguna dari aplikasi.
 * 2. Memeriksa tulisan tersebut secara ketat menggunakan aturan formulir yang sudah kita buat di atas.
 * 3. Jika semuanya aman dan sesuai aturan, pelayan ini akan menyuruh asisten database (journalRepo) 
 *    untuk mengunci rahasia ceritanya dan menyimpannya ke gudang data.
 * 4. Setelah berhasil disimpan, pelayan akan membalas ke pengguna dengan memberikan "tanda terima" 
 *    sukses berupa nomor pengenal catatan dan waktu pembuatannya.
 * 5. Jika terjadi masalah (misalnya tulisan terlalu panjang atau sistem error), masalahnya akan dilempar 
 *    ke Pusat Penanganan Masalah yang sudah kita buat sebelumnya agar diurus dengan rapi.
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content, tags } = createSchema.parse(req.body);
    const entry = await journalRepo.createJournalEntry(req.userId!, content, tags);
    res.status(201).json({ id: entry.id, createdAt: entry.createdAt });
  } catch (err) {
    next(err);
  }
}

/**
 * PELAYAN PENCARI DAFTAR CATATAN
 * 
 * Fungsi ini bertugas melayani pengguna yang membuka halaman riwayat untuk membaca semua catatannya.
 * Cara kerjanya:
 * 1. Pelayan melihat tanda pengenal pengguna yang sedang meminta data (menggunakan userId).
 * 2. Ia lalu menyuruh asisten database (journalRepo) untuk mengambilkan semua daftar catatan 
 *    yang benar-benar hanya milik orang tersebut. Di tahap ini, ingat bahwa database akan 
 *    otomatis membuka kunci rahasia catatannya agar bisa dibaca.
 * 3. Setelah datanya terkumpul, pelayan akan membungkusnya dan mengirimkannya kembali ke layar aplikasi.
 * 4. Sama seperti pelayan penyimpan, kalau ada masalah di tengah jalan, langsung dilaporkan 
 *    ke pusat penanganan masalah.
 */
export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const entries = await journalRepo.listJournalEntries(req.userId!);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

// Soal req.userId!: tanda seru (!) di sini bilang ke TypeScript "saya yakin ini tidak undefined". Ini aman dipakai hanya di controller yang route-nya sudah dipasangi requireAuth middleware duluan (yang mengisi req.userId atau menghentikan request dengan 401 sebelum sampai controller). Kalau kamu lupa pasang requireAuth di route-nya, req.userId akan benar-benar undefined saat runtime meski TypeScript tidak komplain - jadi ini bukan jaminan otomatis, tapi kontrak yang harus kamu jaga sendiri konsistensinya.