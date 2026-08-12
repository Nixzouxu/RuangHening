/**
 * ALAT PENGHUBUNG DATABASE DAN PENGAMANAN AKSES EKSTRA
 * 
 * Kode ini membuat jalur komunikasi utama ke database, sama seperti sebelumnya. 
 * Tapi di sini, kita menambahkan satu fitur khusus yang sangat canggih bernama 
 * "Konteks Pengguna" (withUserContext).
 * 
 * Bayangkan database kita adalah sebuah gudang penyimpanan yang dijaga sangat ketat. 
 * Biasanya, aplikasi kita masuk begitu saja untuk mengambil atau menaruh barang. 
 * Nah, dengan fungsi khusus ini, setiap kali aplikasi mau melakukan sesuatu di dalam 
 * gudang, ia harus mengikuti aturan ini:
 * 1. Meminta izin buka pintu khusus agar prosesnya tidak diganggu yang lain (transaksi).
 * 2. Membisikkan pesan rahasia ke penjaga gudang (database): "Tolong ingat ya, 
 *    semua hal yang saya lakukan sekarang ini adalah atas perintah pengguna 
 *    dengan tanda pengenal ini (userId)."
 * 3. Setelah penjaga tahu siapa pengguna aslinya, barulah aplikasi kita 
 *    menjalankan tugas yang diminta.
 * 
 * Kenapa cara ini sangat keren? Karena dengan memberi tahu identitas pengguna langsung 
 * ke penjaga gudang (database), kita bisa membuat aturan keamanan berlapis. 
 * Database bisa otomatis mencatat siapa yang mengubah data, atau bahkan langsung menolak 
 * jika ada yang diam-diam mencoba mengintip data milik orang lain.
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function withUserContext<T>(
  userId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
    return fn(tx as unknown as PrismaClient);
  });
}

// Peringatan keamanan: $executeRawUnsafe di sini aman karena userId selalu berasal dari req.userId yang sudah diverifikasi signature JWT-nya oleh requireAuth (bukan input bebas dari body/query request), dan formatnya UUID (dari randomUUID() Prisma). Jangan pernah memakai pola serupa untuk nilai yang datang langsung dari req.body/req.query tanpa validasi ketat - itu berisiko SQL injection.