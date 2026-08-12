/**
 * PENJAGA PINTU HALAMAN KHUSUS (MIDDLEWARE)
 * 
 * Bagian ini berfungsi seperti satpam yang berjaga di pintu-pintu ruangan penting di dalam aplikasi kita.
 * Jika ada orang yang ingin mengakses data pribadi atau melakukan tindakan khusus, satpam ini akan:
 * 1. Memeriksa apakah orang tersebut membawa "tiket masuk" (token).
 * 2. Memastikan tiket tersebut asli, formatnya benar (dimulai dengan kata 'Bearer'), dan belum kedaluwarsa.
 * 3. Jika tiketnya sah, satpam akan mengenali siapa orang ini (mendapatkan userId) dan mempersilakan masuk.
 * 4. Jika tiketnya palsu atau tidak ada, satpam akan langsung menolak dan menyuruh orang tersebut pergi.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token tidak ditemukan' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token tidak valid atau kedaluwarsa' });
  }
}