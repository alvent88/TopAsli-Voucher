import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Phone, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

export default function LoginPhoneOnlyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await backend.auth.loginPhoneV2({
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("authToken", response.token);
      sessionStorage.setItem("userId", response.userId);
      sessionStorage.setItem("userPhone", response.phoneNumber);
      sessionStorage.setItem("userName", response.fullName);
      sessionStorage.setItem("isAdmin", response.isAdmin ? "true" : "false");
      sessionStorage.setItem("isSuperAdmin", response.isSuperAdmin ? "true" : "false");

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
          loginType: 'phone',
          ipAddress: ipAddress,
          userAgent: userAgent,
        });

        console.log("Login tracked successfully");
      } catch (trackError) {
        console.error("Failed to track login:", trackError);
      }

      toast({
        title: "Login Berhasil!",
        description: `Selamat datang, ${response.fullName}!`,
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Gagal",
        description: error.message || "Nomor WhatsApp atau password salah",
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
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            Masuk
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Login dengan nomor WhatsApp dan password Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 text-white font-semibold h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-blue-600 font-medium"
            >
              Lupa password?
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link to="/register" className="text-primary hover:text-blue-600 font-medium">
                Daftar di sini
              </Link>
            </p>
          </div>
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
