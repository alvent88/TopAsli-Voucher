import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShoppingBag, Award, Users, Mail, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompanyProfilePage() {
  const brands = [
    {
      name: "Komo",
      description: "Produk snack berkualitas dengan rasa autentik Indonesia",
      color: "from-red-500 to-red-600"
    },
    {
      name: "Topten",
      description: "Inovasi rasa yang selalu menjadi pilihan favorit",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "Amex",
      description: "Camilan premium dengan standar kualitas tertinggi",
      color: "from-green-500 to-green-600"
    },
    {
      name: "Myjo",
      description: "Cemilan modern untuk gaya hidup masa kini",
      color: "from-purple-500 to-purple-600"
    },
    {
      name: "Kachi-kachi",
      description: "Sensasi renyah yang tak terlupakan",
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
            <div className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-gray-700 hover:text-primary transition-colors">Tentang Kami</a>
              <a href="#brands" className="text-gray-700 hover:text-primary transition-colors">Brand</a>
              <a href="#values" className="text-gray-700 hover:text-primary transition-colors">Nilai Kami</a>
              <Link to="/voucher" className="text-gray-700 hover:text-primary transition-colors font-semibold">Redeem Voucher</Link>
            </div>
            <Link to="/voucher">
              <Button className="bg-primary hover:bg-blue-600 text-white">
                Redeem Voucher
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Snacking Made Right
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Menciptakan momen kebahagiaan melalui produk snack berkualitas tinggi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/voucher">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                  Redeem Voucher Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#about">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl font-semibold transition-all duration-300">
                  Pelajari Lebih Lanjut
                </Button>
              </a>
            </div>
          </div>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">5 Brand Ternama</h3>
                  <p className="text-gray-600">
                    Portofolio brand yang dikenal dan dicintai konsumen
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

      <section id="brands" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Brand Kami</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Koleksi brand premium yang menghadirkan berbagai pilihan snack untuk setiap momen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {brands.map((brand, index) => (
              <Card key={index} className="group overflow-hidden border-2 border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${brand.color} h-32 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300"></div>
                    <h3 className="text-3xl font-bold text-white relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {brand.name}
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-center">
                      {brand.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/voucher">
              <Button className="bg-primary hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto">
                Redeem Voucher Brand Favorit Anda
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
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

      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bergabunglah dengan Kami</h2>
            <p className="text-xl text-blue-100 mb-8">
              Nikmati berbagai penawaran dan promosi eksklusif dari brand-brand favorit Anda
            </p>
            <Link to="/voucher">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto">
                Mulai Redeem Voucher
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
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
              <h4 className="text-gray-900 font-semibold mb-4">Brand Kami</h4>
              <ul className="space-y-2 text-sm">
                {brands.map((brand, index) => (
                  <li key={index}>
                    <Link to="/voucher" className="text-gray-600 hover:text-primary transition-colors">
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Hubungi Kami</h4>
              <div className="space-y-3">
                <a href="mailto:cvtopasli@gmail.com" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <Mail className="h-4 w-4" />
                  cvtopasli@gmail.com
                </a>
                <a href="https://api.whatsapp.com/send/?phone=6282225058000&text=Halo%20kak,%20saya%20mau%20tanya&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  +62 822-2505-8000
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
