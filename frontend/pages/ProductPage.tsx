import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useBackend } from "@/lib/useBackend";
import type { Product } from "~backend/product/list";
import type { Package } from "~backend/pkg/list";
import { ArrowLeft, Gamepad2, Flame } from "lucide-react";
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
  const [validatedUsername, setValidatedUsername] = useState<string>("");
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [gameSupported, setGameSupported] = useState<boolean>(true);
  const [uniplayUsername, setUniplayUsername] = useState<string>("");
  const [uniplayValidating, setUniplayValidating] = useState(false);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  const validateUsername = async () => {
    if (!userId || !product) {
      setValidatedUsername("");
      setValidationError("");
      setGameSupported(true);
      return;
    }

    if (product.requiresServerId && !gameId) {
      setValidatedUsername("");
      setValidationError("");
      setGameSupported(true);
      return;
    }

    setValidating(true);
    setValidationError("");
    
    try {
      const response = await authBackend.uniplay.validateUsernameByProduct({
        productId: product.id,
        userId,
        serverId: gameId || undefined,
      });

      setGameSupported(response.gameSupported);

      if (response.success && response.username) {
        setValidatedUsername(response.username);
        setValidationError("");
      } else {
        setValidatedUsername("");
        if (response.gameSupported) {
          setValidationError(response.message || "Username tidak valid");
        } else {
          setValidationError("");
        }
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      setValidatedUsername("");
      setValidationError(error.message || "Gagal memvalidasi username");
      setGameSupported(true);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      validateUsername();
    }, 800);

    return () => clearTimeout(timer);
  }, [userId, gameId, product]);

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

    // Prioritas username: UniPlay > API gratis > kosong
    const finalUsername = uniplayUsername || validatedUsername;
    if (finalUsername) {
      params.append("username", finalUsername);
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
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Masukkan User ID"
                    className="bg-white/10 border-white/20 text-white"
                  />
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
                {validatedUsername && (
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Username: {validatedUsername}</span>
                    </div>
                  </div>
                )}
                {validationError && gameSupported && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="font-medium">{validationError}</span>
                    </div>
                  </div>
                )}
                {validating && (
                  <div className="text-blue-400 text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Memvalidasi...
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
                    loading || 
                    validating ||
                    (gameSupported && !validatedUsername)
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {validating ? "Memvalidasi..." : loading ? "Memproses..." : "Beli Sekarang"}
                </Button>
                {gameSupported && !validatedUsername && !validationError && userId && selectedPackage && (product?.requiresServerId === false || gameId) && !validating && (
                  <div className="text-yellow-400 text-xs text-center mt-2">
                    ⚠️ Menunggu validasi username...
                  </div>
                )}
                {validationError && gameSupported && (
                  <div className="text-red-400 text-xs text-center mt-2">
                    ❌ {validationError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
