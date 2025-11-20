import { Link } from "react-router-dom";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlus, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  Ticket, 
  Mail,
  MessageCircle,
  ArrowRight
} from "lucide-react";

export default function HowToRedeemPage() {
  const steps = [
    {
      number: 1,
      title: "Daftar Akun",
      icon: UserPlus,
      description: "Buat akun baru di TopAsli. Klik tombol 'Daftar' di halaman utama.",
      details: [
        "Masukkan nomor WhatsApp yang aktif",
        "Masukkan nama lengkap",
        "Masukkan tanggal lahir",
        "Buat password yang aman",
        "Klik tombol 'Daftar'"
      ]
    },
    {
      number: 2,
      title: "Login ke Akun",
      icon: CheckCircle,
      description: "Login menggunakan nomor WhatsApp dan password yang sudah dibuat.",
      details: [
        "Masukkan nomor WhatsApp",
        "Masukkan password",
        "Klik 'Login'",
        "Sistem akan otomatis mengarahkan ke halaman utama"
      ]
    },
    {
      number: 3,
      title: "Redeem Voucher",
      icon: Ticket,
      description: "Tukarkan kode voucher snack Anda menjadi saldo.",
      details: [
        "Klik menu 'Redeem' di navigasi",
        "Scan kode QR voucher menggunakan kamera",
        "Jika tidak ada kamera, input manual 32 digit kode voucher",
        "Klik tombol 'Redeem'",
        "Saldo otomatis masuk ke akun Anda"
      ]
    },
    {
      number: 4,
      title: "Gunakan Saldo",
      icon: CheckCircle,
      description: "Gunakan saldo untuk membeli game items, voucher digital, atau produk PPOB.",
      details: [
        "Pilih produk yang diinginkan",
        "Masukkan data akun game/tujuan",
        "Konfirmasi pembelian",
        "Item otomatis masuk ke akun Anda"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="TopAsli" className="w-12 h-12 rounded-full" />
              <span className="text-2xl font-bold text-primary">TopAsli</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/voucher" className="text-gray-700 hover:text-primary transition-colors">Home</Link>
              <Link to="/how-to-redeem" className="text-gray-700 hover:text-primary transition-colors">Cara Redeem</Link>
              <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors">Kontak</Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-12 border-b border-blue-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4 text-4xl md:text-5xl font-bold text-primary">
              Cara Redeem Voucher
            </h1>
            <p className="text-lg text-gray-700">
              Panduan lengkap untuk menukarkan voucher snack Anda menjadi saldo dan menggunakannya
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card 
                key={step.number} 
                className="bg-white border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {step.number}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                      </div>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Tips & Catatan Penting
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Keamanan Akun
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gunakan password yang kuat</li>
                  <li>• Gunakan nomor WhatsApp yang aktif</li>
                  <li>• Simpan kode voucher dengan aman</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Registrasi
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Data diri harus lengkap & valid</li>
                  <li>• Nomor WhatsApp untuk login</li>
                  <li>• Proses daftar cepat & mudah</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Kode Voucher
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Scan QR code atau input 32 digit manual</li>
                  <li>• Hanya bisa digunakan 1 kali</li>
                  <li>• Saldo langsung masuk setelah redeem</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Penggunaan Saldo
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bisa untuk semua produk</li>
                  <li>• Proses instan & otomatis</li>
                  <li>• Cek riwayat di menu Transaksi</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Siap untuk Redeem Voucher?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-primary hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Daftar Sekarang
                </Button>
              </Link>
              <Link to="/redeem-voucher">
                <Button className="bg-white hover:bg-gray-50 text-primary border-2 border-primary px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Redeem Voucher
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Butuh Bantuan?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Tim customer service kami siap membantu Anda 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:cvtopasli@gmail.com" 
                className="flex items-center gap-2 justify-center bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <Mail className="h-5 w-5" />
                Email Kami
              </a>
              <a 
                href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya%20cara%20redeem%20voucher&type=phone_number&app_absent=0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp CS
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="TopAsli" className="w-12 h-12 rounded-full" />
                <span className="text-xl font-bold text-gray-900">TopAsli</span>
              </div>
              <p className="text-gray-600 text-sm">Platform redeem voucher CV Top Asli dengan proses cepat dan aman.</p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/redeem-voucher" className="text-gray-600 hover:text-primary transition-colors">Redeem Voucher</Link></li>
                <li><Link to="/how-to-redeem" className="text-gray-600 hover:text-primary transition-colors">Cara Redeem</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Kontak Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-primary transition-colors">Beranda</Link></li>
                <li><Link to="/privacy" className="text-gray-600 hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/terms" className="text-gray-600 hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a href="mailto:cvtopasli@gmail.com" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  +62 822-2505-8000
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 CV Top Asli. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
