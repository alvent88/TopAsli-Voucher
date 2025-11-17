import { Link } from "react-router-dom";
import { AuthButton } from "@/components/AuthButton";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
              <span className="text-2xl font-bold text-primary">
                TopAsli
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors">
                Kontak
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-[#E0B872]/10 via-[#1C2E44] to-[#0F1B2B] py-16 border-b border-[#E0B872]/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4 text-5xl md:text-6xl font-bold text-white">
              <span className="bg-gradient-to-r from-[#E0B872] to-[#F5D99B] bg-clip-text text-transparent">
                Kebijakan Privasi
              </span>
            </h1>
            <p className="text-xl text-slate-300">
              CV Top Asli - Perlindungan Data Pengguna
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-[#1C2E44] border border-[#E0B872]/30 rounded-2xl p-8 text-slate-300 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Pendahuluan</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Kebijakan Privasi ini menjelaskan bagaimana CV Top Asli ("Kami") mengumpulkan, menggunakan, melindungi, dan mengelola data pribadi Pengguna ("Anda") saat mengakses dan menggunakan situs web resmi kami yang menyediakan layanan penukaran voucher hadiah (redeem voucher) dari produk-produk snack hasil produksi CV Top Asli.
              </p>
              <p>
                Dengan mendaftar dan menggunakan layanan situs kami, Anda dianggap telah membaca, memahami, dan menyetujui Kebijakan Privasi ini. Apabila Anda tidak menyetujui sebagian atau seluruh isi Kebijakan Privasi ini, mohon untuk tidak menggunakan layanan kami.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Pengumpulan Data Pribadi</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Kami mengumpulkan data pribadi Pengguna yang diberikan secara langsung saat melakukan registrasi, login, maupun transaksi, termasuk namun tidak terbatas pada:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nama lengkap</li>
                <li>Nomor telepon</li>
                <li>Tanggal lahir</li>
                <li>Data transaksi (misalnya kode voucher, produk yang diredeem, waktu transaksi, dan nilai penukaran)</li>
              </ul>
              <p>
                Kami juga dapat secara otomatis mengumpulkan data non-pribadi seperti alamat IP, jenis perangkat, browser yang digunakan, serta aktivitas selama mengakses situs kami untuk keperluan analisis dan peningkatan layanan.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Penggunaan Data Pribadi</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Data yang dikumpulkan digunakan untuk tujuan sebagai berikut:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Memverifikasi identitas dan mengelola akun Pengguna.</li>
                <li>Memproses transaksi penukaran voucher dan mengirimkan produk yang diredeem.</li>
                <li>Menyediakan dukungan pelanggan (customer service).</li>
                <li>Meningkatkan keamanan, kenyamanan, dan kualitas layanan situs kami.</li>
                <li>Mengirimkan informasi terkait pembaruan layanan, promosi, atau penawaran khusus (hanya jika Pengguna memberikan persetujuan).</li>
              </ul>
              <p>
                Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Pengguna kepada pihak ketiga dalam bentuk apapun.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Pengungkapan Data kepada Pihak Ketiga</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Kami dapat mengungkapkan sebagian data Pengguna hanya kepada pihak ketiga yang bekerja sama dengan kami (misalnya penyedia layanan logistik, pembayaran, atau teknologi), sepanjang diperlukan untuk pelaksanaan layanan dan tetap dalam pengawasan kami.
              </p>
              <p>
                Kami dapat mengungkapkan data apabila diwajibkan oleh hukum, perintah pengadilan, atau otoritas pemerintah yang sah sesuai peraturan di Republik Indonesia.
              </p>
              <p>
                Kami tidak bertanggung jawab atas kebocoran data yang terjadi akibat kelalaian atau pelanggaran keamanan oleh pihak ketiga di luar kendali kami.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Keamanan Data</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data pribadi Pengguna dari kehilangan, penyalahgunaan, akses tidak sah, pengungkapan, perubahan, atau perusakan.
              </p>
              <p>
                Meskipun demikian, Pengguna memahami bahwa tidak ada sistem keamanan data di internet yang sepenuhnya bebas dari risiko, dan oleh karena itu Pengguna menanggung risiko pribadi atas segala penggunaan data yang terjadi di luar kendali wajar CV Top Asli.
              </p>
              <p>
                CV Top Asli tidak bertanggung jawab atas akses tidak sah yang terjadi akibat kelalaian Pengguna dalam menjaga kerahasiaan akun dan kata sandinya.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Penyimpanan dan Penghapusan Data</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Data pribadi Pengguna akan disimpan selama akun masih aktif atau selama diperlukan untuk memenuhi kewajiban hukum dan tujuan operasional kami.
              </p>
              <p>
                Pengguna dapat mengajukan permintaan penghapusan akun melalui kontak resmi kami. Namun, sebagian data transaksi dapat tetap disimpan untuk kepentingan hukum, audit, atau pencegahan penyalahgunaan.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Hak Pengguna</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Pengguna memiliki hak untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mengakses dan memperbarui data pribadi melalui akun masing-masing.</li>
                <li>Menarik persetujuan atas penggunaan data tertentu dengan konsekuensi penghentian layanan yang terkait.</li>
                <li>Mengajukan pertanyaan, keluhan, atau permintaan informasi terkait penggunaan data pribadi melalui kontak resmi CV Top Asli.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Perubahan atas Kebijakan Privasi</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                CV Top Asli berhak untuk mengubah, memperbarui, atau menyesuaikan Kebijakan Privasi ini sewaktu-waktu tanpa pemberitahuan sebelumnya, demi menyesuaikan dengan ketentuan hukum dan kebutuhan bisnis kami.
              </p>
              <p>
                Versi terbaru dari Kebijakan Privasi akan selalu tersedia di situs resmi kami.
              </p>
              <p>
                Dengan tetap menggunakan layanan setelah adanya perubahan, Pengguna dianggap telah menyetujui kebijakan yang diperbarui tersebut.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Tanggung Jawab dan Pembatasan</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Pengguna memahami dan menyetujui bahwa penggunaan situs ini adalah sepenuhnya atas risiko masing-masing Pengguna.
              </p>
              <p>
                CV Top Asli tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan data oleh pihak ketiga, selama hal tersebut bukan akibat dari kelalaian berat atau kesalahan langsung dari pihak CV Top Asli.
              </p>
              <p>
                Dalam hal terjadi perselisihan, kebijakan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia, dan setiap sengketa akan diselesaikan di pengadilan yang berwenang di wilayah hukum Indonesia.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Kontak Kami</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Untuk pertanyaan, keluhan, atau klarifikasi mengenai Kebijakan Privasi ini, silakan hubungi kami melalui:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li><strong className="text-white">Email:</strong> cvtopasli@gmail.com</li>
                <li><strong className="text-white">Alamat:</strong> Desa Jetis, Kecamatan Jaten, Kabupaten Karanganyar, Daerah Industri Cangkromo, Palur, Jawa Tengah</li>
                <li><strong className="text-white">Telepon:</strong> 0271-825970</li>
              </ul>
            </div>
          </section>

        </div>
      </div>

      <footer className="bg-[#1C2E44] border-t border-slate-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
                <span className="text-xl font-bold text-white">TopAsli</span>
              </div>
              <p className="text-slate-400 text-sm">
                Platform redeem voucher snack CV Top Asli dengan proses cepat dan aman.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                    Redeem Voucher
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                    Kontak Kami
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                    Syarat & Ketentuan
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <p className="text-slate-400 text-sm">cvtopasli@gmail.com</p>
                <p className="text-slate-400 text-sm">0271-825970</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 CV Top Asli. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
