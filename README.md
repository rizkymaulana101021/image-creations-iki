# 🎨 ImageCreations Iki

> **Web Application Client-Side untuk Pengolahan Citra & Konversi PDF**  
> 100% Berjalan di Browser Pengguna • Privasi Aman • Siap Deploy di GitHub Pages.

![GitHub Pages Ready](https://img.shields.io/badge/Deployment-GitHub%20Pages-success?style=flat-square&logo=github)
![Tech Stack](https://img.shields.io/badge/Frontend-HTML5%20%7C%20Tailwind%20CSS%20%7C%20JS-blue?style=flat-square)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald?style=flat-square)

---

## 🌟 Fitur Utama

1. **📏 Foto Resize (Ubah Ukuran)**
   * Skala cepat (25%, 50%, 75%, 150%).
   * Dimensi kustom (Lebar & Tinggi) dengan opsi *Lock Aspect Ratio*.
   * Preset ukuran populer (Instagram Post 1:1, Story/Reels 9:16, YouTube Thumbnail 16:9, Twitter Header).
   * Konversi format output (PNG, JPEG, WebP) dengan kontrol slider kualitas.
   * Algoritma *stepped downsampling* untuk hasil tajam tanpa pecah/buram.

2. **✂️ Cut / Crop (Potong & Transformasi)**
   * Seleksi crop interaktif dengan preset rasio: Bebas, 1:1, 4:3, 16:9, 9:16.
   * Putar foto (Rotate -90° / +90°).
   * Cermin foto (Flip Horizontal & Flip Vertical).
   * Live preview dimensi hasil potong secara real-time.

3. **🚀 Upscaler (Resolusi Super & Penajaman)**
   * Tingkatkan resolusi gambar hingga **2x** dan **4x**.
   * Dilengkapi filter penajaman algoritma *Unsharp Masking (Convolution Kernel)* untuk memulihkan detail tepi foto.
   * Opsi *Reduksi Noise* untuk meredam artefak kompresi JPEG.
   * Fitur interaktif **Before/After Split Slider** untuk membandingkan ketajaman secara langsung.

4. **📄 JPG/PNG Convert to PDF (Konversi ke PDF)**
   * Unggah banyak gambar sekaligus (Batch upload).
   * Atur urutan halaman naik/turun (*Move Up / Down*) atau hapus foto.
   * Pengaturan kertas: A4, Letter, atau Sesuai Ukuran Gambar (*Fit to Image*).
   * Pengaturan orientasi (Auto, Portrait, Landscape) dan margin (0mm, 5mm, 10mm).
   * Satu klik langsung buat dan unduh file PDF utuh.

---

## 🔒 Privasi & Kecepatan (Client-Side)

Seluruh proses manipulasi gambar dilakukan **100% di memori browser lokal perangkat Anda** menggunakan HTML5 Canvas, Web APIs, dan jsPDF.
* Foto Anda **tidak pernah diunggah** ke server mana pun di internet.
* Tidak memerlukan koneksi internet cepat saat memproses gambar.
* Gratis selamanya tanpa biaya server/hosting.

---

## 🚀 Cara Menjalankan Secara Lokal

Cukup buka file `index.html` menggunakan browser modern apa pun (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari):
1. Masuk ke folder proyek:
   ```bash
   cd image-creations-iki
   ```
2. Klik ganda file `index.html`, atau buka melalui extension **Live Server** di VS Code.

---

## 🌐 Cara Upload ke GitHub & Mengaktifkan GitHub Pages

Aplikasi ini dirancang khusus agar langsung bisa online gratis menggunakan **GitHub Pages**:

### Langkah 1: Buat Repositori di GitHub
1. Buka [GitHub](https://github.com) dan login ke akun Anda.
2. Klik tombol **New Repository** (Repositori Baru).
3. Beri nama repositori: `image-creations-iki`.
4. Pilih **Public**, lalu klik **Create repository**.

### Langkah 2: Upload File Proyek
Anda bisa mengunggah file dengan salah satu cara berikut:

* **Cara A (Lewat Git Terminal - jika terpasang Git):**
  ```bash
  git init
  git add .
  git commit -m "Initial commit ImageCreations Iki"
  git branch -M main
  git remote add origin https://github.com/USERNAME_ANDA/image-creations-iki.git
  git push -u origin main
  ```

* **Cara B (Lewat Web GitHub - Paling Mudah tanpa instalasi):**
  1. Di halaman repositori GitHub baru Anda, klik tautan **"uploading an existing file"**.
  2. Drag & drop seluruh isi folder ini (`index.html`, folder `css`, folder `js`, dan `README.md`).
  3. Klik tombol hijau **"Commit changes"**.

### Langkah 3: Aktifkan GitHub Pages
1. Di repositori GitHub Anda, buka tab **Settings** (Pengaturan).
2. Di menu sebelah kiri, klik menu **Pages**.
3. Di bagian **Build and deployment**:
   * **Source**: Pilih `Deploy from a branch`
   * **Branch**: Pilih `main` dan folder `/(root)`
   * Klik tombol **Save**.
4. Tunggu sekitar 1 - 2 menit, lalu refresh halaman tersebut.
5. Anda akan mendapatkan URL web yang sudah aktif, misalnya:
   ```
   https://USERNAME_ANDA.github.io/image-creations-iki/
   ```

---

## 🛠️ Teknologi yang Digunakan

* **HTML5 & CSS3**
* **Tailwind CSS** (Utility-first styling via CDN)
* **Vanilla JavaScript ES6+ Modules**
* **[Cropper.js](https://fengyuanchen.github.io/cropperjs/)** (Interactive image cropping)
* **[jsPDF](https://github.com/parallax/jsPDF)** (Client-side PDF generation)
* **[Lucide Icons](https://lucide.dev/)** (Modern lightweight iconography)
* **[Canvas Confetti](https://www.kirilv.com/canvas-confetti/)** (Celebration visual effect)

---

## 📄 Lisensi
MIT License - Bebas digunakan dan dikembangkan untuk keperluan pribadi maupun portofolio.
