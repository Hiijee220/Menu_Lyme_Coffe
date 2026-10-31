# Lyme Coffee

Website menu digital Lyme Coffee. Semua kode, gambar, dan font disimpan dalam repository ini.

## Mengubah menu
Edit `menu-data.js` untuk nama, harga (rupiah), deskripsi, kategori, dan foto menu. Edit `index.html` untuk nama toko dan cerita; `styles.css` untuk desain; `app.js` untuk interaksi. Semua foto dan font berada di `assets/`.

## GitHub Pages
Di Settings → Pages, pilih Deploy from a branch, branch main, folder / (root), lalu Save. Perubahan pada main akan diterbitkan otomatis oleh GitHub Pages. Tidak memerlukan build atau instalasi paket.

Menu dan harga saat ini merupakan contoh. Favorit dan daftar pilihan tersimpan di browser masing-masing. Tidak ada pesanan atau pembayaran yang dikirim.

## Halaman admin
Buka `admin.html`. Gunakan fine-grained GitHub personal access token yang hanya memilih repository ini, dengan Contents: Read and write. Token hanya ada di memori halaman dan tidak disimpan di localStorage, sessionStorage, atau repository. Keluar atau tutup tab untuk mengakhiri sesi.

Admin menyimpan nama, harga, deskripsi, foto dan status tersedia/habis ke `menu.json` melalui commit atomik. Foto diperkecil di browser lalu disimpan ke `assets/uploads/`. Perubahan memicu publikasi GitHub Pages; beri waktu beberapa menit. Halaman publik memeriksa data baru setiap 60 detik setelah versi GitHub Pages selesai terbit. Draf dilindungi dari penimpaan perubahan sesi lain; penyimpanan ditolak jika data atau branch berubah.

Data utama: `menu.json`; `menu-data.js` adalah cadangan saat pemuatan data gagal.
