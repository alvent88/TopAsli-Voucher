import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, User, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useBackend } from "@/lib/useBackend";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Peringatan",
        description: "Email wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: "Peringatan",
        description: "Nama lengkap wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Peringatan",
        description: "Nomor HP wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (!birthDate.trim()) {
      toast({
        title: "Peringatan",
        description: "Tanggal lahir wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("=== REGISTER START ===");
      console.log("Email:", email);
      console.log("Full name:", fullName);
      console.log("Phone number:", phoneNumber);
      console.log("Birth date:", birthDate);
      
      const result = await backend.auth.registerEmail({
        email,
        fullName,
        phoneNumber,
        birthDate,
      });
      console.log("Registration result:", result);

      toast({
        title: "Registrasi Berhasil! 🎉",
        description: "Selamat datang di TopAsli! Silakan login untuk melanjutkan.",
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Save profile error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      toast({
        title: "Error",
        description: err.message || "Gagal menyelesaikan registrasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <nav className="border-b border-slate-800 bg-[#0f1229]">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:text-blue-400 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Daftar Akun Baru</h1>
            <p className="text-slate-400">Lengkapi data Anda untuk mendaftar</p>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Formulir Pendaftaran
              </CardTitle>
              <CardDescription className="text-slate-400">
                Isi semua data dengan lengkap dan benar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      disabled={loading}
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-300">
                    Nama Lengkap *
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      disabled={loading}
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-slate-300">
                    Nomor WhatsApp *
                  </Label>
                  <div className="relative">
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="081234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      disabled={loading}
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-slate-300">
                    Tanggal Lahir *
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      disabled={loading}
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="text-xs text-slate-400">
                    Saya telah membaca dan menyetujui{" "}
                    <Link to="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">
                      Syarat dan Ketentuan
                    </Link>
                    {" "}yang berlaku
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading || !email.trim() || !fullName.trim() || !phoneNumber.trim() || !birthDate.trim() || !acceptedTerms}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftar...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Sudah punya akun?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-lg bg-blue-600/10 border border-blue-700/30">
            <p className="text-blue-400 text-xs leading-relaxed">
              <strong>Catatan:</strong><br />
              • Pastikan email yang Anda masukkan valid dan aktif<br />
              • Nomor WhatsApp akan digunakan untuk notifikasi transaksi<br />
              • Data Anda akan kami jaga kerahasiaannya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
