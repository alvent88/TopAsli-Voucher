import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Home, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { transactionId, productName, packageName, price, userId, gameId } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!transactionId) {
      navigate("/");
      return;
    }

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [transactionId, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] relative overflow-hidden">
      {showConfetti && (
        <>
          <div className="confetti-container left">
            {[...Array(100)].map((_, i) => {
              const colors = ["#fbbf24", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#a855f7", "#ef4444"];
              const shapes = ["square", "circle", "rectangle"];
              const shape = shapes[Math.floor(Math.random() * shapes.length)];
              return (
                <div
                  key={`left-${i}`}
                  className={`confetti confetti-${shape}`}
                  style={{
                    left: `${Math.random() * 30}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2.5 + Math.random() * 1.5}s`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  }}
                />
              );
            })}
          </div>
          <div className="confetti-container right">
            {[...Array(100)].map((_, i) => {
              const colors = ["#fbbf24", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#84cc16", "#a855f7", "#ef4444"];
              const shapes = ["square", "circle", "rectangle"];
              const shape = shapes[Math.floor(Math.random() * shapes.length)];
              return (
                <div
                  key={`right-${i}`}
                  className={`confetti confetti-${shape}`}
                  style={{
                    right: `${Math.random() * 30}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2.5 + Math.random() * 1.5}s`,
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  }}
                />
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
                <div className="flex justify-between">
                  <span className="text-slate-400">User ID</span>
                  <span className="text-white font-mono text-xs">{userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Game ID</span>
                  <span className="text-white font-mono text-xs">{gameId}</span>
                </div>
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
        .confetti-container {
          position: fixed;
          top: 0;
          width: 40%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        .confetti-container.left {
          left: 0;
        }

        .confetti-container.right {
          right: 0;
        }

        .confetti {
          position: absolute;
          top: -20px;
        }

        .confetti-square {
          width: 8px;
          height: 8px;
        }

        .confetti-circle {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .confetti-rectangle {
          width: 10px;
          height: 6px;
          border-radius: 2px;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0) rotateZ(0deg) rotateY(0deg);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(calc(-50px + 100px * var(--random-x, 0.5))) rotateZ(calc(360deg * var(--random-rotate, 3))) rotateY(calc(180deg * var(--random-y, 2)));
            opacity: 0.8;
          }
        }

        .confetti-container.left .confetti {
          animation: confetti-fall var(--duration, 3s) cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay, 0s) forwards;
          --random-x: ${Math.random()};
          --random-rotate: ${2 + Math.random() * 4};
          --random-y: ${1 + Math.random() * 2};
        }

        .confetti-container.right .confetti {
          animation: confetti-fall var(--duration, 3s) cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay, 0s) forwards;
          --random-x: ${Math.random()};
          --random-rotate: ${2 + Math.random() * 4};
          --random-y: ${1 + Math.random() * 2};
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
