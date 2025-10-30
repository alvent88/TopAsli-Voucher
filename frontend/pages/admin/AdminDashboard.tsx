import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import { TrendingUp, Clock, CheckCircle, DollarSign, RefreshCw, MessageSquare, ShoppingBag, TestTube2 } from "lucide-react";
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
    pincode: "",
  });
  
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [testingVoucher, setTestingVoucher] = useState(false);
  const [syncingPackages, setSyncingPackages] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [validatingUsername, setValidatingUsername] = useState(false);
  const [validationGame, setValidationGame] = useState("mobile-legends");
  const [validationUserId, setValidationUserId] = useState("");
  const [validationServerId, setValidationServerId] = useState("");
  const [validationResult, setValidationResult] = useState("");
  
  // UniPlay API Response states
  const [uniplayApiResponse, setUniplayApiResponse] = useState("");
  const [uniplayCurlCommand, setUniplayCurlCommand] = useState("");
  
  // Test UniPlay Transaction states
  const [testingTransaction, setTestingTransaction] = useState(false);
  const [testCurlCommand, setTestCurlCommand] = useState("");
  const [testResponseJson, setTestResponseJson] = useState("");
  
  // Test Isan API states
  const [testingIsanAPI, setTestingIsanAPI] = useState(false);
  const [isanGame, setIsanGame] = useState("ml");
  const [isanUserId, setIsanUserId] = useState("1114917746");
  const [isanServerId, setIsanServerId] = useState("13486");
  const [isanApiResponse, setIsanApiResponse] = useState("");
  
  // Test Gmail states
  const [testingGmail, setTestingGmail] = useState(false);
  const [gmailResponse, setGmailResponse] = useState("");

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
  
  const handleTestVoucher = async () => {
    setTestingVoucher(true);
    setUniplayApiResponse("");
    setUniplayCurlCommand("");
    try {
      const result = await backend.uniplay.testVoucher();
      console.log("=== Test Voucher Full Result ===");
      console.log("Success:", result.success);
      console.log("Voucher Count:", result.voucherCount);
      console.log("Products Synced:", result.productsSynced);
      console.log("Packages Created:", result.packagesCreated);
      console.log("First Voucher:", result.firstVoucher);
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
          title: "✅ Test Voucher Berhasil!",
          description: `Vouchers: ${result.voucherCount} | Products: ${result.productsSynced} | Packages: ${result.packagesCreated}`,
        });
      } else {
        toast({
          title: "❌ Test Voucher Gagal",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test Voucher error:", error);
      setUniplayApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      toast({
        title: "Error",
        description: error.message || "Gagal test voucher",
        variant: "destructive",
      });
    } finally {
      setTestingVoucher(false);
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

  const handleTestTransaction = async () => {
    setTestingTransaction(true);
    setTestCurlCommand("");
    setTestResponseJson("");

    try {
      toast({
        title: "🧪 Testing Roblox Voucher",
        description: "Mengirim inquiry untuk Roblox Gift Card IDR 50K...",
      });

      const result = await backend.uniplay.testVoucherInquiry();

      setTestCurlCommand(result.curlCommand || "");
      
      // Remove curlCommand from response before displaying
      const { curlCommand, ...responseWithoutCurl } = result;
      setTestResponseJson(JSON.stringify(responseWithoutCurl, null, 2));

      if (result.status === "200") {
        toast({
          title: "✅ Test Berhasil!",
          description: `Inquiry ID: ${result.inquiry_id}`,
        });
      } else {
        toast({
          title: "❌ Test Gagal",
          description: result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test transaction error:", error);
      setTestResponseJson(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal test transaction",
        variant: "destructive",
      });
    } finally {
      setTestingTransaction(false);
    }
  };

  const handleTestIsanAPI = async () => {
    setTestingIsanAPI(true);
    setIsanApiResponse("");

    try {
      const result = await backend.validation.testIsanAPI({
        game: isanGame,
        userId: isanUserId,
        serverId: isanServerId || undefined,
      });

      setIsanApiResponse(JSON.stringify(result, null, 2));

      if (result.success && result.parsedData?.success) {
        toast({
          title: "✅ Isan API Test Berhasil!",
          description: `Username: ${result.parsedData.name || "N/A"}`,
        });
      } else if (result.success && result.parsedData) {
        toast({
          title: "⚠️ User ID Invalid",
          description: result.parsedData.message || "User tidak ditemukan",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Test Gagal",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test Isan API error:", error);
      setIsanApiResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal test Isan API",
        variant: "destructive",
      });
    } finally {
      setTestingIsanAPI(false);
    }
  };
  
  const handleTestGmail = async () => {
    setTestingGmail(true);
    setGmailResponse("");
    
    try {
      toast({
        title: "🔍 Testing Gmail Connection",
        description: "Fetching emails from UniPlay...",
      });
      
      const result = await backend.email.testImap();
      
      setGmailResponse(JSON.stringify(result, null, 2));
      
      if (result.success) {
        toast({
          title: "✅ Gmail Test Berhasil!",
          description: `Found ${result.messageCount} emails from UniPlay`,
        });
      } else {
        toast({
          title: "❌ Gmail Test Gagal",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Test Gmail error:", error);
      setGmailResponse(JSON.stringify({
        error: error.message || "Unknown error",
        details: error.toString(),
      }, null, 2));
      
      toast({
        title: "Error",
        description: error.message || "Gagal test Gmail",
        variant: "destructive",
      });
    } finally {
      setTestingGmail(false);
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

  const handleValidateUsername = async () => {
    if (!validationUserId) {
      toast({
        title: "Error",
        description: "Masukkan User ID terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setValidatingUsername(true);
    setValidationResult("");
    try {
      const result = await backend.uniplay.validateUsername({
        game: validationGame,
        userId: validationUserId,
        serverId: validationServerId || undefined,
      });
      
      setValidationResult(JSON.stringify(result, null, 2));
      
      if (result.success && result.name) {
        toast({
          title: "Validasi Berhasil! ✅",
          description: `Username: ${result.name}`,
        });
      } else {
        toast({
          title: "Validasi Gagal ❌",
          description: result.message || "Player tidak ditemukan",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      setValidationResult(JSON.stringify({ error: error.message }, null, 2));
      toast({
        title: "Error",
        description: error.message || "Gagal validasi username",
        variant: "destructive",
      });
    } finally {
      setValidatingUsername(false);
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
                    onClick={handleTestVoucher}
                    disabled={testingVoucher}
                    variant="outline"
                    className="border-purple-700 text-purple-400 hover:bg-purple-900/20 text-xs"
                  >
                    {testingVoucher ? "..." : "🎫 Voucher"}
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

        {/* Test UniPlay Transaction */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TestTube2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Test Roblox Voucher</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Test inquiry Roblox Gift Card IDR 50K</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleTestTransaction}
              disabled={testingTransaction}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {testingTransaction ? "Testing..." : "🧪 Test Inquiry Voucher"}
            </Button>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Request cURL</Label>
                <Textarea
                  value={testCurlCommand}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-green-400 font-mono text-xs h-40 resize-none"
                  placeholder="cURL command akan muncul di sini..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Response JSON</Label>
                <Textarea
                  value={testResponseJson}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-blue-400 font-mono text-xs h-64 resize-none"
                  placeholder="Response JSON akan muncul di sini..."
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Info:</strong> Test akan mencari produk Roblox dan paket 50K dari database, lalu inquiry tanpa user_id/server_id (khusus voucher)
            </div>
          </CardContent>
        </Card>

        {/* Test Isan Username Validation API */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TestTube2 className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-white">Test Isan Validation API</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Test username validation dengan api.isan.eu.org</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="isan-game" className="text-slate-300">Game</Label>
              <Select value={isanGame} onValueChange={setIsanGame}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="ml" className="text-white hover:bg-slate-800">Mobile Legends (ml)</SelectItem>
                  <SelectItem value="ff" className="text-white hover:bg-slate-800">Free Fire (ff)</SelectItem>
                  <SelectItem value="pubgm" className="text-white hover:bg-slate-800">PUBG Mobile (pubgm)</SelectItem>
                  <SelectItem value="codm" className="text-white hover:bg-slate-800">Call of Duty Mobile (codm)</SelectItem>
                  <SelectItem value="aov" className="text-white hover:bg-slate-800">Arena of Valor (aov)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="isan-user-id" className="text-slate-300">User ID</Label>
                <Input
                  id="isan-user-id"
                  value={isanUserId}
                  onChange={(e) => setIsanUserId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="1114917746"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isan-server-id" className="text-slate-300">Server ID (optional)</Label>
                <Input
                  id="isan-server-id"
                  value={isanServerId}
                  onChange={(e) => setIsanServerId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="13486"
                />
              </div>
            </div>

            <Button
              onClick={handleTestIsanAPI}
              disabled={testingIsanAPI}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {testingIsanAPI ? "Testing..." : "🔍 Test Username Validation"}
            </Button>

            <div className="space-y-2">
              <Label className="text-slate-300">API Response</Label>
              <Textarea
                value={isanApiResponse}
                readOnly
                className="bg-slate-800 border-slate-700 text-orange-400 font-mono text-xs h-96 resize-none"
                placeholder="Response dari Isan API akan muncul di sini..."
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Info:</strong> Test akan memanggil api.isan.eu.org untuk validasi username game
            </div>
          </CardContent>
        </Card>

        {/* Test Gmail/Email */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <MessageSquare className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-white">Test Gmail Connection</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Test baca email dari UniPlay</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleTestGmail}
              disabled={testingGmail}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              {testingGmail ? "Testing..." : "📧 Test Read Emails"}
            </Button>

            <div className="space-y-2">
              <Label className="text-slate-300">Email Response</Label>
              <Textarea
                value={gmailResponse}
                readOnly
                className="bg-slate-800 border-slate-700 text-red-400 font-mono text-xs h-96 resize-none"
                placeholder="Email data akan muncul di sini..."
              />
            </div>

            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">💡 Info:</strong> Test akan fetch email terbaru dari UniPlay menggunakan Gmail Atom Feed. Pastikan GmailAddress dan GmailAppPassword sudah di-set di Settings.
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

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TestTube2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Test Username Validation</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Validasi username game menggunakan API isan.eu.org</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validation-game" className="text-slate-300">Game</Label>
              <Select value={validationGame} onValueChange={setValidationGame}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="mobile-legends">Mobile Legends</SelectItem>
                  <SelectItem value="free-fire">Free Fire</SelectItem>
                  <SelectItem value="genshin-impact">Genshin Impact</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="call-of-duty-mobile">Call of Duty Mobile</SelectItem>
                  <SelectItem value="arena-of-valor">Arena of Valor</SelectItem>
                  <SelectItem value="honkai-star-rail">Honkai: Star Rail</SelectItem>
                  <SelectItem value="zenless-zone-zero">Zenless Zone Zero</SelectItem>
                  <SelectItem value="point-blank">Point Blank</SelectItem>
                  <SelectItem value="lifeafter">LifeAfter</SelectItem>
                  <SelectItem value="punishing-gray-raven">Punishing: Gray Raven</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validation-user-id" className="text-slate-300">User ID *</Label>
              <Input
                id="validation-user-id"
                value={validationUserId}
                onChange={(e) => setValidationUserId(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white font-mono"
                placeholder="Contoh: 235791720"
              />
            </div>
            {(validationGame === "mobile-legends" || validationGame === "lifeafter" || validationGame === "punishing-gray-raven") && (
              <div className="space-y-2">
                <Label htmlFor="validation-server-id" className="text-slate-300">
                  {validationGame === "mobile-legends" ? "Zone ID" : validationGame === "lifeafter" ? "Server Name" : "Server (AP/EU/NA)"}
                  {validationGame === "mobile-legends" && " *"}
                </Label>
                <Input
                  id="validation-server-id"
                  value={validationServerId}
                  onChange={(e) => setValidationServerId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder={validationGame === "mobile-legends" ? "Contoh: 9227" : validationGame === "lifeafter" ? "Contoh: milestone" : "Contoh: AP"}
                />
              </div>
            )}
            {canEdit && (
              <Button
                onClick={handleValidateUsername}
                disabled={validatingUsername}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {validatingUsername ? "Validating..." : "🔍 Validate Username"}
              </Button>
            )}
            {validationResult && (
              <div className="space-y-2">
                <Label className="text-slate-300">Validation Result:</Label>
                <Textarea
                  value={validationResult}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-green-400 font-mono text-xs min-h-[200px]"
                />
              </div>
            )}
            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <strong className="text-slate-400">ℹ️ Info:</strong>
              <div className="text-slate-300 mt-2 space-y-1">
                <div>• API dari <a href="https://github.com/ihsangan/valid" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">github.com/ihsangan/valid</a></div>
                <div>• Gratis dan tidak perlu API key</div>
                <div>• Mendukung berbagai game populer</div>
                <div>• Response format: {JSON.stringify({success: true, name: "Username"})}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
