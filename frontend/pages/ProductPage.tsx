import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useBackend } from "@/lib/useBackend";
import type { Product } from "~backend/product/list";
import type { Package } from "~backend/pkg/list";
import { ArrowLeft, Gamepad2, Flame, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const authBackend = useBackend();
  const [product, setProduct] = useState<Product | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [gameId, setGameId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [validatedUsername, setValidatedUsername] = useState<string>("");
  const [validationMessage, setValidationMessage] = useState<string>("");

  useEffect(() => {
    if (product?.name?.toLowerCase().includes("genshin") && userId.length > 0 && /^\d+$/.test(userId)) {
      const firstDigit = userId[0];
      const serverMap: Record<string, string> = {
        "6": "America",
        "7": "Europe",
        "8": "Asia",
        "9": "TW, HK, MO",
      };
      
      if (serverMap[firstDigit]) {
        setGameId(serverMap[firstDigit]);
        console.log("Auto-detected server:", serverMap[firstDigit]);
      }
    }
  }, [userId, product]);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  // Validate username when userId and serverId (if required) are filled
  useEffect(() => {
    // Skip validation for voucher category
    if (product?.category?.toLowerCase() === 'voucher') {
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
      return;
    }

    // Only validate these specific games
    const allowedValidationGames = [
      "mobile legends",
      "magic chess",
      "free fire",
      "genshin impact",
      "valorant"
    ];
    
    const shouldValidate = allowedValidationGames.some(game => 
      product?.name?.toLowerCase().includes(game)
    );
    
    if (!shouldValidate) {
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
      return;
    }

    if (!userId || !product) {
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
      return;
    }

    const requiresServerId = product.requiresServerId !== false;
    
    if (requiresServerId && !gameId) {
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
      return;
    }

    // Debounce validation
    const timer = setTimeout(() => {
      validateUsernameWithIsanAPI();
    }, 800);

    return () => clearTimeout(timer);
  }, [userId, gameId, product]);

  const validateUsernameWithIsanAPI = async () => {
    if (!userId || !product) return;

    const requiresServerId = product.requiresServerId !== false;
    if (requiresServerId && !gameId) return;

    setValidationStatus("validating");
    setValidatedUsername("");
    setValidationMessage("");

    try {
      const response = await authBackend.validation.validateUsername({
        productId: product.id,
        userId,
        serverId: gameId || undefined,
      });

      console.log("=== Validation Response ===");
      console.log("Full response:", JSON.stringify(response, null, 2));
      console.log("success:", response.success);
      console.log("valid:", response.valid);
      console.log("username:", response.username);
      console.log("message:", response.message);

      if (response.success && response.valid === true) {
        // Valid - either with username or format validation only
        setValidationStatus("valid");
        setValidatedUsername(response.username || "");
        setValidationMessage(response.message || "Valid");
        console.log("✅ Validation successful - Username:", response.username || "(format validation only)");
      } else {
        // Invalid
        setValidationStatus("invalid");
        setValidatedUsername("");
        setValidationMessage(response.message || "Username not found");
        console.log("❌ Validation failed");
      }
    } catch (error: any) {
      console.error("❌ Username validation error:", error);
      // Don't block purchase if validation fails
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
    }
  };

  const loadData = async () => {
    try {
      const productData = await backend.product.get({ slug: slug! });
      setProduct(productData);

      const packagesData = await backend.pkg.list({ productId: productData.id });
      setPackages(packagesData.packages);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!isSignedIn) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk melakukan transaksi",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const isVoucher = product?.category?.toLowerCase() === 'voucher';
    const requiresServerId = product?.requiresServerId !== false;
    
    // For voucher, only package is required
    if (isVoucher) {
      if (!selectedPackage) {
        toast({
          title: "Peringatan",
          description: "Silakan pilih voucher",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For non-voucher, userId is required
      if (!userId || !selectedPackage) {
        toast({
          title: "Peringatan",
          description: "Mohon lengkapi semua data",
          variant: "destructive",
        });
        return;
      }

      if (requiresServerId && !gameId) {
        toast({
          title: "Peringatan",
          description: "Mohon masukkan Server ID",
          variant: "destructive",
        });
        return;
      }
    }

    // Redirect to purchase inquiry page
    const params = new URLSearchParams({
      packageId: selectedPackage.toString(),
    });

    if (!isVoucher && userId) {
      params.append("userId", userId);
    }

    if (gameId) {
      params.append("serverId", gameId);
    }

    // Pass validated username if available
    if (validatedUsername) {
      params.append("username", validatedUsername);
    }

    navigate(`/purchase-inquiry?${params.toString()}`);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Produk tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:text-purple-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {product.iconUrl ? (
                    <img
                      src={product.iconUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="h-8 w-8 text-purple-400" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-white">{product.name}</CardTitle>
                    <p className="text-sm text-gray-400">{product.category}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product?.category?.toLowerCase() !== 'voucher' && (
                  <>
                    <div>
                      <Label htmlFor="userId" className="text-white">
                        User ID
                      </Label>
                      <div className="relative">
                        <Input
                          id="userId"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder={product?.name?.toLowerCase().includes("valorant") ? "Masukkan Riot ID (contoh: yuyun#123)" : "Masukkan User ID"}
                          className={`bg-white/10 text-white pr-10 ${
                            validationStatus === "invalid" ? "border-red-500" : validationStatus === "valid" ? "border-green-500" : "border-white/20"
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validationStatus === "validating" && (
                            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                          )}
                          {validationStatus === "valid" && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                          {validationStatus === "invalid" && (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </div>
                      {validationStatus === "valid" && (validatedUsername || validationMessage) && (
                        <div className="mt-2 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              {validatedUsername 
                                ? `✓ Username ditemukan: ${validatedUsername}` 
                                : `✓ ${validationMessage}`}
                            </span>
                          </div>
                        </div>
                      )}
                      {validationStatus === "invalid" && (
                        <div className="mt-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                          <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                            <XCircle className="h-4 w-4" />
                            <span>✗ {validationMessage}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {product?.requiresServerId !== false && (
                      <div>
                        <Label htmlFor="gameId" className="text-white">
                          {product?.name?.toLowerCase().includes("genshin") ? "Server" : "Server ID"}
                        </Label>
                        {product?.name?.toLowerCase().includes("genshin") ? (
                          <Select value={gameId} onValueChange={setGameId}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Pilih Server" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America">America</SelectItem>
                              <SelectItem value="Europe">Europe</SelectItem>
                              <SelectItem value="Asia">Asia</SelectItem>
                              <SelectItem value="TW, HK, MO">TW, HK, MO</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="gameId"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            placeholder="Masukkan Server ID"
                            className="bg-white/10 border-white/20 text-white"
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                {product?.category?.toLowerCase() === 'voucher' && (
                  <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                    <p className="text-purple-200 text-sm">
                      Voucher akan dikirimkan ke email Anda setelah pembayaran berhasil
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {packages.some((pkg) => pkg.isSpecialItem) && (
              <Card className="bg-white/5 border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-white">Special Item</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPackage?.toString()}
                    onValueChange={(value) => setSelectedPackage(parseInt(value))}
                  >
                    <div className="grid md:grid-cols-2 gap-3">
                      {packages
                        .filter((pkg) => pkg.isSpecialItem)
                        .map((pkg) => {
                          const hasDiscount = pkg.discountPrice && pkg.discountPrice < pkg.price;
                          const displayPrice = (hasDiscount ? pkg.discountPrice : pkg.price) ?? 0;
                          const discountPercent = hasDiscount 
                            ? Math.round(((pkg.price - pkg.discountPrice!) / pkg.price) * 100)
                            : 0;
                          
                          return (
                          <label
                            key={pkg.id}
                            className={`relative flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedPackage === pkg.id
                                ? "bg-yellow-500/20 border-yellow-400"
                                : "bg-white/5 border-yellow-500/30 hover:bg-yellow-500/10"
                            }`}
                          >
                            {hasDiscount && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                -{discountPercent}%
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={pkg.id.toString()} />
                              <div>
                                <div className="text-white font-medium">
                                  {pkg.name}
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasDiscount && (
                                    <div className="text-gray-500 text-xs line-through">
                                      {formatCurrency(pkg.price)}
                                    </div>
                                  )}
                                  <div className={hasDiscount ? "text-yellow-300 text-sm font-bold" : "text-yellow-300 text-sm"}>
                                    {formatCurrency(displayPrice)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </label>
                          );
                        })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Up {product.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPackage?.toString()}
                  onValueChange={(value) => setSelectedPackage(parseInt(value))}
                >
                  <div className="grid md:grid-cols-2 gap-3">
                    {packages
                      .filter((pkg) => !pkg.isSpecialItem)
                      .map((pkg) => {
                        const hasDiscount = pkg.discountPrice && pkg.discountPrice < pkg.price;
                        const displayPrice = (hasDiscount ? pkg.discountPrice : pkg.price) ?? 0;
                        const discountPercent = hasDiscount 
                          ? Math.round(((pkg.price - pkg.discountPrice!) / pkg.price) * 100)
                          : 0;
                        
                        return (
                        <label
                          key={pkg.id}
                          className={`relative flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedPackage === pkg.id
                              ? "bg-purple-500/20 border-purple-400"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {hasDiscount && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              -{discountPercent}%
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={pkg.id.toString()} />
                            <div>
                              <div className="text-white font-medium">
                                {pkg.name}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasDiscount && (
                                  <div className="text-gray-500 text-xs line-through">
                                    {formatCurrency(pkg.price)}
                                  </div>
                                )}
                                <div className={hasDiscount ? "text-purple-300 text-sm font-bold" : "text-purple-300 text-sm"}>
                                  {formatCurrency(displayPrice)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>
                        );
                      })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white/5 border-white/10 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Produk</span>
                    <span className="text-white">{product.name}</span>
                  </div>
                  {selectedPackage && (
                    <>
                      <div className="flex justify-between text-gray-400">
                        <span>Nominal</span>
                        <span className="text-white">
                          {packages.find((p) => p.id === selectedPackage)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Harga</span>
                        <span className="text-white">
                          {(() => {
                            const pkg = packages.find((p) => p.id === selectedPackage);
                            if (!pkg) return formatCurrency(0);
                            const finalPrice = pkg.discountPrice && pkg.discountPrice < pkg.price 
                              ? pkg.discountPrice 
                              : pkg.price;
                            return formatCurrency(finalPrice);
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={
                    !selectedPackage ||
                    (product?.category?.toLowerCase() !== 'voucher' && (
                      !userId || 
                      (product?.requiresServerId !== false && !gameId) || 
                      validationStatus === "invalid" ||
                      validationStatus === "validating"
                    )) ||
                    loading
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validationStatus === "validating" ? "Memvalidasi Username..." : 
                   validationStatus === "invalid" ? "Username Invalid" :
                   loading ? "Memproses..." : "Beli Sekarang"}
                </Button>
                {validationStatus === "invalid" && (
                  <p className="text-red-400 text-xs text-center">
                    Silakan periksa kembali User ID dan Server ID Anda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
