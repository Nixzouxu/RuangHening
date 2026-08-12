// Memasukkan kerangka utama untuk membuat aplikasi web dengan mudah
import express from 'express';

// Memasukkan alat untuk mengatur siapa saja dari luar yang boleh mengakses aplikasi kita
import cors from 'cors';

// Memasukkan alat pelindung tambahan untuk menjaga keamanan aplikasi dari serangan jahat
import helmet from 'helmet';

// Memasukkan alat untuk membaca data kecil yang disimpan di peramban web pengguna
import cookieParser from 'cookie-parser';

// Mengambil pengaturan sistem yang sudah kita buat di berkas sebelumnya
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import journalRoutes from './routes/journal.routes';

// Membuat wadah aplikasi web baru dan membukanya agar bisa digunakan di bagian lain
export const app = express();

// Memasang pelindung keamanan otomatis pada aplikasi web kita
app.use(helmet());

// Mengatur pintu masuk keamanan aplikasi
app.use(cors({
  // Hanya mengizinkan akses dari alamat situs web tampilan depan yang sudah kita atur
  origin: env.FRONTEND_URL,
  // Mengizinkan pengunjung untuk membawa tanda pengenal mereka saat masuk
  credentials: true,
}));

// Mengaktifkan alat pembaca data kecil tadi agar aplikasi mengenali pengunjung
app.use(cookieParser());

// Mengizinkan aplikasi untuk menerima data teks berstruktur dari luar. 
// Ukurannya dibatasi maksimal satu megabyte agar aplikasi tidak kelebihan muatan dan macet.
app.use(express.json({ limit: '1mb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use(errorHandler);


// Membuat jalur khusus untuk memeriksa kondisi aplikasi
app.get('/health', (_req, res) => {
  // Jika jalur ini diakses, aplikasi akan membalas bahwa kondisinya baik-baik saja
  // beserta catatan waktu saat ini untuk memastikan aplikasi tidak berhenti bekerja
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});