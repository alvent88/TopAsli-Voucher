import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingCart, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/useBackend";
import { useEffect } from "react";

export default function PurchaseConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  
  const { productId, packageId, userId, gameId, productName, packageName, price, inquiryId, username } = location.state || {};
  
  console.log("=== PURCHASE CONFIRMATION PAGE ===");
  console.log("Location state:", location.state);
  console.log("Username from state:", username);
  console.log("Inquiry ID from state:", inquiryId);
  
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!productId || !packageId || !userId || !gameId) {
      navigate("/");
      return;
    }
    loadUserBalance();
  }, []);

  const loadUserBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await backend.balance.getUserBalance();
      setUserBalance(response.balance);
    } catch (error) {
      console.error("Failed to load balance:", error);
      setUserBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
    setLoading(true);
    try {
      const transaction = await backend.transaction.create({
        productId,
        packageId,
        paymentMethodId: 1,
        userId,
        gameId,
        inquiryId,
        username,
      });

      toast({
        title: "Transaksi Berhasil! 🎉",
        description: "Konfirmasi pembelian telah dikirim ke email dan WhatsApp Anda",
      });

      navigate("/transaction-success", {
        state: {
          transactionId: transaction.id,
          productName,
          packageName,
          price,
          userId,
          gameId,
          username,
        },
      });
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat transaksi",
        variant: "destructive",
      });
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

  const isSufficientBalance = userBalance >= price;
  const remainingBalance = userBalance - price;

  if (!productId || !packageId || !userId || !gameId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <nav className="border-b border-slate-800 bg-[#0f1229]">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-blue-400 hover:bg-slate-800"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Konfirmasi Pembelian</h1>
            <p className="text-slate-400">Pastikan detail pembelian Anda sudah benar</p>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Detail Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Produk</span>
                <span className="text-white font-semibold">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paket</span>
                <span className="text-white">{packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User ID</span>
                <span className="text-white font-mono text-xs">{userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game ID</span>
                <span className="text-white font-mono text-xs">{gameId}</span>
              </div>
              {username && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Username</span>
                  <span className="text-green-400 font-semibold text-sm">{username}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Anda
                  </span>
                  <span className={`font-semibold ${isSufficientBalance ? "text-green-400" : "text-red-400"}`}>
                    {balanceLoading ? "..." : formatCurrency(userBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-purple-400 font-bold">{formatCurrency(price)}</span>
                </div>
                {!balanceLoading && isSufficientBalance && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 text-xs">Sisa Saldo</span>
                    <span className="text-blue-400 text-xs font-semibold">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!balanceLoading && !isSufficientBalance ? (
            <Card className="bg-red-900/20 border-red-700/50 mb-6">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-full mb-2">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="text-red-400 font-semibold text-lg">⚠️ Saldo Tidak Mencukupi</div>
                  <p className="text-slate-300 text-sm">
                    Saldo Anda kurang dari total pembelian. Silakan redeem voucher lain untuk menambah saldo.
                  </p>
                  <div className="bg-red-950/50 rounded-lg p-3 mt-4">
                    <div className="text-xs text-slate-400 mb-1">Kekurangan</div>
                    <div className="text-red-400 font-bold text-lg">{formatCurrency(Math.abs(remainingBalance))}</div>
                  </div>
                  <Button
                    onClick={() => navigate("/redeem-voucher")}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Redeem Voucher
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleConfirmPurchase}
                disabled={loading || balanceLoading || !isSufficientBalance}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Konfirmasi Pembelian
                  </>
                )}
              </Button>

              <div className="bg-blue-600/10 border border-blue-700/30 rounded-lg p-4">
                <p className="text-blue-400 text-xs leading-relaxed text-center">
                  Dengan mengkonfirmasi pembelian, Anda menyetujui bahwa saldo akan dipotong sebesar {formatCurrency(price)} dan konfirmasi akan dikirim ke WhatsApp Anda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
