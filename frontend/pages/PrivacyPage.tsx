import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F1B2B]">
      <nav className="border-b border-slate-800 bg-[#1C2E44] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#E0B872] to-[#F5D99B] bg-clip-text text-transparent">TopAsli</span>
            </Link>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="border-[#E0B872]/30 text-slate-300 hover:bg-[#1C2E44] hover:text-[#E0B872]"
            >
              Kembali
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-[#1C2E44] border border-[#E0B872]/30 rounded-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Kebijakan Privasi CV Top Asli
          </h1>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Pendahuluan</h2>
              <p className="leading-relaxed">
                Kebijakan Privasi ini menjelaskan bagaimana CV Top Asli ("Kami") mengumpulkan, menggunakan, melindungi, dan mengelola data pribadi Pengguna ("Anda") saat mengakses dan menggunakan situs web resmi kami yang menyediakan layanan penukaran voucher hadiah (redeem voucher) dari produk-produk snack hasil produksi CV Top Asli.
              </p>
              <p className="leading-relaxed mt-4">
                Dengan mendaftar dan menggunakan layanan situs kami, Anda dianggap telah membaca, memahami, dan menyetujui Kebijakan Privasi ini. Apabila Anda tidak menyetujui sebagian atau seluruh isi Kebijakan Privasi ini, mohon untuk tidak menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Pengumpulan Data Pribadi</h2>
              <p className="leading-relaxed mb-4">
                Kami mengumpulkan data pribadi Pengguna yang diberikan secara langsung saat melakukan registrasi, login, maupun transaksi, termasuk namun tidak terbatas pada:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Nama lengkap</li>
                <li>Alamat email</li>
                <li>Nomor telepon</li>
                <li>Data transaksi (misalnya kode voucher, produk yang diredeem, waktu transaksi, dan nilai penukaran)</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Kami juga dapat secara otomatis mengumpulkan data non-pribadi seperti alamat IP, jenis perangkat, browser yang digunakan, serta aktivitas selama mengakses situs kami untuk keperluan analisis dan peningkatan layanan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Penggunaan Data Pribadi</h2>
              <p className="leading-relaxed mb-4">
                Data yang dikumpulkan digunakan untuk tujuan sebagai berikut:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Memverifikasi identitas dan mengelola akun Pengguna.</li>
                <li>Memproses transaksi penukaran voucher dan mengirimkan produk yang diredeem.</li>
                <li>Menyediakan dukungan pelanggan (customer service).</li>
                <li>Meningkatkan keamanan, kenyamanan, dan kualitas layanan situs kami.</li>
                <li>Mengirimkan informasi terkait pembaruan layanan, promosi, atau penawaran khusus (hanya jika Pengguna memberikan persetujuan).</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Pengguna kepada pihak ketiga dalam bentuk apapun.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Pengungkapan Data kepada Pihak Ketiga</h2>
              <p className="leading-relaxed mb-4">
                Kami dapat mengungkapkan sebagian data Pengguna hanya kepada pihak ketiga yang bekerja sama dengan kami (misalnya penyedia layanan logistik, pembayaran, atau teknologi), sepanjang diperlukan untuk pelaksanaan layanan dan tetap dalam pengawasan kami.
              </p>
              <p className="leading-relaxed mb-4">
                Kami dapat mengungkapkan data apabila diwajibkan oleh hukum, perintah pengadilan, atau otoritas pemerintah yang sah sesuai peraturan di Republik Indonesia.
              </p>
              <p className="leading-relaxed">
                Kami tidak bertanggung jawab atas kebocoran data yang terjadi akibat kelalaian atau pelanggaran keamanan oleh pihak ketiga di luar kendali kami.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Keamanan Data</h2>
              <p className="leading-relaxed mb-4">
                Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data pribadi Pengguna dari kehilangan, penyalahgunaan, akses tidak sah, pengungkapan, perubahan, atau perusakan.
              </p>
              <p className="leading-relaxed mb-4">
                Meskipun demikian, Pengguna memahami bahwa tidak ada sistem keamanan data di internet yang sepenuhnya bebas dari risiko, dan oleh karena itu Pengguna menanggung risiko pribadi atas segala penggunaan data yang terjadi di luar kendali wajar CV Top Asli.
              </p>
              <p className="leading-relaxed">
                CV Top Asli tidak bertanggung jawab atas akses tidak sah yang terjadi akibat kelalaian Pengguna dalam menjaga kerahasiaan akun dan kata sandinya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Penyimpanan dan Penghapusan Data</h2>
              <p className="leading-relaxed mb-4">
                Data pribadi Pengguna akan disimpan selama akun masih aktif atau selama diperlukan untuk memenuhi kewajiban hukum dan tujuan operasional kami.
              </p>
              <p className="leading-relaxed">
                Pengguna dapat mengajukan permintaan penghapusan akun melalui kontak resmi kami. Namun, sebagian data transaksi dapat tetap disimpan untuk kepentingan hukum, audit, atau pencegahan penyalahgunaan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Hak Pengguna</h2>
              <p className="leading-relaxed mb-4">
                Pengguna memiliki hak untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Mengakses dan memperbarui data pribadi melalui akun masing-masing.</li>
                <li>Menarik persetujuan atas penggunaan data tertentu dengan konsekuensi penghentian layanan yang terkait.</li>
                <li>Mengajukan pertanyaan, keluhan, atau permintaan informasi terkait penggunaan data pribadi melalui kontak resmi CV Top Asli.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Perubahan atas Kebijakan Privasi</h2>
              <p className="leading-relaxed mb-4">
                CV Top Asli berhak untuk mengubah, memperbarui, atau menyesuaikan Kebijakan Privasi ini sewaktu-waktu tanpa pemberitahuan sebelumnya, demi menyesuaikan dengan ketentuan hukum dan kebutuhan bisnis kami.
              </p>
              <p className="leading-relaxed mb-4">
                Versi terbaru dari Kebijakan Privasi akan selalu tersedia di situs resmi kami.
              </p>
              <p className="leading-relaxed">
                Dengan tetap menggunakan layanan setelah adanya perubahan, Pengguna dianggap telah menyetujui kebijakan yang diperbarui tersebut.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Tanggung Jawab dan Pembatasan</h2>
              <p className="leading-relaxed mb-4">
                Pengguna memahami dan menyetujui bahwa penggunaan situs ini adalah sepenuhnya atas risiko masing-masing Pengguna.
              </p>
              <p className="leading-relaxed mb-4">
                CV Top Asli tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan data oleh pihak ketiga, selama hal tersebut bukan akibat dari kelalaian berat atau kesalahan langsung dari pihak CV Top Asli.
              </p>
              <p className="leading-relaxed">
                Dalam hal terjadi perselisihan, kebijakan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia, dan setiap sengketa akan diselesaikan di pengadilan yang berwenang di wilayah hukum Indonesia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Kontak Kami</h2>
              <p className="leading-relaxed mb-6">
                Apabila Anda memiliki pertanyaan, permintaan, atau pengaduan terkait Kebijakan Privasi ini, silakan hubungi kami melalui:
              </p>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">CV Top Asli</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#E0B872] flex-shrink-0 mt-1" />
                    <p className="text-slate-300">
                      Desa Jetis, Kecamatan Jaten, Kabupaten Karanganyar<br />
                      Daerah Industri Cangkromo, Palur, Jawa Tengah
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#E0B872]" />
                    <a href="mailto:cvtopasli@gmail.com" className="text-[#E0B872] hover:text-[#F5D99B] transition-colors">
                      cvtopasli@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-[#E0B872]" />
                    <a href="tel:0271825970" className="text-[#E0B872] hover:text-[#F5D99B] transition-colors">
                      0271-825970
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
              <p>© 2024 CV Top Asli. All rights reserved.</p>
              <p className="mt-2">Terakhir diperbarui: 25 Oktober 2025</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-[#1C2E44] mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
                <span className="text-xl font-bold bg-gradient-to-r from-[#E0B872] to-[#F5D99B] bg-clip-text text-transparent">TopAsli</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform voucher digital untuk top-up game favorit Anda dengan mudah dan aman.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-slate-400 hover:text-[#E0B872] transition-colors">Beranda</a></li>
                <li><a href="/privacy" className="text-slate-400 hover:text-[#E0B872] transition-colors">Kebijakan Privasi</a></li>
                <li><a href="/terms" className="text-slate-400 hover:text-[#E0B872] transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a href="mailto:cvtopasli@gmail.com" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  +62 822-2505-8000
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            <p>© 2024 CV Top Asli. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
