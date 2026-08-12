/**
 * PAPAN PETUNJUK ARAH JALUR MASUK (ROUTER)
 * 
 * Bagian ini sangat sederhana, fungsinya mirip seperti papan petunjuk di gedung.
 * Jika ada permintaan dari luar aplikasi, bagian ini yang akan mengarahkannya ke pelayan yang tepat.
 * - Yang mau ke alamat "/register" diarahkan ke pelayan pendaftaran.
 * - Yang mau ke alamat "/login" diarahkan ke pelayan masuk.
 * - Yang mau ke alamat "/refresh" diarahkan ke pelayan perpanjangan tiket.
 * - Yang mau ke alamat "/logout" diarahkan ke pelayan keluar.
 */
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;