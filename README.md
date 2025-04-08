# BOT MultiSend Token & ETH

[ENGLISH VERSION](https://github.com/caraka15/multi-send-tool/blob/main/eng_README.md)

## Gambaran Umum

Alat ini memungkinkan transfer batch yang efisien untuk ETH asli dan token ERC20 ke banyak alamat penerima dalam satu operasi. Alat ini dapat membaca alamat penerima langsung dari dokumen Google Sheets dan mendukung distribusi dengan jumlah tetap maupun acak.

## Fitur-Fitur

- Kirim ETH asli atau token ERC20 ke beberapa alamat sekaligus
- Impor alamat penerima langsung dari Google Sheets
- Pilih antara jumlah tetap atau acak untuk setiap penerima
- Pengaturan gas yang dapat disesuaikan
- Pelacakan status transaksi secara real-time
- Output konsol berwarna untuk keterbacaan yang lebih baik
- Menunggu konfirmasi transaksi secara otomatis untuk keamanan

## Prasyarat

- Node.js terinstal pada sistem Anda
- Pemahaman dasar tentang transaksi Ethereum
- Google Sheet dengan alamat penerima di kolom B

## Instalasi

1. Clone repository:

```bash
git clone https://github.com/caraka15/multi-send-tool.git
cd multi-send-tool
```

2. Instal dependensi:

```bash
npm install ethers readline axios dotenv
```

3. Buat file `.env` di direktori utama dengan konten berikut:

```
PRIVATE_KEY=PRIVATE_KEY_DOMPET_ANDA
RPC_URL=URL_RPC_ANDA
```

## Cara Penggunaan

1. Jalankan skrip:

```bash
node bot.js
```

2. Ikuti petunjuk interaktif:
   - Pilih antara mengirim ETH asli atau token ERC20
   - Untuk token ERC20, masukkan alamat kontrak, simbol, dan desimal
   - Pilih antara jumlah tetap atau acak untuk setiap transfer
   - Atur parameter gas (batas gas dan harga gas)
   - Alat akan mengambil alamat dari Google Sheet Anda dan melakukan transfer

## Integrasi Google Sheets

Alat ini secara otomatis mengambil alamat penerima dari Google Sheet:

1. Buat Google Sheet dengan alamat penerima di kolom B (dimulai dari baris 2)
2. Pastikan sheet tersebut dapat diakses publik atau memiliki pengaturan berbagi "Siapa saja dengan tautan dapat melihat"
3. Jika Anda ingin menggunakan Google Sheet yang berbeda, perbarui variabel `sheetId` dan `gid` dalam skrip

ID Google Sheet default saat ini: `1rImLq4NMEAk5cPBGBW1-d3jI-4QC0oQoFU-JHrDostk`

## Integrasi Kontrak

Untuk pengguna testnet Sepolia, Anda dapat menggunakan kontrak MultiSend yang di-deploy di:
`0x847d23084C474E7a0010Da5Fa869b40b321C8D7b`

Kontrak ini memungkinkan Anda untuk:

- Men-deploy token Anda sendiri
- Menggunakan fungsi multi-send bawaan melalui kontrak

Akses kontrak di: [Antarmuka Kontrak Sepolia](https://sepolia.tea.xyz/address/0x847d23084C474E7a0010Da5Fa869b40b321C8D7b?tab=write_contract)

## Keamanan

- Alat ini menggunakan variabel lingkungan melalui dotenv untuk menjaga keamanan private key Anda
- Jangan pernah meng-commit file `.env` Anda ke version control
- Tambahkan `.env` ke file `.gitignore` Anda untuk mencegah commit yang tidak disengaja

## Jenis Transaksi

### Transfer ETH Asli

Ketika memilih jenis transfer "native", alat akan mengirim ETH langsung ke alamat penerima.

### Transfer Token ERC20

Ketika memilih jenis transfer "token", Anda perlu menyediakan:

- Alamat kontrak token
- Simbol token (untuk tujuan tampilan)
- Desimal token (default adalah 18)

## Opsi Distribusi Jumlah

1. **Jumlah Tetap**: Kirim jumlah yang sama ke setiap penerima
2. **Jumlah Acak**: Kirim jumlah acak (antara minimum dan maksimum yang Anda tentukan) ke setiap penerima

## Menyesuaikan Pengaturan Gas

Anda dapat menyesuaikan:

- Batas Gas (default: 100000)
- Harga Gas dalam Gwei (default: 1.8)

## Pemecahan Masalah

Masalah umum dan solusinya:

1. **Error Dana Tidak Mencukupi**: Pastikan dompet Anda memiliki cukup ETH untuk transfer dan biaya gas
2. **Harga Gas Terlalu Rendah**: Jika transaksi tertunda terlalu lama, naikkan harga gas
3. **Error Akses Google Sheets**: Pastikan Google Sheet Anda dapat diakses publik
4. **Variabel Lingkungan Tidak Ada**: Periksa bahwa file `.env` Anda sudah dikonfigurasi dengan benar dan dimuat

## Praktik Terbaik

- Selalu uji dengan jumlah kecil di testnet terlebih dahulu
- Pantau harga gas dan sesuaikan seperlunya
- Periksa output skrip Anda secara teratur untuk setiap kesalahan
- Jaga keamanan private key dompet Anda setiap saat
