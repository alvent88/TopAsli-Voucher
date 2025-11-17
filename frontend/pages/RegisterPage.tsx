import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Phone, User, Lock, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

export default function RegisterPhoneOnlyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "verify-otp">("input");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });

  const [otpForm, setOtpForm] = useState({
    otp: "",
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await backend.auth.sendRegisterOTP({
        phoneNumber: formData.phoneNumber,
      });

      toast({
        title: "OTP Terkirim",
        description: response.message,
      });

      setStep("verify-otp");
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("Send OTP failed:", error);
      toast({
        title: "Gagal Mengirim OTP",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await backend.auth.verifyAndRegister({
        phoneNumber: formData.phoneNumber,
        otp: otpForm.otp,
        fullName: formData.fullName,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
      });

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("authToken", response.token);
      sessionStorage.setItem("userId", response.userId);
      sessionStorage.setItem("userPhone", response.phoneNumber);
      sessionStorage.setItem("userName", response.fullName);

      try {
        let ipAddress = 'unknown';
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json', { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip || 'unknown';
        } catch (ipError) {
          console.error("Failed to get IP address:", ipError);
        }
        
        const userAgent = navigator.userAgent;
        
        await backend.auth.trackLogin({
          userId: response.userId,
          email: undefined,
          phoneNumber: response.phoneNumber,
          loginType: 'phone_register',
          ipAddress: ipAddress,
          userAgent: userAgent,
        });

        console.log("Registration login tracked successfully");
      } catch (trackError) {
        console.error("Failed to track registration login:", trackError);
      }

      toast({
        title: "Registrasi Berhasil!",
        description: "Selamat datang di TopAsli!",
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("Verify and register failed:", error);
      toast({
        title: "Verifikasi Gagal",
        description: error.message || "Kode OTP salah atau sudah kadaluarsa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      const response = await backend.auth.sendRegisterOTP({
        phoneNumber: formData.phoneNumber,
      });

      toast({
        title: "OTP Terkirim",
        description: response.message,
      });

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Gagal Mengirim OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1B2B] via-[#1a2332] to-[#0F1B2B] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <Card className="w-full max-w-md bg-[#1a1f3a]/80 backdrop-blur-xl border-slate-700 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Daftar Akun
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {step === "input"
              ? "Isi data diri Anda untuk mendaftar"
              : "Masukkan kode OTP yang dikirim via WhatsApp"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "input" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor WhatsApp
                </label>
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  placeholder="Nama Anda"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Lahir
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Password Anda"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Konfirmasi Password
                </label>
                <Input
                  type="password"
                  placeholder="Ulangi password Anda"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#E0B872] to-[#F5D99B] hover:from-[#E0B872]/90 hover:to-[#F5D99B]/90 text-[#0F1B2B] font-semibold h-11"
              >
                {loading ? "Mengirim OTP..." : "Daftar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300">
                    Kode OTP telah dikirim ke WhatsApp Anda di nomor{" "}
                    <span className="font-semibold text-white">{formData.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Kode OTP
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan 6 digit OTP"
                  value={otpForm.otp}
                  onChange={(e) => setOtpForm({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otpForm.otp.length !== 6}
                className="w-full bg-gradient-to-r from-[#E0B872] to-[#F5D99B] hover:from-[#E0B872]/90 hover:to-[#F5D99B]/90 text-[#0F1B2B] font-semibold h-11"
              >
                {loading ? "Memverifikasi..." : "Verifikasi & Daftar"}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-400">
                    Kirim ulang OTP dalam {countdown} detik
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Kirim Ulang OTP
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("input")}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Ubah Data
              </Button>
            </form>
          )}

          {step === "input" && (
            <div className="pt-4 border-t border-slate-700 text-center">
              <p className="text-sm text-slate-400">
                Sudah punya akun?{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Login di sini
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-3 text-white hover:opacity-80 transition-opacity z-20"
      >
        <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
        <span className="text-xl font-bold">TopAsli</span>
      </Link>
    </div>
  );
}
