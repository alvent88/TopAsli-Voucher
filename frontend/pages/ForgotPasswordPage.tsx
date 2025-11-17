import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, Phone, Lock, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

export default function ForgotPasswordPhonePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "verify-otp" | "reset">("input");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpForm, setOtpForm] = useState({ otp: "" });
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await backend.auth.sendForgotPasswordPhoneOTP({
        phoneNumber,
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
        description: error.message || "Nomor HP tidak terdaftar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await backend.auth.verifyForgotPasswordPhoneOTP({
        phoneNumber,
        otp: otpForm.otp,
      });

      if (response.verified) {
        setResetToken(response.resetToken);
        setStep("reset");
        toast({
          title: "OTP Terverifikasi",
          description: "Silakan masukkan password baru Anda",
        });
      }
    } catch (error: any) {
      console.error("Verify OTP failed:", error);
      toast({
        title: "Verifikasi Gagal",
        description: error.message || "Kode OTP salah atau sudah kadaluarsa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await backend.auth.resetPasswordPhone({
        resetToken,
        newPassword: resetForm.newPassword,
      });

      toast({
        title: "Berhasil!",
        description: "Password berhasil diubah. Silakan login dengan password baru Anda.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Reset failed:", error);
      toast({
        title: "Gagal Reset Password",
        description: error.message || "Terjadi kesalahan. Silakan coba lagi.",
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
      const response = await backend.auth.sendForgotPasswordPhoneOTP({
        phoneNumber,
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <Card className="w-full max-w-md bg-[#1a1f3a]/80 backdrop-blur-xl border-slate-700 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Lupa Password
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {step === "input"
              ? "Masukkan nomor HP Anda"
              : step === "verify-otp"
              ? "Masukkan kode OTP yang dikirim via WhatsApp"
              : "Masukkan password baru Anda"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "input" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor HP
                </label>
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-11"
              >
                {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </Button>
            </form>
          )}

          {step === "verify-otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300">
                    Kode OTP telah dikirim ke WhatsApp Anda di nomor{" "}
                    <span className="font-semibold text-white">{phoneNumber}</span>
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
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-11"
              >
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
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
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ubah Nomor HP
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password Baru
                </label>
                <Input
                  type="password"
                  placeholder="Password baru"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
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
                  placeholder="Ulangi password baru"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-11"
              >
                {loading ? "Mengubah Password..." : "Ubah Password"}
              </Button>
            </form>
          )}

          {step === "input" && (
            <>
              <div className="pt-4 border-t border-slate-700">
                <Link to="/login">
                  <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Login
                  </Button>
                </Link>
              </div>

              <div className="pt-2 text-center">
                <p className="text-sm text-slate-400">
                  Belum punya akun?{" "}
                  <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                    Daftar Sekarang
                  </Link>
                </p>
              </div>
            </>
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
