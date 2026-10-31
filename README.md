# Lyme Coffee

Website menu digital Lyme Coffee. Semua kode, gambar, dan font disimpan dalam repository ini.

## Mengubah menu
Edit `menu-data.js` untuk nama, harga (rupiah), deskripsi, kategori, dan foto menu. Edit `index.html` untuk nama toko dan cerita; `styles.css` untuk desain; `app.js` untuk interaksi. Semua foto dan font berada di `assets/`.

## GitHub Pages
Di Settings → Pages, pilih Deploy from a branch, branch main, folder / (root), lalu Save. Perubahan pada main akan diterbitkan otomatis oleh GitHub Pages. Tidak memerlukan build atau instalasi paket.

Menu dan harga saat ini merupakan contoh. Favorit dan daftar pilihan tersimpan di browser masing-masing. Tidak ada pesanan atau pembayaran yang dikirim.

## Email admin migration (feature branch)
Firebase project: menu-lyme-coffe. Admin uses Google sign-in with verified email. Primary admin remajasilo.rs@gmail.com can grant/revoke other admin emails. Firestore rules enforce access to lymeMenus and lymeAdmins. Photos and menu updates are saved in Firebase; source stays in GitHub.

Backend setup and security verification must be completed before merging this feature branch. See firebase/IMPLEMENTATION.md.
