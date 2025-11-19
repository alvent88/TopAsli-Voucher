import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import type { Product } from "~backend/product/list";
import { Gamepad2, Search, Shield, Zap, Mail, MessageCircle, ChevronDown, Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/AuthButton";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);
  const [showAllVouchers, setShowAllVouchers] = useState(false);
  const [showAllPPOB, setShowAllPPOB] = useState(false);

  useEffect(() => {
    loadProducts();
    loadFeaturedProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { products } = await backend.product.list({});
      setProducts(products);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const { products } = await backend.product.listFeatured();
      setFeaturedProducts(products);
    } catch (error) {
      console.error("Failed to load featured products:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const gameProducts = filteredProducts.filter(p => 
    !p.category?.toLowerCase().includes('voucher') && 
    !p.category?.toLowerCase().includes('ppob')
  );
  const voucherProducts = filteredProducts.filter(p => 
    p.category?.toLowerCase().includes('voucher') && 
    !p.category?.toLowerCase().includes('ppob')
  );
  const ppobProducts = filteredProducts.filter(p => 
    p.category?.toLowerCase().includes('ppob')
  );

  const ITEMS_PER_ROW = 6;
  const INITIAL_ROWS = 3;
  const initialGameCount = ITEMS_PER_ROW * INITIAL_ROWS;
  const initialVoucherCount = ITEMS_PER_ROW * INITIAL_ROWS;
  const initialPPOBCount = ITEMS_PER_ROW * INITIAL_ROWS;

  const displayedGameProducts = showAllGames ? gameProducts : gameProducts.slice(0, initialGameCount);
  const displayedVoucherProducts = showAllVouchers ? voucherProducts : voucherProducts.slice(0, initialVoucherCount);
  const displayedPPOBProducts = showAllPPOB ? ppobProducts : ppobProducts.slice(0, initialPPOBCount);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="CV Top Asli" className="w-12 h-12 rounded-full" />
              <span className="text-2xl font-bold text-primary">CV Top Asli</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors">Home</Link>
             
             
              <Link to="/how-to-redeem" className="text-gray-700 hover:text-primary transition-colors">Cara Redeem</Link>
              <Link to="/contact" className="text-gray-700 hover:text-primary transition-colors">Kontak</Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden h-[50vh] md:h-[100vh]">
        <img
          src="/hero-banner-gaming.png"
          alt="Gaming Banner"
          className="w-full h-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col gap-4">
              <Link to="/redeem-voucher">
                <Button className="bg-primary hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto cursor-pointer hover:cursor-pointer">
                  <Ticket className="h-6 w-6" />
                  Redeem Voucher Sekarang
                </Button>
              </Link>
              <Link to="/how-to-redeem">
                <Button variant="outline" className="bg-white/90 hover:bg-white border-primary text-primary px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto cursor-pointer hover:cursor-pointer">
                  Cara Redeem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">

        {featuredProducts.length > 0 && (
          <div className="mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              ⭐ Produk Unggulan
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`}>
                  <Card className="group relative bg-white border-gray-200 hover:border-primary transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg">
                    <CardContent className="p-2 md:p-3">
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
                        {product.iconUrl ? (
                          <img
                            src={product.iconUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                          ⭐
                        </div>
                      </div>
                      <h3 className="text-gray-900 font-semibold text-xs md:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari game favorit kamu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 h-14 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="bg-white border-gray-200 animate-pulse">
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Tidak ada produk ditemukan</p>
            <p className="text-gray-500 text-sm mt-2">Coba kata kunci lain</p>
          </div>
        ) : (
          <>
            {gameProducts.length > 0 && (
              <div className="mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                  <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  <span className="text-primary">
                    Game
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {displayedGameProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="group relative bg-white border-gray-200 hover:border-primary transition-all duration-300 cursor-pointer h-full overflow-hidden hover:shadow-lg">
                        <CardContent className="p-0 relative z-10">
                          <div className="relative aspect-square overflow-hidden">
                            {product.iconUrl ? (
                              <img
                                src={product.iconUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <Gamepad2 className="h-12 w-12 text-primary" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300" />
                          </div>
                          <div className="p-2 md:p-3 bg-white">
                            <h3 className="font-semibold text-gray-900 text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                {gameProducts.length > initialGameCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setShowAllGames(!showAllGames)}
                      className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                      {showAllGames ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lainnya'}
                      <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showAllGames ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {ppobProducts.length > 0 && (
              <div className="mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                  <svg className="h-6 w-6 md:h-8 md:w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-primary">
                    PPOB
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {displayedPPOBProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="group relative bg-white border-gray-200 hover:border-primary transition-all duration-300 cursor-pointer h-full overflow-hidden hover:shadow-lg">
                        <CardContent className="p-0 relative z-10">
                          <div className="relative aspect-square overflow-hidden">
                            {product.iconUrl ? (
                              <img
                                src={product.iconUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300" />
                          </div>
                          <div className="p-2 md:p-3 bg-white">
                            <h3 className="font-semibold text-gray-900 text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                {ppobProducts.length > initialPPOBCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setShowAllPPOB(!showAllPPOB)}
                      className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                      {showAllPPOB ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lainnya'}
                      <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showAllPPOB ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {voucherProducts.length > 0 && (
              <div className="mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                  <svg className="h-6 w-6 md:h-8 md:w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="text-primary">
                    Voucher
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {displayedVoucherProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="group relative bg-white border-gray-200 hover:border-primary transition-all duration-300 cursor-pointer h-full overflow-hidden hover:shadow-lg">
                        <CardContent className="p-0 relative z-10">
                          <div className="relative aspect-square overflow-hidden">
                            {product.iconUrl ? (
                              <img
                                src={product.iconUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300" />
                          </div>
                          <div className="p-2 md:p-3 bg-white">
                            <h3 className="font-semibold text-gray-900 text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                {voucherProducts.length > initialVoucherCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setShowAllVouchers(!showAllVouchers)}
                      className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                      {showAllVouchers ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lainnya'}
                      <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showAllVouchers ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-12 md:mt-20 grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-md">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2 text-base md:text-lg">Proses Instan</h3>
            <p className="text-gray-600 text-xs md:text-sm">
              Transaksi otomatis dalam hitungan detik
            </p>
          </div>
          <div className="text-center p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-md">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2 text-base md:text-lg">Aman & Terpercaya</h3>
            <p className="text-gray-600 text-xs md:text-sm">
              Keamanan berlapis & data terenkripsi
            </p>
          </div>
          <div className="text-center p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-md">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2 text-base md:text-lg">24/7 Support</h3>
            <p className="text-gray-600 text-xs md:text-sm">
              Customer service siap membantu kapan saja
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12 md:mt-20">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="CV Top Asli" className="w-12 h-12 rounded-full" />
                <span className="text-xl font-bold text-gray-900">CV Top Asli</span>
              </div>
              <p className="text-gray-600 text-sm">
                Platform redeem voucher snack CV Top Asli dengan proses cepat dan aman.
              </p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/redeem-voucher" className="text-gray-600 hover:text-primary transition-colors">Redeem Voucher</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Kontak Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-gray-600 hover:text-primary transition-colors">Beranda</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-primary transition-colors">Kebijakan Privasi</a></li>
                <li><a href="/terms" className="text-gray-600 hover:text-primary transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a href="mailto:cvtopasli@gmail.com" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a href="https://api.whatsapp.com/send/?phone=6281328528689&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  +62 813-2852-8689
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 CV Top Asli. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
