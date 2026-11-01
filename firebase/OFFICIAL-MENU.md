# Official LyMe menu and logo

Source: owner's logo and printed menu supplied November 1, 2026. The original logo JPEG is preserved unchanged at `assets/lyme-logo.jpg`; CSS displays its artwork without the surrounding page whitespace. All product photos use an explicit placeholder until the owner uploads real photos.

The supplied list is transcribed into `menu.json` and `menu-data.js`: 13 coffee entries, 19 non-coffee entries (milk, matcha, tea and mocktail), and 13 Camu-camu/dessert entries, including one unresolved extra Roti Bakar row. Values shown as 10/15/17/20 on the printed menu are stored as Rp10,000/Rp15,000/Rp17,000/Rp20,000.

Five entries are unavailable with price zero and a `Konfirmasi harga` tag. The public site displays **Tanya kasir**, never a free checkout price:

- Americano, Lemon Tea and Lychee Tea: printed `7/10`; meaning of the two prices must be confirmed.
- Blue Lagoon Lemonade: no readable price on the supplied sheet.
- Roti Bakar Cokelat Keju: the additional row has no standalone price and may be part of the Roti Panggang listing. Keep unavailable pending clarification.

Banana Roll, Banana Crunchy and Roti Bakar each have Cokelat/Keju/Tiramisu choices, at the single listed price. The selected flavor is recorded in the order note. No oat-milk surcharge or unlisted temperature/sweetness choices are enabled for the supplied menu. Admin can later adjust the menu as needed.

The verified owner importing the admin page runs `syncOfficialCatalog` once per page session. It creates only missing official `lyme-*` menu records, preserves later edits/photos, and marks the twelve retired sample records unavailable. Old records are preserved for history and filtered from public/admin/checkout catalogs through `mergeCatalog`. Order history snapshots and merchant payment settings are untouched.

Once a price is confirmed, edit that entry's price and enable **Menu tersedia**, then save. This removes the confirmation marker and placeholder price label. New menu photos are optional; the admin can save a new menu with the placeholder and add its photo later.
