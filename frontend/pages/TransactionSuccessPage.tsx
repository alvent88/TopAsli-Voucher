import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Home, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackend } from "@/lib/useBackend";
import { useToast } from "@/components/ui/use-toast";

export default function TransactionSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backend = useBackend();
  const { toast } = useToast();
  
  const stateData = location.state || {};
  const queryTransactionId = searchParams.get("id");
  
  const [showConfetti, setShowConfetti] = useState(true);
  const [loading, setLoading] = useState(!!queryTransactionId);
  const [transactionData, setTransactionData] = useState<any>(stateData);

  useEffect(() => {
    const fetchTransaction = async () => {
      console.log("=== TRANSACTION SUCCESS PAGE ===");
      console.log("Query Transaction ID:", queryTransactionId);
      console.log("State Data:", stateData);
      
      if (queryTransactionId && !stateData.transactionId) {
        try {
          console.log("Fetching transaction data from API...");
          setLoading(true);
          const transaction = await backend.transaction.get({ id: queryTransactionId });
          
          console.log("✅ Transaction fetched:", transaction);
          
          setTransactionData({
            transactionId: transaction.id,
            productName: transaction.productName,
            packageName: transaction.packageName,
            price: transaction.price,
            userId: transaction.userId,
            gameId: transaction.gameId,
            username: transaction.username,
          });
        } catch (error) {
          console.error("❌ Failed to fetch transaction:", error);
          toast({
            title: "Error",
            description: "Gagal memuat data transaksi",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
          return;
        } finally {
          setLoading(false);
        }
      } else if (!stateData.transactionId && !queryTransactionId) {
        console.error("No transaction data available, redirecting...");
        navigate("/", { replace: true });
        return;
      } else {
        console.log("✅ Using state data:", stateData);
      }
    };

    fetchTransaction();
  }, [queryTransactionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1B2B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  const { transactionId, productName, packageName, price, userId, gameId, username } = transactionData;

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {showConfetti && (
        <>
          <div className="fireworks-container left">
            {[...Array(10)].map((_, i) => {
              const baseDelay = i * 0.4;
              return (
                <div
                  key={`firework-left-${i}`}
                  className="firework"
                  style={{
                    left: `${Math.random() * 25}%`,
                    top: `${Math.random() * 80 + 10}%`,
                  }}
                >
                  {[...Array(30)].map((_, j) => {
                    const angle = (j / 30) * 360;
                    const colors = ["#fbbf24", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#a855f7", "#ef4444"];
                    return (
                      <div
                        key={`particle-${j}`}
                        className="particle"
                        style={{
                          '--angle': `${angle}deg`,
                          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                          animationDelay: `${baseDelay}s`,
                        } as any}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="fireworks-container right">
            {[...Array(10)].map((_, i) => {
              const baseDelay = i * 0.4 + 0.2;
              return (
                <div
                  key={`firework-right-${i}`}
                  className="firework"
                  style={{
                    right: `${Math.random() * 25}%`,
                    top: `${Math.random() * 80 + 10}%`,
                  }}
                >
                  {[...Array(30)].map((_, j) => {
                    const angle = (j / 30) * 360;
                    const colors = ["#fbbf24", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#a855f7", "#ef4444"];
                    return (
                      <div
                        key={`particle-${j}`}
                        className="particle"
                        style={{
                          '--angle': `${angle}deg`,
                          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                          animationDelay: `${baseDelay}s`,
                        } as any}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6 animate-bounce-slow">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">Transaksi Berhasil! 🎉</h1>
            <p className="text-slate-400 animate-fade-in-delay">Pembayaran Anda telah dikonfirmasi</p>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700 mb-6 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                Detail Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">ID Transaksi</div>
                <div className="text-white font-mono text-sm">{transactionId}</div>
              </div>
              
              <div className="space-y-2 text-sm border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produk</span>
                  <span className="text-white font-semibold">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paket</span>
                  <span className="text-white">{packageName}</span>
                </div>
                {username && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username</span>
                    <span className="text-green-400 font-semibold text-sm">{username}</span>
                  </div>
                )}
                {userId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID</span>
                    <span className="text-white font-mono text-xs">{userId}</span>
                  </div>
                )}
                {gameId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Server ID</span>
                    <span className="text-white font-mono text-xs">{gameId}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
                  <span className="text-white font-semibold">Total Dibayar</span>
                  <span className="text-green-400 font-bold">{formatCurrency(price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 animate-slide-up-delay">
            <Button
              onClick={() => navigate("/transactions")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Lihat Riwayat Transaksi
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-green-600/10 border border-green-700/30 animate-fade-in-delay-2">
            <p className="text-green-400 text-sm text-center leading-relaxed">
              Saldo Anda telah dipotong sebesar {formatCurrency(price)}. Item akan segera diproses dan dikirim ke akun game Anda.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .fireworks-container {
          position: fixed;
          top: 0;
          width: 30%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        .fireworks-container.left {
          left: 0;
        }

        .fireworks-container.right {
          right: 0;
        }

        .firework {
          position: absolute;
          width: 10px;
          height: 10px;
        }

        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform-origin: center;
          opacity: 0;
          animation: explode 1.5s ease-out forwards;
        }

        @keyframes explode {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(150px);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.5s ease-out 0.6s both;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.3s both;
        }

        .animate-slide-up-delay {
          animation: slide-up 0.5s ease-out 0.5s both;
        }
      `}</style>
    </div>
  );
}
