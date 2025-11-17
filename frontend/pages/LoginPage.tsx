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
        description: error.message || "Nomor HP atau password salah",
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
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Masuk
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Login dengan nomor HP dan password Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Nomor HP
              </label>
              <Input
                type="tel"
                placeholder="08123456789"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-11"
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
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Lupa password?
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-700 text-center">
            <p className="text-sm text-slate-400">
              Belum punya akun?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Daftar di sini
              </Link>
            </p>
          </div>
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
