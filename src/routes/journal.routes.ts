/**
 * PAPAN PETUNJUK ARAH BUKU HARIAN (ROUTER)
 * 
 * Bagian ini berfungsi seperti petugas pengatur jalan atau satpam khusus 
 * di area buku harian (jurnal). Tugasnya mengatur arah permintaan pengguna 
 * yang berkaitan dengan tulisan mereka.
 * 
 * Aturan ketat di area ini:
 * 1. Penjaga Pintu Wajib (requireAuth): Kita memasang aturan bahwa semua jalur 
 *    di area ini wajib melewati satpam pemeriksaan. Artinya, pengguna harus 
 *    sudah masuk (login) dan punya tiket yang sah. Kalau belum, mereka tidak 
 *    boleh lewat sama sekali.
 * 2. Jalur Pembuatan (POST '/'): Jika pengguna datang membawa cerita baru, 
 *    petugas akan langsung mengarahkannya ke pelayan bagian pembuatan catatan.
 * 3. Jalur Riwayat (GET '/'): Jika pengguna datang ingin membaca atau meminta 
 *    daftar ceritanya yang lama, petugas akan mengarahkannya ke pelayan 
 *    bagian pencarian daftar catatan.
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import * as journalController from '../controllers/journal.controller';

const router = Router();

router.use(requireAuth); // seluruh route jurnal wajib login
router.post('/', journalController.create);
router.get('/', journalController.list);

export default router;