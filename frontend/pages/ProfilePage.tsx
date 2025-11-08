import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackend } from "@/lib/useBackend";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const backend = useBackend();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    setLoading(true);
    try {
      const result = await backend.balance.getBalance();
      setBalance(result.balance);
    } catch (error) {
      console.error("Failed to load balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const email = user?.emailAddresses[0]?.emailAddress || "-";
  const phoneNumber = user?.primaryPhoneNumber?.phoneNumber || 
                      user?.phoneNumbers?.[0]?.phoneNumber || "-";

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <nav className="border-b border-slate-800 bg-[#0f1229]">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:text-blue-400 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 lg:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-3 lg:mb-4">
              <User className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Profil Saya</h1>
            <p className="text-sm lg:text-base text-slate-400">Informasi akun Anda</p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-white flex items-center gap-2 text-base lg:text-lg">
                  <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
                  Saldo Saya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold text-white">
                  {loading ? "..." : balance !== null ? formatCurrency(balance) : "Rp 0"}
                </div>
                <p className="text-slate-300 text-xs lg:text-sm mt-2">
                  Gunakan voucher untuk menambah saldo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-white text-base lg:text-lg">Informasi Akun</CardTitle>
                <CardDescription className="text-slate-400 text-xs lg:text-sm">
                  Data pribadi Anda (tidak dapat diedit)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    Nama Lengkap
                  </label>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-white text-sm lg:text-base break-words">
                    {fullName}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Mail className="h-3 w-3 lg:h-4 lg:w-4" />
                    Email
                  </label>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-white text-sm lg:text-base break-all">
                    {email}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Phone className="h-3 w-3 lg:h-4 lg:w-4" />
                    Nomor HP
                  </label>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-white text-sm lg:text-base">
                    {phoneNumber}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              <Button
                onClick={() => navigate("/redeem-voucher")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 lg:h-12 text-sm lg:text-base"
              >
                Redeem Voucher
              </Button>
              <Button
                onClick={() => navigate("/transactions")}
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 lg:h-12 text-sm lg:text-base"
              >
                Riwayat Transaksi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
