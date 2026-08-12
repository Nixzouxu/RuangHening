// Mengambil alat bantu bernama pino untuk mencatat setiap kejadian atau aktivitas di dalam aplikasi
import pino from 'pino';

// Membuat buku catatan otomatis yang bisa digunakan di seluruh bagian aplikasi
export const logger = pino({
  // Mengatur seberapa lengkap catatan dibuat. Jika aplikasi sudah rilis, catat yang penting saja. Jika masih dibuat, catat sedetail mungkin.
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // Melindungi privasi pengguna dengan cara menyensor kata sandi dan tiket akses rahasia agar tidak ikut tertulis di buku catatan
  redact: ['req.headers.authorization', 'req.body.password'],
});