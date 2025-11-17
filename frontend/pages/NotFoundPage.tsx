import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F1B2B] flex items-center justify-center p-4">
      <Card className="bg-[#1a1f3a] border-slate-700 max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-white text-center text-4xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-slate-300 text-xl mb-2">Halaman Tidak Ditemukan</p>
            <p className="text-slate-400 text-sm">
              Halaman yang Anda cari tidak tersedia atau Anda tidak memiliki akses.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/")}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
