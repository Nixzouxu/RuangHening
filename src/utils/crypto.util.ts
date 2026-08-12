/**
 * ALAT PENGACAK DAN PEMBUKA SANDI RAHASIA (KRIPTOGRAFI)
 * 
 * Ini adalah mesin utama untuk menjaga kerahasiaan buku harian pengguna.
 * Kita menggunakan standar keamanan tingkat tinggi (bernama AES-256-GCM), 
 * mirip dengan gembok pengaman yang dipakai oleh bank.
 * 
 * Ada dua tugas utama mesin ini:
 * 1. Mengunci (Encrypt): Mengubah teks biasa menjadi kode acak yang tidak bisa dibaca.
 *    Saat mengunci, mesin juga membuat "gembok unik" (IV) dan "segel keaslian" (Auth Tag)
 *    agar tidak ada yang bisa diam-diam mengubah isinya.
 * 2. Membuka Kunci (Decrypt): Mengubah kembali kode acak menjadi teks biasa. 
 *    Proses ini hanya berhasil kalau kuncinya pas, gemboknya benar, dan segelnya belum rusak.
 * 
 * Ingat, mesin ini butuh Kunci Utama (ENCRYPTION_KEY) dari pengaturan sistem 
 * yang sudah kamu buat di awal.
 */
import crypto from 'crypto';
import { env } from '../config/env';

// Kita menggunakan algoritma yang terbukti sangat aman dan cepat
const ALGORITHM = 'aes-256-gcm';

// Mengubah Kunci Utama dari bentuk teks menjadi format yang bisa dibaca oleh mesin pengacak
const SECRET_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

export function encryptField(text: string) {
  // Membuat gembok unik secara acak setiap kali ada tulisan baru
  const iv = crypto.randomBytes(12);
  
  // Menyiapkan mesin pengacak dengan kunci utama dan gembok unik tadi
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  // Memulai proses pengacakan dari teks biasa menjadi kode rahasia
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Membuat segel keaslian agar data tidak bisa dimodifikasi orang luar
  const authTag = cipher.getAuthTag().toString('hex');

  // Mengembalikan hasil acakan beserta gembok dan segelnya untuk disimpan ke database
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
  };
}

export function decryptField(ciphertext: string, ivHex: string, authTagHex: string) {
  // Membaca kembali gembok unik dan segel keaslian dari database
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Menyiapkan mesin pembuka sandi
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  
  // Memasang segel keaslian untuk dicek ulang
  decipher.setAuthTag(authTag);
  
  // Memulai proses membalikkan kode rahasia menjadi teks yang bisa dibaca manusia
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  // Mengembalikan hasil teks aslinya
  return decrypted;
}