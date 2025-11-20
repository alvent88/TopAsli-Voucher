import { Link } from "react-router-dom";
import { Building2, ShoppingBag, Award, Mail, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompanyProfilePage() {
  const brands = [
    {
      name: "Komo",
      logo: "/brands/komo.png",
      color: "from-red-500 to-red-600"
    },
    {
      name: "Topten",
      logo: "/brands/topten.png",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "Amex",
      logo: "/brands/amex.png",
      color: "from-green-500 to-green-600"
    },
    {
      name: "Myjo",
      logo: "/brands/myjo.png",
      color: "from-purple-500 to-purple-600"
    },
    {
      name: "Kachi-kachi",
      logo: "/brands/kachi-kachi.png",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="CV Top Asli" className="w-12 h-12 rounded-full" />
              <span className="text-2xl font-bold text-primary">CV Top Asli</span>
            </Link>

            <Link to="/voucher">
              <Button className="bg-primary hover:bg-blue-600 text-white">Klaim Voucher</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative w-full overflow-hidden bg-gray-900">
        <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
          <img 
            src="/hero-banner.png" 
            alt="Snacking Made Right - CV Top Asli" 
            className="w-full h-full object-contain md:object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>
      </section>

      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tentang CV Top Asli</h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
              <p className="text-lg text-gray-600 leading-relaxed">
                CV Top Asli adalah perusahaan manufaktur snack terkemuka di Indonesia yang telah dipercaya selama bertahun-tahun. 
                Kami berkomitmen untuk menghadirkan produk berkualitas tinggi dengan berbagai merek yang disukai konsumen di seluruh Indonesia.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <Card className="text-center border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Perusahaan Terpercaya</h3>
                  <p className="text-gray-600">
                    Pengalaman puluhan tahun dalam industri snack Indonesia
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <ShoppingBag className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Produsen Berpengalaman</h3>
                  <p className="text-gray-600">
                    Memproduksi berbagai jenis snack berkualitas tinggi
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Kualitas Terjamin</h3>
                  <p className="text-gray-600">
                    Standar produksi yang ketat untuk kepuasan konsumen
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="brands" className="py-16 md:py-24 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Brand Kami</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-8 md:gap-12 lg:gap-16 flex-wrap px-4">
              {brands.map((brand, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-center w-32 h-32 md:w-40 md:h-40 p-4 bg-white hover:bg-gray-50 rounded-lg transition-all duration-300 group"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={brand.logo} 
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div 
                      className={`hidden w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br ${brand.color} items-center justify-center`}
                    >
                      <span className="text-white font-bold text-lg md:text-xl text-center px-2">
                        {brand.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </section>

      <section id="values" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nilai-Nilai Kami</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Kualitas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kami berkomitmen menggunakan bahan baku terbaik dan proses produksi yang ketat untuk menghasilkan produk berkualitas tinggi yang aman dikonsumsi.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Inovasi</h3>
                <p className="text-gray-600 leading-relaxed">
                  Terus berinovasi dalam menciptakan varian rasa baru yang sesuai dengan selera konsumen Indonesia dan mengikuti tren pasar.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Integritas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Menjalankan bisnis dengan transparan dan bertanggung jawab kepada konsumen, mitra, dan seluruh stakeholder.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Kepuasan Pelanggan</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mengutamakan kepuasan pelanggan dengan memberikan produk berkualitas dan layanan terbaik dalam setiap interaksi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="CV Top Asli" className="w-12 h-12 rounded-full" />
                <span className="text-xl font-bold text-gray-900">CV Top Asli</span>
              </div>
              <p className="text-gray-600 mb-4">
                Perusahaan manufaktur snack terkemuka dengan berbagai brand berkualitas yang dipercaya konsumen Indonesia.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Indonesia</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Menu</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/voucher" className="text-gray-600 hover:text-primary transition-colors">
                    Redeem Voucher
                  </Link>
                </li>
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
