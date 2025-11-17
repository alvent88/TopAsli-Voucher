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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg relative z-10">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            Daftar Akun
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {step === "input"
              ? "Isi data diri Anda untuk mendaftar"
              : "Masukkan kode OTP yang dikirim via WhatsApp"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "input" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor WhatsApp
                </label>
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  placeholder="Nama Anda"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal Lahir
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Password Anda"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Konfirmasi Password
                </label>
                <Input
                  type="password"
                  placeholder="Ulangi password Anda"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-600 text-white font-semibold h-11"
              >
                {loading ? "Mengirim OTP..." : "Daftar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    Kode OTP telah dikirim ke WhatsApp Anda di nomor{" "}
                    <span className="font-semibold text-gray-900">{formData.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Kode OTP
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan 6 digit OTP"
                  value={otpForm.otp}
                  onChange={(e) => setOtpForm({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otpForm.otp.length !== 6}
                className="w-full bg-primary hover:bg-blue-600 text-white font-semibold h-11"
              >
                {loading ? "Memverifikasi..." : "Verifikasi & Daftar"}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Kirim ulang OTP dalam {countdown} detik
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-primary hover:text-blue-600 font-medium"
                  >
                    Kirim Ulang OTP
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("input")}
                className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Ubah Data
              </Button>
            </form>
          )}

          {step === "input" && (
            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{" "}
                <Link to="/login" className="text-primary hover:text-blue-600 font-medium">
                  Login di sini
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-3 text-gray-900 hover:opacity-80 transition-opacity z-20"
      >
        <img src="/logo.png" alt="TopAsli" className="w-10 h-10 rounded-lg" />
        <span className="text-xl font-bold">TopAsli</span>
      </Link>
    </div>
  );
}
