import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import { TrendingUp, Clock, CheckCircle, DollarSign, RefreshCw, MessageSquare, ShoppingBag, TestTube2, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/clerk-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [uniplayBalance, setUniplayBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const [whatsappConfig, setWhatsappConfig] = useState({
    fonnteToken: "",
    phoneNumber: "",
    webhookUrl: "",
  });
  
  const [uniplayConfig, setUniplayConfig] = useState({
    apiKey: "",
    baseUrl: "https://api-reseller.uniplay.id/v1",
    pincode: "",
  });
  
  const [gmailConfig, setGmailConfig] = useState({
    uniplaySenderEmail: "",
  });
  
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingVouchers, setSyncingVouchers] = useState(false);
  const [syncingPackages, setSyncingPackages] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  
  // UniPlay API Response states
  const [uniplayApiResponse, setUniplayApiResponse] = useState("");
  const [uniplayCurlCommand, setUniplayCurlCommand] = useState("");
  
  // Setup Gmail Watch states
  const [settingUpGmailWatch, setSettingUpGmailWatch] = useState(false);
  const [stoppingGmailWatch, setStoppingGmailWatch] = useState(false);
  const [debuggingWebhook, setDebuggingWebhook] = useState(false);
  const [gmailWatchResponse, setGmailWatchResponse] = useState("");

  useEffect(() => {
    loadStats();
    loadConfig();
    loadUniplayBalance();
    
    const interval = setInterval(loadUniplayBalance, 60000);
    return () => clearInterval(interval);
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
      if (config.uniplay) {
        setUniplayConfig(config.uniplay);
      }
      if (config.gmail) {
        setGmailConfig(config.gmail);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const loadUniplayBalance = async () => {
    try {
      setLoadingBalance(true);
      setBalanceError(null);
      const response = await backend.admin.getUniplayBalance();
      setUniplayBalance(response.balance);
    } catch (error: any) {
      console.error("Failed to load UniPlay balance:", error);
      setBalanceError(error.message || "Gagal memuat saldo");
      setUniplayBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };
  
  const handleSaveWhatsAppConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: {
            provider: "unipin",
            apiKey: "",
            merchantId: "",
            secretKey: "",
          },
          uniplay: uniplayConfig,
          gmail: gmailConfig,
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
  
  const handleSaveUniPlayConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: {
            provider: "unipin",
            apiKey: "",
            merchantId: "",
            secretKey: "",
          },
          uniplay: uniplayConfig,
          gmail: gmailConfig,
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
  
  const handleSyncVouchers = async () => {
    setSyncingVouchers(true);
    setUniplayApiResponse("");
    setUniplayCurlCommand("");
    try {
      const result = await backend.uniplay.testVoucher();
      console.log("=== Sync Vouchers Result ===");
      console.log("Success:", result.success);
      console.log("Voucher Count:", result.voucherCount);
      console.log("Products Synced:", result.productsSynced);
      console.log("Packages Created:", result.packagesCreated);
      
      if (result.curlCommand) {
        setUniplayCurlCommand(result.curlCommand);
      }
      
      const { curlCommand, ...responseWithoutCurl } = result;
      setUniplayApiResponse(JSON.stringify(responseWithoutCurl, null, 2));
      
      if (result.success) {
        toast({
          title: "✅ Sync Vouchers Berhasil!",
          description: `Vouchers: ${result.voucherCount} | Products: ${result.productsSynced} | Packages: ${result.packagesCreated}`,
        });
      } else {
        toast({
          title: "❌ Sync Gagal",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Sync vouchers error:", error);
      setUniplayApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      toast({
        title: "Error",
        description: error.message || "Gagal sync vouchers",
        variant: "destructive",
      });
    } finally {
      setSyncingVouchers(false);
    }
  };

  const handleSyncPackages = async () => {
    setSyncingPackages(true);
    setUniplayApiResponse("");
    setUniplayCurlCommand("");
    try {
      const balance = await backend.uniplay.getBalance();
      console.log("Balance response:", balance);
      
      // Extract curl command
      if (balance.curlCommand) {
        setUniplayCurlCommand(balance.curlCommand);
      }
      
      // Remove curlCommand from response before displaying
      const { curlCommand, ...responseWithoutCurl } = balance as any;
      setUniplayApiResponse(JSON.stringify(responseWithoutCurl, null, 2));
      
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
      setUniplayApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
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
    setUniplayApiResponse("");
    setUniplayCurlCommand("");
    try {
      const result = await backend.uniplay.testDTU();
      console.log("=== Test DTU Full Result ===");
      console.log("Success:", result.success);
      console.log("Game Count:", result.gameCount);
      console.log("Products Synced:", result.productsSynced);
      console.log("Packages Created:", result.packagesCreated);
      console.log("First Game:", result.firstGame);
      console.log("Raw Response:", result.rawResponse);
      console.log("Error:", result.error);
      
      // Extract curl command
      if (result.curlCommand) {
        setUniplayCurlCommand(result.curlCommand);
      }
      
      // Remove curlCommand from response before displaying
      const { curlCommand, ...responseWithoutCurl } = result;
      setUniplayApiResponse(JSON.stringify(responseWithoutCurl, null, 2));
      
      if (result.success) {
        toast({
          title: "✅ Test DTU Berhasil!",
          description: `Games: ${result.gameCount} | Products: ${result.productsSynced} | Packages: ${result.packagesCreated}`,
        });
      } else {
        toast({
          title: "❌ Test DTU Gagal",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test DTU error:", error);
      setUniplayApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
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

  const handleSaveGmailConfig = async () => {
    try {
      await backend.admin.saveConfig({
        config: {
          whatsapp: whatsappConfig,
          topup: {
            provider: "unipin",
            apiKey: "",
            merchantId: "",
            secretKey: "",
          },
          uniplay: uniplayConfig,
          gmail: gmailConfig,
        },
      });
      
      toast({
        title: "Tersimpan ✅",
        description: "Email pengirim UniPlay berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Failed to save gmail config:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan konfigurasi email",
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
    setUniplayApiResponse("");
    setUniplayCurlCommand("");
    try {
      const result = await backend.uniplay.testConnection();
      console.log("Test connection result:", result);
      
      // Extract curl command
      if (result.curlCommand) {
        setUniplayCurlCommand(result.curlCommand);
      }
      
      // Remove curlCommand from response before displaying
      const { curlCommand, ...responseWithoutCurl } = result;
      setUniplayApiResponse(JSON.stringify(responseWithoutCurl, null, 2));
      
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
      setUniplayApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      toast({
        title: "Error",
        description: error.message || "Gagal test koneksi",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };


  const handleSetupGmailWatch = async () => {
    setSettingUpGmailWatch(true);
    setGmailWatchResponse("");
    
    try {
      toast({
        title: "⚙️ Setting up Gmail Watch",
        description: "Activating push notifications...",
      });
      
      const result = await backend.gmail.setupGmailWatch();
      
      setGmailWatchResponse(JSON.stringify(result, null, 2));
      
      if (result.success) {
        toast({
          title: "✅ Gmail Watch Active!",
          description: `Push notifications enabled until ${result.expirationDate ? new Date(result.expirationDate).toLocaleDateString() : 'unknown'}`,
        });
      } else {
        toast({
          title: "❌ Setup Failed",
          description: result.message || "Failed to setup Gmail watch",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Setup Gmail watch error:", error);
      setGmailWatchResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal setup Gmail watch",
        variant: "destructive",
      });
    } finally {
      setSettingUpGmailWatch(false);
    }
  };
  
  const handleStopGmailWatch = async () => {
    setStoppingGmailWatch(true);
    setGmailWatchResponse("");
    
    try {
      toast({
        title: "⚙️ Stopping Gmail Watch",
        description: "Deactivating push notifications...",
      });
      
      const result = await backend.gmail.stopGmailWatch();
      
      setGmailWatchResponse(JSON.stringify(result, null, 2));
      
      if (result.success) {
        toast({
          title: "✅ Gmail Watch Stopped!",
          description: "Push notifications are now disabled",
        });
      } else {
        toast({
          title: "❌ Stop Failed",
          description: result.message || "Failed to stop Gmail watch",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Stop Gmail watch error:", error);
      setGmailWatchResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal stop Gmail watch",
        variant: "destructive",
      });
    } finally {
      setStoppingGmailWatch(false);
    }
  };

  const handleDebugWebhook = async () => {
    setDebuggingWebhook(true);
    setGmailWatchResponse("");
    
    try {
      toast({
        title: "🔍 Debugging Webhook",
        description: "Checking email configuration and latest message...",
      });
      
      const result = await backend.gmail.debugWebhook();
      
      setGmailWatchResponse(JSON.stringify(result, null, 2));
      
      if (result.success) {
        if (result.alreadyProcessed) {
          toast({
            title: "⚠️ Email Already Processed",
            description: `Latest email from ${result.latestEmailFrom} was already processed. Try sending a new email.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "✅ Debug Complete",
            description: `Found email from ${result.latestEmailFrom}. Check result below for details.`,
          });
        }
      } else {
        toast({
          title: "❌ Debug Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Debug webhook error:", error);
      setGmailWatchResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal debug webhook",
        variant: "destructive",
      });
    } finally {
      setDebuggingWebhook(false);
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
    {
      title: "Saldo UniPlay",
      value: loadingBalance 
        ? "Loading..." 
        : balanceError 
          ? "Error" 
          : uniplayBalance !== null 
            ? formatCurrency(uniplayBalance)
            : "N/A",
      icon: Wallet,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      action: loadUniplayBalance,
      actionLabel: "Refresh",
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

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  {stat.action && (
                    <Button
                      onClick={stat.action}
                      variant="ghost"
                      size="sm"
                      disabled={loadingBalance}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingBalance ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
                {balanceError && stat.title === "Saldo UniPlay" && (
                  <p className="text-xs text-red-400 mt-1">{balanceError}</p>
                )}
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
            <div className="space-y-2">
              <Label htmlFor="uniplay-pincode" className="text-slate-300">Pincode *</Label>
              <Input
                id="uniplay-pincode"
                type="password"
                value={uniplayConfig.pincode}
                onChange={(e) => setUniplayConfig({ ...uniplayConfig, pincode: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white font-mono"
                placeholder="123456"
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-400">Pincode untuk confirm payment ke UniPlay</p>
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
                    onClick={handleSyncVouchers}
                    disabled={syncingVouchers}
                    variant="outline"
                    className="border-purple-700 text-purple-400 hover:bg-purple-900/20 text-xs"
                  >
                    {syncingVouchers ? "..." : "🎫 Voucher"}
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
            
            <div className="space-y-2">
              <Label className="text-slate-300">Request cURL</Label>
              <Textarea
                value={uniplayCurlCommand}
                readOnly
                className="bg-slate-800 border-slate-700 text-green-400 font-mono text-xs h-40 resize-none"
                placeholder="cURL command akan muncul di sini setelah menekan tombol API..."
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">UniPlay API Response</Label>
              <Textarea
                value={uniplayApiResponse}
                readOnly
                className="bg-slate-800 border-slate-700 text-cyan-400 font-mono text-xs h-64 resize-none"
                placeholder="Response dari UniPlay API akan muncul di sini..."
              />
            </div>
            
            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Info:</strong> Gunakan Test Connection, DTU, Sync, atau Balance untuk melihat request dan response dari UniPlay API.
            </div>
          </CardContent>
        </Card>

        {/* Setup Gmail Watch */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Setup Gmail Push Notifications</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Activate real-time email notifications</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uniplay-sender-email" className="text-slate-300">
                UniPlay Sender Email *
              </Label>
              <Input
                id="uniplay-sender-email"
                type="email"
                value={gmailConfig.uniplaySenderEmail}
                onChange={(e) => setGmailConfig({ ...gmailConfig, uniplaySenderEmail: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g., noreply@uniplay.id"
                disabled={!canEdit}
              />
              <p className="text-xs text-slate-500">
                Email pengirim dari UniPlay yang akan kita ambil kode vouchernya
              </p>
            </div>

            <Button
              onClick={handleSaveGmailConfig}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              💾 Simpan Email Konfigurasi
            </Button>

            <div className="text-sm text-slate-300 bg-blue-900/20 p-4 rounded-lg border border-blue-700">
              <strong className="text-blue-400">ℹ️ Gmail Watch:</strong>
              <p className="mt-2">Gmail Watch harus di-activate agar sistem bisa menerima notifikasi real-time ketika ada email baru masuk.</p>
              <p className="mt-2"><strong>Expire:</strong> Watch akan expire setelah ~7 hari dan perlu di-renew.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSetupGmailWatch}
                disabled={settingUpGmailWatch}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {settingUpGmailWatch ? "Starting..." : "🔔 Activate Watch"}
              </Button>
              
              <Button
                onClick={handleStopGmailWatch}
                disabled={stoppingGmailWatch}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                {stoppingGmailWatch ? "Stopping..." : "⛔ Stop Watch"}
              </Button>
            </div>

            <Button
              onClick={handleDebugWebhook}
              disabled={debuggingWebhook}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {debuggingWebhook ? "Debugging..." : "🔍 Debug Webhook"}
            </Button>

            <div className="space-y-2">
              <Label className="text-slate-300">Setup Result</Label>
              <Textarea
                value={gmailWatchResponse}
                readOnly
                className="bg-slate-800 border-slate-700 text-blue-400 font-mono text-xs h-48 resize-none"
                placeholder="Setup result akan muncul di sini..."
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Requirements:</strong>
              <ul className="mt-2 space-y-1 text-slate-400">
                <li>• Set 3 Gmail secrets (GmailClientId, GmailClientSecret, GmailRefreshToken)</li>
                <li>• Setup Pub/Sub di Google Cloud Console (ikuti panduan di atas)</li>
                <li>• Klik button ini SETELAH Pub/Sub topic & subscription sudah dibuat</li>
              </ul>
            </div>
            
            <div className="text-xs text-yellow-600 bg-yellow-900/20 p-3 rounded-lg border border-yellow-700">
              <strong className="text-yellow-500">⚠️ Important:</strong>
              <ul className="mt-2 space-y-1 text-slate-400">
                <li>• Watch akan expire setelah ~7 hari</li>
                <li>• Perlu klik "Activate Gmail Watch" lagi untuk renew</li>
                <li>• Webhook URL: <code className="text-yellow-400">https://gaming-top-up-platform-d3pg4ec82vjikj791feg.api.lp.dev/gmail/webhook</code></li>
              </ul>
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
      </div>
    </div>
  );
}
