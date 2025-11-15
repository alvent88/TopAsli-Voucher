import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBackend } from "@/lib/useBackend";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PurchaseInquiryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [inquiryData, setInquiryData] = useState<any>(null);
  const [username, setUsername] = useState<string>("");

  // Get params from URL
  const packageId = parseInt(searchParams.get("packageId") || "0");
  const userId = searchParams.get("userId") || "";
  const serverId = searchParams.get("serverId") || "";
  const preValidatedUsername = searchParams.get("username") || "";
  
  // Prevent navigation away without confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading || confirming) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, confirming]);

  useEffect(() => {
    console.log("=== PURCHASE INQUIRY INIT ===");
    console.log("packageId:", packageId);
    console.log("userId:", userId);
    console.log("serverId:", serverId);
    console.log("preValidatedUsername:", preValidatedUsername);

    if (!packageId) {
      console.error("Missing packageId, redirecting to home");
      toast({
        title: "Invalid Request",
        description: "Data tidak lengkap",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    performInquiry();
  }, []);

  const performInquiry = async () => {
    try {
      setLoading(true);
      
      // Call inquiry-payment endpoint
      const response = await backend.uniplay.inquiryPaymentEndpoint({
        packageId,
        userId,
        serverId: serverId || undefined,
      });

      console.log("✅ Inquiry response:", response);

      if (!response.success) {
        console.error("❌ Inquiry failed:", response.message);
        throw new Error(response.message || "Inquiry failed");
      }

      // Use pre-validated username from ProductPage if available, otherwise use UniPlay inquiry username
      const finalUsername = preValidatedUsername || response.username || "-";
      setUsername(finalUsername);
      
      console.log("Final username:", finalUsername);
      
      // Update inquiryData to include the validated username
      const updatedData = {
        ...response,
        username: finalUsername !== "-" ? finalUsername : response.username,
      };
      
      console.log("Updated inquiry data:", updatedData);
      setInquiryData(updatedData);
    } catch (error: any) {
      console.error("Inquiry failed:", error);
      console.error("❌ Inquiry error details:", error);
      toast({
        title: "Inquiry Gagal",
        description: error.message || "Gagal melakukan inquiry ke UniPlay",
        variant: "destructive",
      });
      // Use replace to avoid adding to history
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setShowConfirmDialog(false);

      console.log("=== CREATING TRANSACTION ===");
      console.log("ProductId:", inquiryData.productId);
      console.log("PackageId:", packageId);
      console.log("UserId:", userId);
      console.log("ServerId:", serverId);
      console.log("InquiryId:", inquiryData.inquiryId);
      console.log("Username:", inquiryData.username);

      // Create transaction first
      const createResponse = await backend.transaction.create({
        productId: inquiryData.productId,
        packageId,
        userId: userId || "",
        gameId: serverId || "",
        inquiryId: inquiryData.inquiryId,
        username: inquiryData.username || "",
      });

      console.log("✅ Transaction created:", createResponse);

      console.log("=== CONFIRMING PAYMENT ===");
      // Confirm payment with UniPlay
      const confirmResponse = await backend.uniplay.confirmPaymentEndpoint({
        inquiryId: inquiryData.inquiryId,
        transactionId: createResponse.transactionId,
      });

      console.log("✅ Payment confirmed:", confirmResponse);

      if (!confirmResponse.success) {
        console.error("❌ Payment confirmation failed:", confirmResponse.message);
        throw new Error(confirmResponse.message || "Payment confirmation failed");
      }

      toast({
        title: "Berhasil! ✅",
        description: "Pembelian berhasil dikonfirmasi",
      });

      console.log("=== NAVIGATING TO SUCCESS PAGE ===");
      console.log("Transaction ID:", createResponse.transactionId);
      
      // Use replace to clear history and force reload
      navigate(`/transaction-success?id=${createResponse.transactionId}`, { replace: true });
    } catch (error: any) {
      console.error("❌ Confirm failed:", error);
      console.error("Error stack:", error.stack);
      toast({
        title: "Konfirmasi Gagal",
        description: error.message || "Gagal mengkonfirmasi pembelian",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Memproses inquiry...</p>
        </div>
      </div>
    );
  }

  if (!inquiryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              Konfirmasi Pembelian
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Pastikan data sudah benar sebelum melanjutkan
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Produk:</span>
                <span className="text-white font-medium">{inquiryData.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paket:</span>
                <span className="text-white font-medium">{inquiryData.packageName}</span>
              </div>
              {userId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-white font-mono">{userId}</span>
                </div>
              )}
              {serverId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Server ID:</span>
                  <span className="text-white font-mono">{serverId}</span>
                </div>
              )}
              {username && username !== "-" && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Username:</span>
                  <span className="text-green-400 font-medium">
                    {username}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300 font-medium">Total Harga:</span>
                  <span className="text-green-400 font-bold">
                    {formatCurrency(inquiryData.price)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirmPurchase}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium h-12"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "✅ Konfirmasi Pembelian"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Konfirmasi Pembelian?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Apakah Anda yakin ingin melanjutkan pembelian <strong className="text-white">{inquiryData.packageName}</strong> untuk <strong className="text-white">{inquiryData.productName}</strong> dengan harga <strong className="text-green-400">{formatCurrency(inquiryData.price)}</strong>?
              <br /><br />
              Transaksi tidak dapat dibatalkan setelah dikonfirmasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Ya, Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
