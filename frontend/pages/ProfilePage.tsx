import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Wallet, Calendar, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/useBackend";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const backend = useBackend();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBalance();
    loadUserProfile();
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

  const loadUserProfile = async () => {
    try {
      const profile = await backend.auth.getUserProfile();
      console.log("Loaded profile from backend:", profile);
      console.log("Birth date from profile:", profile.birthDate);
      console.log("Birth date type:", typeof profile.birthDate);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendOTP = async () => {
    setSendingOtp(true);
    try {
      await backend.auth.sendChangePasswordOTP({});
      setOtpSent(true);
      toast({
        title: "OTP Terkirim!",
        description: "Kode OTP telah dikirim ke WhatsApp Anda.",
      });
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim OTP. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !otp) {
      toast({
        title: "Error",
        description: "Semua field harus diisi.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi password tidak sama.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await backend.auth.changePassword({ newPassword, otp });
      toast({
        title: "Sukses!",
        description: "Password berhasil diubah.",
      });
      setShowChangePasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpSent(false);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah password. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const fullName = userProfile?.fullName || "User";
  const phoneNumber = userProfile?.phoneNumber 
    ? (userProfile.phoneNumber.startsWith('62') ? userProfile.phoneNumber : `62${userProfile.phoneNumber}`)
    : "-";
  const birthDate = userProfile?.birthDate 
    ? (typeof userProfile.birthDate === 'string' 
        ? userProfile.birthDate 
        : userProfile.birthDate instanceof Date 
          ? userProfile.birthDate.toISOString().split('T')[0]
          : null)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/voucher")}
            className="text-slate-700 hover:text-blue-600 hover:bg-slate-100"
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
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Profil Saya</h1>
            <p className="text-sm lg:text-base text-slate-600">Informasi akun Anda</p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-slate-900 flex items-center gap-2 text-base lg:text-lg">
                  <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
                  Saldo Saya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold text-slate-900">
                  {loading ? "..." : balance !== null ? formatCurrency(balance) : "Rp 0"}
                </div>
                <p className="text-slate-700 text-xs lg:text-sm mt-2">
                  Gunakan voucher untuk menambah saldo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-lg">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-slate-900 text-base lg:text-lg">Informasi Akun</CardTitle>
                <CardDescription className="text-slate-600 text-xs lg:text-sm">
                  Data pribadi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-700 flex items-center gap-2">
                    <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    Nama Lengkap
                  </label>
                  <div className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-slate-900 text-sm lg:text-base break-words">
                    {fullName}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="h-3 w-3 lg:h-4 lg:w-4" />
                    Nomor WhatsApp
                  </label>
                  <div className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-slate-900 text-sm lg:text-base">
                    {phoneNumber}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                    Tanggal Lahir
                  </label>
                  <div className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 lg:px-4 lg:py-3 text-slate-900 text-sm lg:text-base">
                    {birthDate && typeof birthDate === 'string'
                      ? (() => {
                          const [year, month, day] = birthDate.split('-');
                          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        })()
                      : '-'}
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

            <Button
              onClick={() => setShowChangePasswordDialog(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 lg:h-12 text-sm lg:text-base"
            >
              <Key className="mr-2 h-4 w-4" />
              Ganti Password
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 text-xl">Ganti Password</DialogTitle>
            <DialogDescription className="text-slate-600">
              Masukkan password baru Anda dan verifikasi dengan kode OTP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {!otpSent ? (
              <>
                <p className="text-sm text-slate-700">
                  Klik tombol di bawah untuk mengirim kode OTP ke WhatsApp Anda
                </p>
                <Button
                  onClick={handleSendOTP}
                  disabled={sendingOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {sendingOtp ? "Mengirim OTP..." : "Kirim Kode OTP"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="Ketik ulang password baru"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-700">Kode OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="Masukkan 6 digit kode OTP"
                    maxLength={6}
                  />
                  <p className="text-xs text-slate-600">
                    Kode OTP telah dikirim ke WhatsApp Anda dan berlaku 5 menit
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSendOTP}
                    disabled={sendingOtp}
                    variant="outline"
                    className="flex-1 bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    {sendingOtp ? "Mengirim..." : "Kirim Ulang OTP"}
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {changingPassword ? "Mengubah..." : "Ubah Password"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
