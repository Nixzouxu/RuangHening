// Mengambil wadah aplikasi web yang sudah kita buat dan lengkapi pengaturannya di berkas lain
import { app } from './app';
// Mengambil pengaturan sistem, seperti di jalur mana aplikasi ini harus berjalan
import { env } from './config/env';
// Mengambil alat pencatat otomatis untuk memberikan laporan aktivitas aplikasi
import { logger } from './utils/logger';
// Mengambil fungsi untuk menyalakan koneksi ke Redis (dipakai untuk sesi login dan pembatasan permintaan)
import { connectRedis } from './lib/redis';

// Fungsi utama yang mengatur urutan penyalaan aplikasi: sambungkan dulu ke Redis,
// baru setelah itu aplikasi web dibuka untuk menerima kunjungan. Urutan ini penting 
// kalau dibalik, permintaan pertama yang masuk bisa gagal karena Redis belum siap.
async function main() {
  await connectRedis();

  app.listen(env.PORT, () => {
    // Menulis pesan sukses ke buku catatan bahwa mesin utama aplikasi Innerly sudah berhasil menyala.
    logger.info(`Innerly backend jalan di port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main();