import { useState } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import { Download, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUniPlaySync() {
  const backend = useBackend();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [syncing, setSyncing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    productsCreated: number;
    packagesCreated: number;
    message: string;
  } | null>(null);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await backend.uniplay.syncAllProducts();
      
      setSyncResult({
        productsCreated: result.productsCreated,
        packagesCreated: result.packagesCreated,
        message: result.message,
      });

      toast({
        title: "Sync Berhasil! ✅",
        description: result.message,
      });
    } catch (error: any) {
      console.error("Sync all products error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal sync produk dari UniPlay",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const result = await backend.admin.deleteAllProducts();
      
      if (result.success) {
        toast({
          title: "Berhasil Dihapus! 🗑️",
          description: `${result.deletedProducts} produk dan ${result.deletedPackages} paket telah dihapus`,
        });
        setSyncResult(null);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus produk",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">UniPlay Sync</h1>
        <p className="text-slate-400 mt-1">Sync produk dan paket otomatis dari UniPlay API</p>
      </div>

      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-400" />
            Sync All Products & Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-950/50 border border-blue-500/30 rounded-lg">
              <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Apa yang akan dilakukan?
              </h3>
              <ol className="text-sm text-slate-300 space-y-2 ml-6 list-decimal">
                <li>Menghapus semua produk dan paket yang ada di database</li>
                <li>Memanggil UniPlay API untuk mendapatkan list semua game DTU</li>
                <li>Membuat produk baru untuk setiap game yang ditemukan</li>
                <li>Membuat paket untuk setiap denominasi dengan UniPlay IDs otomatis terisi</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-950/50 border border-yellow-500/30 rounded-lg">
              <h3 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Peringatan
              </h3>
              <p className="text-sm text-slate-300">
                Proses ini akan <strong className="text-yellow-400">MENGHAPUS SEMUA DATA PRODUK DAN PAKET</strong> yang sudah ada. 
                Pastikan Anda sudah backup data jika diperlukan. Transaksi yang sudah ada tidak akan terpengaruh.
              </p>
            </div>

            {syncResult && (
              <div className="p-4 bg-green-950/50 border border-green-500/30 rounded-lg">
                <h3 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Hasil Sync Terakhir
                </h3>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>✅ Produk dibuat: <strong className="text-white">{syncResult.productsCreated}</strong></p>
                  <p>✅ Paket dibuat: <strong className="text-white">{syncResult.packagesCreated}</strong></p>
                  <p className="text-xs text-slate-400 mt-2">{syncResult.message}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {canEdit && (
              <>
                <Button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-base"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Sync All dari UniPlay
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={syncing}
                  variant="outline"
                  className="border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Semua
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700 space-y-1">
            <p><strong className="text-slate-400">💡 Tips:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Pastikan UniPlay API Key sudah dikonfigurasi di Admin Dashboard</li>
              <li>Proses sync biasanya memakan waktu 10-30 detik tergantung jumlah game</li>
              <li>Setelah sync, Anda bisa edit harga dan diskon di halaman Paket</li>
              <li>Produk yang di-sync otomatis akan aktif dan siap dijual</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Konfirmasi Hapus Semua Produk
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Anda akan menghapus <strong className="text-white">SEMUA PRODUK DAN PAKET</strong> dari database.
              <br /><br />
              Tindakan ini <strong className="text-red-400">TIDAK DAPAT DIBATALKAN</strong>.
              <br /><br />
              Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
