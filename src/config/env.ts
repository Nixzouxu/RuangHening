// Mengambil alat bantu bernama zod untuk memastikan data pengaturan sudah sesuai aturan
import { z } from 'zod';

// Membuat daftar aturan untuk pengaturan sistem aplikasi kita
const envSchema = z.object({
  // Menentukan status aplikasi sedang dibuat, diuji, atau sudah rilis. Nilai awalnya adalah sedang dibuat.
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Menentukan jalur komunikasi aplikasi. Jika tidak diisi, otomatis menggunakan jalur 4000.
  PORT: z.coerce.number().default(4000),
  
  // Alamat untuk menyambungkan aplikasi ke tempat penyimpanan data utama. Ini tidak boleh kosong.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  
  // Alamat untuk menyambungkan aplikasi ke sistem memori sementara. Ini juga tidak boleh kosong.
  REDIS_URL: z.string().min(1, 'REDIS_URL wajib diisi'),
  
  // Kunci rahasia untuk membuat tanda pengenal pengguna. Panjangnya tidak boleh kurang dari 32 huruf atau angka.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  
  // Kunci rahasia tambahan untuk memperbarui tanda pengenal pengguna. Syaratnya sama, minimal 32 huruf atau angka.
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  
  // Kunci utama untuk mengacak dan mengamankan data rahasia. Panjangnya harus pas 64 huruf atau angka.
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY harus 64 karakter hex (32 byte)'),
  
  // Kunci khusus untuk menggunakan layanan pihak ketiga bernama Huggingface. Ini sifatnya pilihan, boleh dikosongkan.
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Alamat situs web tampilan depan aplikasi kita. Harus berupa tautan situs web yang sah.
  FRONTEND_URL: z.string().url(),
  
  // Alamat khusus untuk mengirim laporan jika terjadi kesalahan atau gangguan pada aplikasi. Ini juga boleh dikosongkan.
  SENTRY_DSN: z.string().optional(),
});

// Membaca pengaturan dari sistem komputer, memeriksanya dengan aturan di atas, lalu menyiapkannya untuk digunakan
export const env = envSchema.parse(process.env);