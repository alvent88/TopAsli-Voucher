import { useState, useEffect } from "react";
import { Send, Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/AuthButton";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/useBackend";

export default function ContactPage() {
  const { toast } = useToast();
  const isSignedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const navigate = useNavigate();
  const backend = useBackend();
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      toast({
        title: "Akses Ditolak",
        description: "Anda harus login terlebih dahulu untuk mengakses halaman kontak.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isSignedIn, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await backend.message.create({
        name: formData.name,
        subject: formData.subject,
        message: formData.message,
      });

      toast({
        title: "Pesan Terkirim!",
        description: "Kami akan segera menghubungi Anda.",
      });
      setFormData({ name: "", subject: "", message: "" });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <nav className="border-b border-slate-800 bg-[#0f1229] sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                TopAsli
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                Games
              </Link>
              <Link to="/contact" className="text-white font-semibold">
                Kontak
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 py-16 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4 text-5xl md:text-6xl font-bold text-white">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hubungi Kami
              </span>
            </h1>
            <p className="text-xl text-slate-300">
              Tim kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi!
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Kirim Pesan</CardTitle>
                <p className="text-slate-400 text-sm">
                  Isi formulir di bawah ini dan kami akan segera merespons
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Nama Lengkap
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Subjek
                    </label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Tentang apa pesan Anda?"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">
                      Pesan
                    </label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white min-h-32"
                      placeholder="Tulis pesan Anda di sini..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <p className="text-slate-400 text-sm mb-2">
                      Kirim email untuk pertanyaan detail
                    </p>
                    <a
                      href="mailto:cvtopasli@gmail.com"
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      cvtopasli@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">WhatsApp</h3>
                    <p className="text-slate-400 text-sm mb-2">Chat langsung dengan tim kami</p>
                    <a
                      href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat Sekarang
                    </a>
                    <p className="text-slate-400 text-xs mt-2">+62 822-2505-8000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Jam Operasional</h3>
                    <p className="text-slate-400 text-sm">Senin - Minggu</p>
                    <p className="text-white font-semibold">24 Jam / 7 Hari</p>
                    <p className="text-slate-400 text-xs mt-2">Kami selalu siap membantu Anda</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-[#0f1229] border-t border-slate-800">
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
                  <Link
                    to="/contact"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Kontak Kami
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="text-slate-400 hover:text-white transition-colors">
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-slate-400 hover:text-white transition-colors">
                    Syarat & Ketentuan
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a
                  href="mailto:cvtopasli@gmail.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a
                  href="https://wa.me/6282225058000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  +62 822-2505-8000
                </a>
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
