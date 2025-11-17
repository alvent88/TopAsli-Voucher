import { Link } from "react-router-dom";
import { AuthButton } from "@/components/AuthButton";

export default function TermsPage() {
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
                Syarat dan Ketentuan
              </span>
            </h1>
            <p className="text-xl text-slate-300">
              Penggunaan Website CV Top Asli
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-[#1C2E44] border border-[#E0B872]/30 rounded-2xl p-8 text-slate-300 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Ketentuan Umum</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Selamat datang di situs resmi CV Top Asli ("Kami", "Perusahaan").
              </p>
              <p>
                Syarat dan Ketentuan ini ("Perjanjian") mengatur penggunaan situs web kami dan seluruh layanan yang tersedia di dalamnya, termasuk sistem penukaran voucher hadiah (redeem voucher) yang terdapat pada produk-produk snack hasil produksi CV Top Asli.
              </p>
              <p>
                Dengan mengakses atau menggunakan situs ini, Anda ("Pengguna") dianggap telah membaca, memahami, dan menyetujui seluruh isi dari Syarat dan Ketentuan ini.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Registrasi dan Akun Pengguna</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Untuk dapat menggunakan layanan penukaran voucher, Pengguna wajib melakukan registrasi akun pada situs kami dengan data yang benar, lengkap, dan dapat dipertanggungjawabkan.
              </p>
              <p>
                Setiap Pengguna bertanggung jawab sepenuhnya atas kerahasiaan akun dan kata sandi miliknya, serta seluruh aktivitas yang terjadi melalui akun tersebut.
              </p>
              <p>
                CV Top Asli tidak bertanggung jawab atas kehilangan atau penyalahgunaan akun akibat kelalaian Pengguna dalam menjaga keamanan informasi pribadinya.
              </p>
              <p>
                Pengguna wajib segera memberitahukan kepada Kami apabila terdapat indikasi akses tidak sah atau pelanggaran keamanan pada akun miliknya.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Transaksi dan Penukaran Voucher</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Seluruh transaksi penukaran voucher yang dilakukan melalui situs ini bersifat final dan tidak dapat dibatalkan, kecuali jika diwajibkan oleh peraturan perundang-undangan yang berlaku di Republik Indonesia.
              </p>
              <p>
                Tidak ada kebijakan pengembalian dana (refund) dalam bentuk apapun. Saldo, poin, atau voucher yang telah diredeem tidak dapat dikonversi menjadi uang tunai.
              </p>
              <p>
                Penukaran hanya dapat dilakukan terhadap produk-produk yang tersedia di dalam website resmi CV Top Asli, sesuai dengan ketentuan dan ketersediaan produk pada saat transaksi dilakukan.
              </p>
              <p>
                CV Top Asli berhak menolak atau membatalkan transaksi apabila ditemukan indikasi penyalahgunaan sistem, pelanggaran ketentuan, atau dugaan kecurangan.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Hak Kekayaan Intelektual</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Seluruh materi, desain, logo, merek dagang, nama produk, konten, teks, gambar, dan elemen lain yang terdapat dalam situs ini merupakan hak cipta dan/atau hak kekayaan intelektual milik CV Top Asli yang dilindungi oleh hukum yang berlaku di Indonesia.
              </p>
              <p>
                Pengguna dilarang untuk menyalin, memperbanyak, mengubah, mendistribusikan, menampilkan, atau memanfaatkan materi yang ada di situs ini tanpa izin tertulis dari CV Top Asli.
              </p>
              <p>
                Pelanggaran terhadap hak kekayaan intelektual dapat dikenakan sanksi hukum sesuai dengan peraturan yang berlaku.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Perubahan Layanan dan Syarat</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                CV Top Asli berhak untuk mengubah, menangguhkan, atau menghentikan sebagian atau seluruh layanan, serta memperbarui Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.
              </p>
              <p>
                Pengguna bertanggung jawab untuk secara berkala meninjau halaman ini agar tetap mengetahui perubahan yang mungkin terjadi.
              </p>
              <p>
                Dengan tetap menggunakan layanan setelah adanya perubahan, Pengguna dianggap menyetujui seluruh pembaruan tersebut.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Force Majeure (Keadaan Kahar)</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                CV Top Asli tidak bertanggung jawab atas keterlambatan atau kegagalan dalam melaksanakan kewajiban apabila disebabkan oleh keadaan di luar kendali wajar, termasuk namun tidak terbatas pada: bencana alam, kebakaran, perang, huru-hara, pemogokan, gangguan sistem, tindakan pemerintah, pandemi, atau gangguan pada jaringan pihak ketiga.
              </p>
              <p>
                Dalam hal terjadi force majeure, seluruh kewajiban yang terpengaruh akan ditangguhkan selama periode kejadian tersebut berlangsung.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Hukum yang Berlaku</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia.
              </p>
              <p>
                Segala sengketa yang timbul dari penggunaan situs ini akan diselesaikan secara musyawarah terlebih dahulu. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui jalur hukum di pengadilan yang berwenang di wilayah hukum Indonesia.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Kontak Kami</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Untuk pertanyaan, keluhan, atau klarifikasi mengenai Syarat dan Ketentuan ini, silakan hubungi kami melalui:
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
