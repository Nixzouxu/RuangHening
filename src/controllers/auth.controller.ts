/**
 * PENGATUR PENDAFTARAN DAN AKSES MASUK (CONTROLLER)
 * 
 * Bagian ini bertugas melayani permintaan langsung dari pengguna.
 * 
 * Pertama, kita membuat aturan formulir:
 * - Untuk mendaftar: Nama minimal 3 huruf, kata sandi minimal 8 huruf.
 * - Untuk masuk: Nama dan kata sandi tidak boleh kosong.
 * 
 * Kedua, kita membuat aturan penitipan "tiket cadangan" di dalam peramban (browser) pengguna.
 * Tiket ini disimpan dengan sangat aman sehingga tidak bisa dicuri oleh program jahat di internet.
 * 
 * Selanjutnya, ada empat pelayan utama di sini:
 * 1. Pelayan Daftar: Menerima data pendaftaran, memastikannya sesuai aturan, lalu menyimpannya.
 * 2. Pelayan Masuk: Memeriksa nama dan sandi. Jika benar, ia memberikan tiket utama secara langsung 
 *    dan menitipkan tiket cadangan secara diam-diam di peramban pengguna.
 * 3. Pelayan Perpanjang Tiket: Mengecek apakah ada tiket cadangan di peramban pengguna. 
 *    Jika ada dan sah, ia akan memberikan tiket utama yang baru.
 * 4. Pelayan Keluar (Logout): Membuang semua tiket cadangan dari sistem dan membersihkan titipan tiket 
 *    dari peramban pengguna agar akunnya benar-benar terkunci aman.
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { env } from '../config/env';

const registerSchema = z.object({
  displayName: z.string().min(3).max(30),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

const loginSchema = z.object({
  displayName: z.string().min(1),
  password: z.string().min(1),
});

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, password } = registerSchema.parse(req.body);
    const user = await authService.register(displayName, password);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, refreshTokenId } = await authService.login(displayName, password);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie('refreshTokenId', refreshTokenId, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'NO_REFRESH_TOKEN', message: 'Tidak ada sesi aktif' });
      return;
    }
    const { accessToken, refreshToken, refreshTokenId } = await authService.refreshTokens(token);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie('refreshTokenId', refreshTokenId, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshTokenId = req.cookies?.refreshTokenId;
    if (refreshTokenId) await authService.logout(refreshTokenId);
    res.clearCookie('refreshToken');
    res.clearCookie('refreshTokenId');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}