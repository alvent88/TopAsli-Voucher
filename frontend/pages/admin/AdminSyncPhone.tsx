import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useBackend } from "@/lib/useBackend";

export default function AdminSyncPhone() {
  const backend = useBackend();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    synced: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await backend.admin.syncPhoneMetadata();
      
      setResult({
        synced: response.synced,
        errors: response.errors,
      });
      
      toast({
        title: "Sync Berhasil",
        description: `${response.synced} user berhasil di-sync`,
      });
    } catch (err: any) {
      console.error("Sync error:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal sync phone metadata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sync Phone Metadata</h1>
        <p className="text-slate-400 mt-2">
          Sinkronkan nomor HP dari unsafeMetadata ke publicMetadata untuk semua user
        </p>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sync Phone Numbers</CardTitle>
          <CardDescription className="text-slate-400">
            Klik tombol di bawah untuk memindahkan nomor HP dari unsafeMetadata ke publicMetadata
            agar bisa diakses di Contact Form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSync}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Phone Metadata
              </>
            )}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <p className="text-green-400 font-semibold">
                  ✅ {result.synced} user berhasil di-sync
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <p className="text-red-400 font-semibold mb-2">
                    ❌ {result.errors.length} error:
                  </p>
                  <div className="space-y-2">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-sm text-red-300">
                        <span className="font-mono">{err.email}</span>: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
