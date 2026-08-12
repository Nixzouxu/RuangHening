import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { env } from '../config/env';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message);
  }
}

export async function register(displayName: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { displayName } });
  if (existing) {
    throw new AppError('DISPLAY_NAME_TAKEN', 'Nama tampilan sudah dipakai', 409);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.create({
    data: { displayName, passwordHash },
  });

  return { id: user.id, displayName: user.displayName };
}

export async function login(displayName: string, password: string) {
  const user = await prisma.user.findUnique({ where: { displayName } });

  // Selalu jalankan verifikasi meski user tidak ditemukan, untuk mencegah
  // timing attack yang bisa membedakan "user tidak ada" vs "password salah"
  // dari lamanya waktu respons.
  const dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RkFLRUhBU0hVTlRVS1RFU1Q';
  const isMatch = user
    ? await argon2.verify(user.passwordHash, password).catch(() => false)
    : await argon2.verify(dummyHash, password).catch(() => false);

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Nama tampilan atau kata sandi salah', 401);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('ACCOUNT_LOCKED', 'Akun terkunci sementara, coba lagi nanti', 423);
  }

  if (!isMatch) {
    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });
    throw new AppError('INVALID_CREDENTIALS', 'Nama tampilan atau kata sandi salah', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  return issueTokenPair(user.id, user.displayName);
}

async function issueTokenPair(userId: string, displayName: string) {
  const accessToken = jwt.sign({ userId, displayName }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshTokenId = randomUUID();
  const refreshToken = jwt.sign({ userId, jti: refreshTokenId }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });

  await redis.set(`refresh:${refreshTokenId}`, userId, { EX: REFRESH_TOKEN_TTL_SECONDS });

  return { accessToken, refreshToken, refreshTokenId };
}

export async function refreshTokens(refreshToken: string) {
  let payload: { userId: string; jti: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Sesi tidak valid, silakan login ulang', 401);
  }

  const stored = await redis.get(`refresh:${payload.jti}`);
  if (!stored) {
    // Token tidak ada di Redis: sudah dipakai sebelumnya (rotation) atau sudah dicabut.
    // Kemungkinan indikasi token dicuri dan dipakai ulang - cabut semua sesi user ini.
    await revokeAllSessionsForUser(payload.userId);
    throw new AppError('REFRESH_TOKEN_REUSED', 'Sesi dicurigai tidak aman, silakan login ulang', 401);
  }

  await redis.del(`refresh:${payload.jti}`); // rotation: token lama langsung tidak berlaku

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
  return issueTokenPair(user.id, user.displayName);
}

export async function revokeAllSessionsForUser(userId: string) {
  const keys = await redis.keys('refresh:*');
  for (const key of keys) {
    const value = await redis.get(key);
    if (value === userId) await redis.del(key);
  }
}

export async function logout(refreshTokenId: string) {
  await redis.del(`refresh:${refreshTokenId}`);
}