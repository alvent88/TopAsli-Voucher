import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import backend from "~backend/client";
import type { Product } from "~backend/product/list";
import { Gamepad2, Search, Shield, Zap, Mail, MessageCircle } from "lucide-react";
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

  // Separate products by category
  const gameProducts = filteredProducts.filter(p => p.category?.toLowerCase() !== 'voucher');
  const voucherProducts = filteredProducts.filter(p => p.category?.toLowerCase() === 'voucher');

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <nav className="border-b border-slate-800 bg-[#0f1229] sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">TopAsli</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">Games</Link>
              <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">Kontak</Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 py-16 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-4 text-5xl md:text-6xl font-bold text-white">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">TopAsli Redeem System</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Tukarkan voucher snack Anda dengan mudah. Proses instan, aman & terpercaya!
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {featuredProducts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              ⭐ Produk Unggulan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`}>
                  <Card className="group relative bg-[#1a1f3a] border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                    <CardContent className="p-3">
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
                        {product.iconUrl ? (
                          <img
                            src={product.iconUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-yellow-600/20 to-orange-600/20 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8 text-yellow-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          ⭐
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-yellow-300 transition-colors">
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
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari game favorit kamu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 h-14 bg-[#1a1f3a] border-slate-700 text-white placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="bg-[#1a1f3a] border-slate-700 animate-pulse">
                <CardContent className="p-3">
                  <div className="aspect-square bg-slate-700 rounded-lg mb-3" />
                  <div className="h-4 bg-slate-700 rounded mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Tidak ada produk ditemukan</p>
            <p className="text-slate-500 text-sm mt-2">Coba kata kunci lain</p>
          </div>
        ) : (
          <>
            {/* Game Products Section */}
            {gameProducts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Gamepad2 className="h-8 w-8 text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Game
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {gameProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="group relative bg-[#1a1f3a] border-slate-700 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer h-full overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[2px] before:bg-gradient-to-br before:from-yellow-400/0 before:via-yellow-500/0 before:to-yellow-400/0 hover:before:from-yellow-400/60 hover:before:via-yellow-500/60 hover:before:to-yellow-400/60 before:transition-all before:duration-300 before:-z-10 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                        <CardContent className="p-0 relative z-10">
                          <div className="relative aspect-square overflow-hidden">
                            {product.iconUrl ? (
                              <img
                                src={product.iconUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                                <Gamepad2 className="h-12 w-12 text-blue-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-transparent to-yellow-400/0 group-hover:from-yellow-400/20 group-hover:to-yellow-400/10 transition-all duration-300" />
                          </div>
                          <div className="p-3 bg-[#1a1f3a]">
                            <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-yellow-400 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{product.category}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Voucher Products Section */}
            {voucherProducts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Voucher
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {voucherProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.slug}`}>
                      <Card className="group relative bg-[#1a1f3a] border-slate-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[2px] before:bg-gradient-to-br before:from-purple-400/0 before:via-pink-500/0 before:to-purple-400/0 hover:before:from-purple-400/60 hover:before:via-pink-500/60 hover:before:to-purple-400/60 before:transition-all before:duration-300 before:-z-10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        <CardContent className="p-0 relative z-10">
                          <div className="relative aspect-square overflow-hidden">
                            {product.iconUrl ? (
                              <img
                                src={product.iconUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                                <svg className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-transparent to-pink-400/0 group-hover:from-purple-400/20 group-hover:to-pink-400/10 transition-all duration-300" />
                          </div>
                          <div className="p-3 bg-[#1a1f3a]">
                            <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-purple-400 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{product.category}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg shadow-blue-500/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2 text-lg">Proses Instan</h3>
            <p className="text-slate-400 text-sm">
              Transaksi otomatis dalam hitungan detik
            </p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/30">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2 text-lg">Aman & Terpercaya</h3>
            <p className="text-slate-400 text-sm">
              Keamanan berlapis & data terenkripsi
            </p>
          </div>
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-lg shadow-green-500/30">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2 text-lg">24/7 Support</h3>
            <p className="text-slate-400 text-sm">
              Customer service siap membantu kapan saja
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-[#0f1229] border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TopAsli</span>
              </div>
              <p className="text-slate-400 text-sm">
                Platform redeem voucher snack CV Top Asli dengan proses cepat dan aman.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/redeem-voucher" className="text-slate-400 hover:text-white transition-colors">Redeem Voucher</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Kontak Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Informasi</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-slate-400 hover:text-white transition-colors">Beranda</a></li>
                <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="/terms" className="text-slate-400 hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a href="mailto:cvtopasli@gmail.com" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  +62 822-2505-8000
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 CV Top Asli. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
