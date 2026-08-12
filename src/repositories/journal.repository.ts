import { withUserContext } from '../lib/prisma';
import { encryptField, decryptField } from '../utils/crypto.util';

/**
 * FUNGSI MEMBUAT CATATAN BARU
 * 
 * Fungsi ini bertugas menyimpan cerita atau catatan harian baru milik pengguna.
 * Karena buku harian itu sifatnya sangat pribadi dan rahasia, sistem kita tidak 
 * akan pernah menyimpan teks aslinya ke dalam database secara sembarangan.
 * 
 * Cara kerjanya:
 * 1. Pertama, tulisan pengguna akan dikunci rapat dan diacak (enkripsi) menjadi 
 *    kode-kode rahasia. Kita juga menyimpan kunci pelengkapnya agar nanti bisa 
 *    dibuka lagi.
 * 2. Setelah aman menjadi kode rahasia, barulah kita menyuruh asisten database 
 *    menyimpannya. Kita juga memakai fitur "Konteks Pengguna" yang sudah kita 
 *    bahas sebelumnya, agar database tahu pasti siapa pemilik sah catatan ini.
 */
export async function createJournalEntry(userId: string, content: string, tags: string[]) {
  const encrypted = encryptField(content);
  return withUserContext(userId, (tx) =>
    tx.journalEntry.create({
      data: {
        ownerId: userId,
        contentEncrypted: encrypted.ciphertext,
        contentIv: encrypted.iv,
        contentAuthTag: encrypted.authTag,
        tags,
      },
    })
  );
}

/**
 * FUNGSI MENAMPILKAN DAFTAR CATATAN
 * 
 * Fungsi ini digunakan ketika pengguna ingin membuka halaman riwayat atau 
 * membaca kembali semua catatan yang pernah ia tulis.
 * 
 * Cara kerjanya:
 * 1. Kita meminta asisten database untuk mencarikan semua catatan milik pengguna 
 *    ini, diurutkan dari yang paling baru ditulis. 
 * 2. Di sini kita menerapkan prinsip "Keamanan Berlapis". Meskipun penjaga database 
 *    sudah tahu siapa penggunanya (dari fungsi konteks pengguna), aplikasi kita 
 *    tetap cerewet menegaskan ulang bahwa data yang diambil benar-benar hanya boleh 
 *    milik pengguna tersebut, tidak boleh ada yang bocor.
 * 3. Karena data yang keluar dari database masih berbentuk kode acak yang terkunci 
 *    rapat, aplikasi kita akan membukanya (dekripsi) satu per satu.
 * 4. Terakhir, catatan yang sudah bisa dibaca kembali dengan normal akan dikirim 
 *    ke layar pengguna, lengkap dengan label, skor sentimen perasaan, dan tanggalnya.
 */
export async function listJournalEntries(userId: string) {
  const entries = await withUserContext(userId, (tx) =>
    tx.journalEntry.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })
  );

  return entries.map((entry) => ({
    id: entry.id,
    content: decryptField(entry.contentEncrypted, entry.contentIv, entry.contentAuthTag),
    tags: entry.tags,
    sentimentScore: entry.sentimentScore,
    sentimentLabel: entry.sentimentLabel,
    createdAt: entry.createdAt,
  }));
}