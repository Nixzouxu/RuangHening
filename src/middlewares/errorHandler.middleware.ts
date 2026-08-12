/**
 * PUSAT PENANGANAN MASALAH (ERROR HANDLER)
 * 
 * Ini adalah jaring pengaman terakhir di aplikasi kita. Jika terjadi sesuatu yang salah atau rusak, 
 * bagian ini yang akan menangkap dan merapikan pesannya sebelum dikirim kembali ke pengguna.
 * 
 * Ada tiga jenis masalah yang diurus di sini:
 * 1. Salah isi formulir: Misalnya kata sandi kurang panjang. Sistem akan membalas dengan pesan 
 *    bahwa ada isian yang tidak valid.
 * 2. Kesalahan yang sudah kita tebak sebelumnya: Misalnya nama pengguna sudah dipakai orang lain. 
 *    Sistem akan membalas dengan pesan peringatan yang rapi dan mencatatnya di buku laporan.
 * 3. Kesalahan parah yang tidak terduga: Misalnya mesin database mati. Daripada menampilkan kode 
 *    rusak yang bikin pengguna panik atau dimanfaatkan peretas, sistem akan membalas dengan pesan 
 *    ramah "Terjadi kesalahan, tim kami sudah diberi tahu", lalu mencatat penyebab asli kerusakannya 
 *    ke dalam buku laporan khusus untuk dibaca oleh tim pembuat aplikasi (programmer).
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../services/auth.service';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Input tidak valid', details: err.errors });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ code: err.code, path: req.path }, err.message);
    res.status(err.statusCode).json({ error: err.code, message: err.message });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Terjadi kesalahan, tim kami sudah diberi tahu' });
}