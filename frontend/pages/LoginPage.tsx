import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useBackend } from "@/lib/useBackend";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, setActive } = useSignIn();
  const { toast } = useToast();
  const backend = useBackend();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verification">("email");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
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

    setLoading(true);
    try {
      await backend.auth.checkUser({ identifier: email });
      
      console.log("Creating signIn with email:", email);
      await signIn?.create({ identifier: email });
      
      console.log("SignIn created, getting supportedFirstFactors...");
      const emailFactor = signIn?.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === "email_code"
      );
      
      console.log("Email factor:", emailFactor);
      
      if (!emailFactor) {
        throw new Error("Email code strategy not available. Make sure email is registered.");
      }
      
      console.log("Preparing first factor with emailAddressId:", (emailFactor as any).emailAddressId);
      await signIn?.prepareFirstFactor({ 
        strategy: "email_code",
        emailAddressId: (emailFactor as any).emailAddressId,
      });

      toast({
        title: "Kode OTP Terkirim",
        description: "Silakan cek email Anda (termasuk folder spam)",
      });
      setStep("verification");
    } catch (err: any) {
      console.error("Send code error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      toast({
        title: "Error",
        description: err.message || err.errors?.[0]?.message || "Gagal mengirim kode OTP. Pastikan email sudah terdaftar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Masukkan kode OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result?.status === "complete") {
        await setActive?.({ session: result.createdSessionId });
        
        toast({
          title: "Login Berhasil",
          description: "Selamat datang kembali!",
        });
        navigate("/");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast({
        title: "Error",
        description: err.errors?.[0]?.message || "Kode OTP tidak valid",
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
            <h1 className="text-4xl font-bold text-white mb-2">Selamat Datang Kembali</h1>
            <p className="text-slate-400">Masuk dengan email Anda</p>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                {step === "email" ? "Masukkan Email" : "Verifikasi Kode OTP"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {step === "email"
                  ? "Masukkan email Anda untuk masuk"
                  : "Kode OTP telah dikirim ke email Anda (periksa folder spam jika tidak terlihat)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <form onSubmit={handleSendCode} className="space-y-4">
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
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Kode OTP"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-slate-300">
                      Kode OTP
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Masukkan 6 digit kode OTP"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white text-center text-2xl tracking-widest"
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Verifikasi"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                    onClick={() => setStep("email")}
                    disabled={loading}
                  >
                    Ubah Email
                  </Button>
                </form>
              )}

              {step === "email" && (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
