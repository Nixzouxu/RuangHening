/**
 * PENGATURAN MEMORI SEMENTARA (REDIS)
 * 
 * Bagian ini bertugas untuk menyambungkan aplikasi kita dengan alat bernama Redis. 
 * Redis ini ibarat buku catatan kecil yang kerjanya sangat cepat. Aplikasi kita menggunakan 
 * buku ini untuk mengingat hal-hal penting yang sifatnya sementara, contohnya seperti 
 * tiket masuk pengguna (sesi) yang kita bahas di kode sebelumnya.
 * 
 * Yang dilakukan kode ini sangat sederhana:
 * 1. Membuat jalur penghubung ke alat memori sementara berdasarkan alamat dari pengaturan.
 * 2. Memasang alarm otomatis. Jika tiba-tiba koneksinya terputus atau ada masalah, 
 *    sistem akan langsung menuliskannya di buku catatan laporan kita.
 * 3. Membuat tombol sakelar (fungsi) untuk menyalakan koneksi. Sebelum menyalakan, 
 *    sistem akan mengecek dulu: "Apakah koneksinya sudah jalan?". Kalau belum, 
 *    baru dihidupkan. Ini berguna agar aplikasi tidak mencoba menyambung berkali-kali 
 *    dan membuat sistem kebingungan.
 */
import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const redis = createClient({ url: env.REDIS_URL });

redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    logger.info('Redis berhasil terkoneksi');
  }
}