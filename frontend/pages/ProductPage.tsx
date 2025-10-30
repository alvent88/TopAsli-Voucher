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
  const [uniplayUsername, setUniplayUsername] = useState<string>("");
  const [uniplayValidating, setUniplayValidating] = useState(false);
  
  // Username validation state
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [validatedUsername, setValidatedUsername] = useState<string>("");
  const [validationMessage, setValidationMessage] = useState<string>("");

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  // Validate username when userId and serverId (if required) are filled
  useEffect(() => {
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

      console.log("Validation response:", response);

      if (response.success && response.valid && response.username) {
        setValidationStatus("valid");
        setValidatedUsername(response.username);
        setValidationMessage("");
      } else if (response.success && !response.valid) {
        setValidationStatus("invalid");
        setValidatedUsername("");
        setValidationMessage(response.message || "Username tidak ditemukan atau invalid");
      } else {
        // Validation service error or not available - allow purchase
        setValidationStatus("idle");
        setValidatedUsername("");
        setValidationMessage("");
      }
    } catch (error: any) {
      console.error("Username validation error:", error);
      // Don't block purchase if validation fails
      setValidationStatus("idle");
      setValidatedUsername("");
      setValidationMessage("");
    }
  };

  // Validate with UniPlay when package is selected
  useEffect(() => {
    if (selectedPackage && userId && product && (!product.requiresServerId || gameId)) {
      validateWithUniPlay();
    } else {
      setUniplayUsername("");
    }
  }, [selectedPackage, userId, gameId, product]);

  const validateWithUniPlay = async () => {
    if (!selectedPackage || !userId || !product) return;

    const requiresServerId = product.requiresServerId !== false;
    if (requiresServerId && !gameId) return;

    setUniplayValidating(true);
    
    try {
      const response = await authBackend.uniplay.inquiryPaymentEndpoint({
        packageId: selectedPackage,
        userId,
        serverId: gameId || undefined,
      });

      if (response.success && response.username) {
        setUniplayUsername(response.username);
      } else {
        setUniplayUsername("");
      }
    } catch (error: any) {
      console.error("UniPlay inquiry error:", error);
      setUniplayUsername("");
    } finally {
      setUniplayValidating(false);
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

    const requiresServerId = product?.requiresServerId !== false;
    
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

    // Redirect to purchase inquiry page
    const params = new URLSearchParams({
      packageId: selectedPackage.toString(),
      userId,
    });

    if (gameId) {
      params.append("serverId", gameId);
    }

    // Pass username dari UniPlay inquiry
    if (uniplayUsername) {
      params.append("username", uniplayUsername);
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
                <div>
                  <Label htmlFor="userId" className="text-white">
                    User ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="Masukkan User ID"
                      className={`bg-white/10 border-white/20 text-white pr-10 ${
                        validationStatus === "invalid" ? "border-red-500" : ""
                      } ${validationStatus === "valid" ? "border-green-500" : ""}`}
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
                  {validationStatus === "valid" && validatedUsername && (
                    <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Username: {validatedUsername}</span>
                    </div>
                  )}
                  {validationStatus === "invalid" && validationMessage && (
                    <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                      <XCircle className="h-4 w-4" />
                      <span>{validationMessage}</span>
                    </div>
                  )}
                </div>
                {product?.requiresServerId !== false && (
                  <div>
                    <Label htmlFor="gameId" className="text-white">
                      Server ID
                    </Label>
                    <Input
                      id="gameId"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                      placeholder="Masukkan Server ID"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}
                {uniplayUsername && selectedPackage && (
                  <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-300 text-xs font-semibold">KONFIRMASI UNIPLAY</span>
                    </div>
                    <div className="text-purple-100 font-medium">
                      Username: {uniplayUsername}
                    </div>
                    <div className="text-purple-400 text-xs mt-1">
                      ✓ Data telah diverifikasi dengan UniPlay
                    </div>
                  </div>
                )}
                {uniplayValidating && selectedPackage && (
                  <div className="text-purple-400 text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    Memverifikasi dengan UniPlay...
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
                    !userId || 
                    !selectedPackage || 
                    (product?.requiresServerId !== false && !gameId) || 
                    validationStatus === "invalid" ||
                    validationStatus === "validating" ||
                    loading || 
                    uniplayValidating
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validationStatus === "validating" ? "Memvalidasi Username..." : 
                   uniplayValidating ? "Memverifikasi..." : 
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
