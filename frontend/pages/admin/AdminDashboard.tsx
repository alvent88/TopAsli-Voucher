import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import { TrendingUp, Clock, CheckCircle, DollarSign, RefreshCw, MessageSquare, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/clerk-react";

interface DashboardStats {
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
  successTransactions: number;
}

export default function AdminDashboard() {
  const backend = useBackend();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    successTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  
  const [whatsappConfig, setWhatsappConfig] = useState({
    fonnteToken: "",
    phoneNumber: "",
    webhookUrl: "",
  });
  
  const [topupConfig, setTopupConfig] = useState({
    provider: "unipin",
    apiKey: "",
    merchantId: "",
    secretKey: "",
  });
  
  const [uniplayConfig, setUniplayConfig] = useState({
    apiKey: "",
    baseUrl: "https://api-reseller.uniplay.id/v1",
  });
  
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingPackages, setSyncingPackages] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);

  useEffect(() => {
    loadStats();
    loadConfig();
  }, []);

  const loadStats = async () => {
    try {
      const data = await backend.admin.dashboard();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadConfig = async () => {
    try {
      const { config } = await backend.admin.getConfig();
      setWhatsappConfig(config.whatsapp);
      setTopupConfig(config.topup);
      if (config.uniplay) {
        setUniplayConfig(config.uniplay);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };
  
  const handleSaveWhatsAppConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: topupConfig,
          uniplay: uniplayConfig,
        },
      });
      
      toast({
        title: "Tersimpan ✅",
        description: "Konfigurasi WhatsApp API berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan konfigurasi",
        variant: "destructive",
      });
    }
  };
  
  const handleTestWhatsApp = async () => {
    if (!whatsappConfig.phoneNumber) {
      toast({
        title: "Error",
        description: "Masukkan nomor WhatsApp terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setTestingWhatsApp(true);
    try {
      await backend.whatsapp.testWhatsApp({ phoneNumber: "0818848168" });
      
      toast({
        title: "Berhasil! ✅",
        description: `Pesan test berhasil dikirim ke 0818848168`,
      });
    } catch (error: any) {
      console.error("WhatsApp test error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan WhatsApp. Pastikan FonnteToken sudah di-set di Settings.",
        variant: "destructive",
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };
  
  const handleSaveTopupConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: topupConfig,
          uniplay: uniplayConfig,
        },
      });
      
      toast({
        title: "Tersimpan ✅",
        description: "Konfigurasi API Topup berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan konfigurasi",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveUniPlayConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: topupConfig,
          uniplay: uniplayConfig,
        },
      });
      
      toast({
        title: "Tersimpan ✅",
        description: "Konfigurasi UniPlay API berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan konfigurasi",
        variant: "destructive",
      });
    }
  };
  
  const handleSyncProducts = async () => {
    setSyncingProducts(true);
    try {
      const result = await backend.uniplay.syncServices();
      console.log("Sync result:", result);
      
      if (result.success) {
        toast({
          title: "Sync Berhasil! ✅",
          description: `Vouchers: ${result.voucherCount} | Games: ${result.gameCount} | Baru: ${result.synced} | Update: ${result.updated}`,
        });
        
        if (result.errors.length > 0) {
          console.error("Sync errors:", result.errors);
          toast({
            title: "Warning",
            description: `${result.errors.length} error terjadi. Lihat console untuk detail.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sync Gagal ❌",
          description: "Gagal sync dari UniPlay",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal sync pricelist dari UniPlay",
        variant: "destructive",
      });
    } finally {
      setSyncingProducts(false);
    }
  };
  
  const handleSyncPackages = async () => {
    setSyncingPackages(true);
    try {
      const balance = await backend.uniplay.getBalance();
      console.log("Balance response:", balance);
      
      if (balance.status === "success" || balance.status === "200") {
        toast({
          title: "Balance Check ✅",
          description: `Saldo UniPlay: ${balance.saldo.toLocaleString('id-ID')} poin`,
        });
      } else {
        toast({
          title: "Error",
          description: balance.message || "Gagal cek balance - response invalid",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to get balance:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal cek balance UniPlay",
        variant: "destructive",
      });
    } finally {
      setSyncingPackages(false);
    }
  };
  
  const handleTestDTU = async () => {
    try {
      const result = await backend.uniplay.testDTU();
      console.log("=== Test DTU Full Result ===");
      console.log("Success:", result.success);
      console.log("Game Count:", result.gameCount);
      console.log("First Game:", result.firstGame);
      console.log("Raw Response:", result.rawResponse);
      console.log("Error:", result.error);
      
      if (result.success) {
        toast({
          title: "Test DTU Berhasil! ✅",
          description: `Found ${result.gameCount} games. First: ${result.firstGame?.name || "N/A"}`,
        });
      } else {
        toast({
          title: "Test DTU Gagal ❌",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test DTU error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal test DTU",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllProducts = async () => {
    // Konfirmasi dulu
    if (!confirm("⚠️ PERINGATAN!\n\nIni akan menghapus SEMUA produk dan paket dari database!\n\nApakah Anda yakin?")) {
      return;
    }
    
    if (!confirm("Konfirmasi sekali lagi!\n\nSemua data produk akan hilang permanen. Lanjutkan?")) {
      return;
    }

    try {
      console.log("Calling deleteAllProducts...");
      const result = await backend.admin.deleteAllProducts();
      console.log("Delete result:", result);
      
      if (result.success) {
        toast({
          title: "Berhasil Dihapus! 🗑️",
          description: `${result.deletedProducts} produk, ${result.deletedPackages} paket, dan ${result.deletedTransactions} transaksi telah dihapus`,
        });
      } else {
        toast({
          title: "Error",
          description: "Delete tidak berhasil",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus produk",
        variant: "destructive",
      });
    }
  };

  const handleCheckTime = async () => {
    try {
      const result = await backend.uniplay.checkTime();
      console.log("=== Server Time Check ===");
      console.log("Server Time:", result.serverTime);
      console.log("Server Year:", result.serverYear);
      console.log("Jakarta Time:", result.jakartaTime);
      console.log("Formatted (normal):", result.formattedTimestamp);
      console.log("Forced 2024:", result.forced2024);
      console.log("Forced 2025:", result.forced2025);
      
      toast({
        title: "⏰ Server Time Info",
        description: `Server: ${result.serverYear} | Jakarta: ${result.formattedTimestamp.substring(0, 16)}`,
      });
    } catch (error: any) {
      console.error("Check time error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal cek waktu server",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await backend.uniplay.testConnection();
      console.log("Test connection result:", result);
      
      if (result.success) {
        toast({
          title: "Koneksi Berhasil! ✅",
          description: result.message,
        });
      } else {
        toast({
          title: "Koneksi Gagal ❌",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test connection error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal test koneksi",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setRunningDiagnostic(true);
    try {
      const result = await backend.uniplay.debugAuth();
      console.log("Debug Auth Result:");
      console.table(result.results);
      
      const failedStep = result.results.find(r => !r.success);
      
      if (failedStep) {
        toast({
          title: `Failed at: ${failedStep.step} ❌`,
          description: failedStep.error || "Check console for details",
          variant: "destructive",
        });
      } else {
        toast({
          title: "All Steps Passed! ✅",
          description: "Check console for detailed results",
        });
      }
    } catch (error: any) {
      console.error("Debug error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal run debug",
        variant: "destructive",
      });
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Transaksi",
      value: stats.totalTransactions.toString(),
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Pendapatan",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Transaksi Pending",
      value: stats.pendingTransactions.toString(),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Transaksi Berhasil",
      value: stats.successTransactions.toString(),
      icon: CheckCircle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Ringkasan statistik dan aktivitas</p>
        </div>
        <Button
          onClick={loadStats}
          variant="outline"
          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="text-white">Refresh</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingBag className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">UniPlay API</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Integrasi dengan UniPlay Reseller</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uniplay-api-key" className="text-slate-300">API Key *</Label>
              <Input
                id="uniplay-api-key"
                type="password"
                value={uniplayConfig.apiKey}
                onChange={(e) => setUniplayConfig({ ...uniplayConfig, apiKey: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="1LGTJIAUCE7P8G158G3F4GSF68JRM7EB4MBQIO"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uniplay-base-url" className="text-slate-300">Base URL</Label>
              <Input
                id="uniplay-base-url"
                value={uniplayConfig.baseUrl}
                onChange={(e) => setUniplayConfig({ ...uniplayConfig, baseUrl: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://api-reseller.uniplay.id/v1"
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <div className="space-y-3">
                <Button
                  onClick={handleSaveUniPlayConfig}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  Simpan Konfigurasi
                </Button>
                <Button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  variant="outline"
                  className="w-full border-green-700 text-green-400 hover:bg-green-900/20"
                >
                  {testingConnection ? "Testing..." : "🧪 Test Connection"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleTestDTU}
                    variant="outline"
                    className="border-pink-700 text-pink-400 hover:bg-pink-900/20 text-xs"
                  >
                    🎮 DTU
                  </Button>
                  <Button
                    onClick={handleSyncProducts}
                    disabled={syncingProducts}
                    variant="outline"
                    className="border-blue-700 text-blue-400 hover:bg-blue-900/20 text-xs"
                  >
                    {syncingProducts ? "..." : "🔄 Sync"}
                  </Button>
                  <Button
                    onClick={handleSyncPackages}
                    disabled={syncingPackages}
                    variant="outline"
                    className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/20 text-xs"
                  >
                    {syncingPackages ? "..." : "💰 Balance"}
                  </Button>
                </div>
                <Button
                  onClick={handleDeleteAllProducts}
                  variant="outline"
                  className="w-full border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
                >
                  🗑️ Delete All Products
                </Button>
              </div>
            )}
            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Info:</strong> Gunakan Run Diagnostic untuk menemukan endpoint yang benar, Test Connection untuk cek koneksi, Sync Pricelist untuk ambil daftar produk.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">WhatsApp API</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Konfigurasi koneksi WhatsApp</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fonnte-token" className="text-slate-300">Fonnte Token *</Label>
              <Input
                id="fonnte-token"
                type="password"
                value={whatsappConfig.fonnteToken}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, fonnteToken: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Token dari dashboard Fonnte"
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-500">
                Dapatkan token di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">fonnte.com</a> → Dashboard → Salin Token
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-phone" className="text-slate-300">Nomor WhatsApp (Opsional)</Label>
              <Input
                id="wa-phone"
                value={whatsappConfig.phoneNumber}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="628xxxxxxxxxx"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-webhook" className="text-slate-300">Webhook URL (Opsional)</Label>
              <Input
                id="wa-webhook"
                value={whatsappConfig.webhookUrl}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhookUrl: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://yourdomain.com/webhook/whatsapp"
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveWhatsAppConfig}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Simpan Konfigurasi
                </Button>
                <Button
                  onClick={handleTestWhatsApp}
                  disabled={testingWhatsApp}
                  variant="outline"
                  className="border-green-700 text-green-400 hover:bg-green-900/20"
                >
                  {testingWhatsApp ? "Mengirim..." : "🧪 Test Kirim"}
                </Button>
              </div>
            )}
            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Catatan:</strong> Tombol Test akan mengirim pesan ke nomor 0818848168. 
              Pastikan FonnteToken sudah di-set di Settings → Secrets.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ShoppingBag className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">API Provider Topup</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Koneksi ke UniPin/UniPlay/LapakGaming/Codashop</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-slate-300">Provider</Label>
              <select
                id="provider"
                value={topupConfig.provider}
                onChange={(e) => setTopupConfig({ ...topupConfig, provider: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md"
                disabled={!canEdit}
              >
                <option value="unipin">UniPin</option>
                <option value="uniplay">UniPlay</option>
                <option value="lapakgaming">LapakGaming</option>
                <option value="codashop">Codashop</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant-id" className="text-slate-300">Merchant ID</Label>
              <Input
                id="merchant-id"
                value={topupConfig.merchantId}
                onChange={(e) => setTopupConfig({ ...topupConfig, merchantId: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Merchant ID dari provider"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topup-api-key" className="text-slate-300">API Key</Label>
              <Input
                id="topup-api-key"
                type="password"
                value={topupConfig.apiKey}
                onChange={(e) => setTopupConfig({ ...topupConfig, apiKey: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="API Key dari provider"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key" className="text-slate-300">Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                value={topupConfig.secretKey}
                onChange={(e) => setTopupConfig({ ...topupConfig, secretKey: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Secret Key dari provider"
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <Button
                onClick={handleSaveTopupConfig}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Simpan Konfigurasi Provider
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
