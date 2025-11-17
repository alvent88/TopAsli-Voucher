import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ticket, Loader2, CheckCircle2, Gift, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "@/lib/useBackend";
import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner({ onScan, onError, onClose }: { onScan: (code: string) => void; onError: (error: string) => void; onClose: () => void }) {
  const [cameraId, setCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<any[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCameras(devices);
        setCameraId(devices[0].id);
      }
    }).catch((err) => {
      console.error("Failed to get cameras:", err);
      onError("Tidak dapat mengakses kamera");
    });
  }, [onError]);

  useEffect(() => {
    if (!cameraId) return;

    let isMounted = true;

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            if (hasScannedRef.current || !isMounted) return;
            
            hasScannedRef.current = true;
            
            if (scannerRef.current) {
              try {
                const isScanning = scannerRef.current.getState() === 2;
                if (isScanning) {
                  await scannerRef.current.stop();
                }
              } catch (e) {
                console.log("Scanner already stopped or not running");
              }
            }
            
            onScan(decodedText);
            onClose();
          },
          (errorMessage) => {
          }
        );
      } catch (err) {
        console.error("Failed to start scanner:", err);
        if (isMounted) {
          onError("Gagal memulai scanner");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      hasScannedRef.current = false;
      
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        
        try {
          const isScanning = scanner.getState() === 2;
          if (isScanning) {
            scanner.stop().catch(() => {});
          }
        } catch (e) {
          console.log("Cleanup: scanner not running");
        }
      }
    };
  }, [cameraId, onScan, onError, onClose]);

  return (
    <div className="bg-slate-900 rounded-lg p-4 space-y-3">
      <div className="text-center">
        <p className="text-slate-300 text-sm mb-2">Arahkan QR code ke kamera</p>
      </div>
      {cameras.length > 1 && (
        <select 
          value={cameraId} 
          onChange={(e) => setCameraId(e.target.value)}
          className="w-full bg-slate-800 text-white border border-slate-600 rounded px-3 py-2 text-sm"
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>
      )}
      <div id="qr-reader" className="w-full"></div>
    </div>
  );
}

export default function RedeemVoucherPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const backend = useBackend();
  const isSignedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const [voucherCode, setVoucherCode] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [isFromQRScan, setIsFromQRScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    amount: number;
    newBalance: number;
  } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login');
    }
  }, [isSignedIn, navigate]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeToCheck = voucherCode.trim();
    
    if (!codeToCheck) {
      toast({
        title: "Error",
        description: "Masukkan kode voucher",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      const result = await backend.balance.redeemVoucher({
        code: codeToCheck.toUpperCase(),
      });

      setSuccess(true);
      setRedeemResult({
        amount: result.amount,
        newBalance: result.newBalance,
      });

      toast({
        title: "Berhasil! 🎉",
        description: result.message,
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Redeem error:", error);
      toast({
        title: "Gagal Redeem",
        description: error.message || "Kode voucher tidak valid",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    setVoucherCode(upperCode);
    setDisplayCode("*".repeat(upperCode.length));
    setIsFromQRScan(true);
    setShowScanner(false);
    
    toast({
      title: "QR Code Terdeteksi",
      description: "Kode voucher berhasil dipindai. Klik tombol Redeem untuk melanjutkan.",
    });
  }, [toast]);

  const handleScannerClose = useCallback(() => {
    setShowScanner(false);
  }, []);

  const handleScannerError = useCallback((error: string) => {
    console.error("QR Scanner error:", error);
    toast({
      title: "Error Scanner",
      description: "Gagal memindai QR code",
      variant: "destructive",
    });
    setShowScanner(false);
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0F1B2B]">
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

      <div className="container mx-auto px-4 py-8 lg:py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 mb-3 lg:mb-4">
              <Ticket className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">Redeem Voucher</h1>
            <p className="text-sm lg:text-base text-slate-400">Masukkan kode voucher atau scan QR code</p>
          </div>

          {!success ? (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-white text-base lg:text-lg">Kode Voucher</CardTitle>
                <CardDescription className="text-slate-400 text-xs lg:text-sm">
                  Masukkan kode voucher atau scan QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleRedeem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voucherCode" className="text-slate-300 text-xs lg:text-sm">
                      Kode Voucher
                    </Label>
                    <div className="relative">
                      <Input
                        id="voucherCode"
                        type="text"
                        placeholder="VOUCHER2024"
                        value={isFromQRScan ? displayCode : voucherCode}
                        onChange={(e) => {
                          const newValue = e.target.value.toUpperCase();
                          setVoucherCode(newValue);
                          setDisplayCode(newValue);
                          setIsFromQRScan(false);
                        }}
                        className="bg-slate-800 border-slate-600 text-white pl-9 lg:pl-10 text-base lg:text-lg tracking-wider uppercase"
                        disabled={loading || showScanner}
                        maxLength={32}
                      />
                      <Gift className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Kode voucher tidak case-sensitive
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowScanner(!showScanner)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                      disabled={loading}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      <span>{showScanner ? "Tutup Scanner" : "Scan QR"}</span>
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 lg:h-12 text-base lg:text-lg"
                      disabled={loading || !voucherCode.trim() || showScanner}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Ticket className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                          Redeem Voucher
                        </>
                      )}
                    </Button>
                  </div>

                  {showScanner && (
                    <div className="mt-4">
                      <QRScanner 
                        onScan={handleQRScan}
                        onError={handleScannerError}
                        onClose={handleScannerClose}
                      />
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
              <CardContent className="pt-4 lg:pt-6 pb-4 lg:pb-6">
                <div className="text-center space-y-3 lg:space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-green-600">
                    <CheckCircle2 className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-1 lg:mb-2">Berhasil!</h2>
                    <p className="text-sm lg:text-base text-slate-300">Voucher berhasil diredeem</p>
                  </div>
                  
                  {redeemResult && (
                    <div className="bg-slate-900/50 rounded-lg p-3 lg:p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-slate-300">Saldo Ditambahkan:</span>
                        <span className="text-green-400 font-bold text-base lg:text-lg">
                          + {formatCurrency(redeemResult.amount)}
                        </span>
                      </div>
                      <div className="border-t border-slate-700 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs lg:text-sm text-slate-300">Saldo Baru:</span>
                          <span className="text-white font-bold text-lg lg:text-xl">
                            {formatCurrency(redeemResult.newBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-400">
                    Anda akan dialihkan ke halaman utama...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 p-4 rounded-lg bg-blue-600/10 border border-blue-700/30">
            <p className="text-blue-400 text-xs leading-relaxed">
              <strong>Catatan:</strong><br />
              • Setiap voucher hanya dapat digunakan sekali per user<br />
              • Pastikan kode voucher masih aktif dan belum kadaluarsa<br />
              • Saldo akan otomatis bertambah setelah redeem berhasil<br />
              • QR Scanner akan mengisi kode voucher otomatis, tekan tombol Redeem untuk melanjutkan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
