import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useBackend } from "@/lib/useBackend";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Masukkan email Anda",
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

    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Masukkan password Anda",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("=== LOGIN START ===");
      console.log("Email:", email);
      
      const result = await backend.auth.loginEmail({
        email,
        password,
      });
      
      console.log("Login result:", result);
      
      sessionStorage.setItem("userId", result.userId);
      sessionStorage.setItem("userEmail", result.email);
      sessionStorage.setItem("userName", result.fullName);
      sessionStorage.setItem("authToken", result.token);
      sessionStorage.setItem("isLoggedIn", "true");

      toast({
        title: "Login Berhasil! 🎉",
        description: `Selamat datang kembali, ${result.fullName}!`,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = "/";
    } catch (err: any) {
      console.error("Login error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      toast({
        title: "Login Gagal",
        description: err.message || "Email atau password salah",
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
            <h1 className="text-4xl font-bold text-white mb-2">Masuk</h1>
            <p className="text-slate-400">Login ke akun Anda</p>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Login</CardTitle>
              <CardDescription className="text-slate-400">
                Masukkan email dan password Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
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
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white pl-10"
                      disabled={loading}
                    />
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
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

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Belum punya akun?{" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Daftar di sini
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
