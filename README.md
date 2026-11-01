# Lyme Coffee

Website menu digital Lyme Coffee. Kode, font, dan foto bawaan disimpan di repository ini.

## Website dan admin

Website: https://hiijee220.github.io/Menu_Lyme_Coffe/
Admin: https://hiijee220.github.io/Menu_Lyme_Coffe/admin.html

Masuk dengan Google menggunakan email yang diizinkan. Admin utama remajasilo.rs@gmail.com dapat menambah, menonaktifkan, atau menghapus akses email admin lain melalui Kelola akses admin. Admin tambahan dapat mengedit menu, harga, foto dan ketersediaan, tetapi tidak dapat mengelola akses admin.

## Penyimpanan dan pembaruan

Data menu dan foto yang diunggah melalui admin disimpan di Firebase project menu-lyme-coffe (Firestore Jakarta / asia-southeast2). Pembaruan menu disinkronkan ke halaman pengunjung melalui listener Firebase. Source website tetap di GitHub; commit di main memicu GitHub Pages. Tidak memerlukan build.

menu.json adalah menu cadangan ketika Firebase tidak tersedia; menu-data.js adalah cadangan tambahan. Ubah menu aktif melalui halaman admin. Edit index.html untuk cerita toko, styles.css untuk tampilan, dan app.js untuk interaksi. Foto bawaan dan font ada di assets/.

Aturan akses berada di firebase/firestore.rules. Konfigurasi web Firebase bersifat publik; keamanan ditegakkan oleh Authentication dan Firestore Rules, bukan dengan menyembunyikan file admin. Token GitHub tidak diperlukan untuk login admin.

Favorit dan daftar pilihan disimpan di browser masing-masing. Tidak ada pesanan atau pembayaran yang dikirim. Lihat firebase/IMPLEMENTATION.md untuk catatan validasi.
