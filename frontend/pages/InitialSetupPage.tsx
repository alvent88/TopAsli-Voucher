import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backend from "~backend/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function InitialSetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await backend.admin.checkSetupStatus();
        if (!status.needsSetup) {
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [navigate]);
  const [formData, setFormData] = useState({
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
    fonnteToken: "",
    uniplayApiKey: "",
    uniplayPincode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.adminPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    if (formData.adminPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await backend.admin.initialSetup({
        adminPhone: formData.adminPhone,
        adminPassword: formData.adminPassword,
        fonnteToken: formData.fonnteToken,
        uniplayApiKey: formData.uniplayApiKey || undefined,
        uniplayPincode: formData.uniplayPincode || undefined,
      });

      toast({
        title: "Setup Berhasil!",
        description: result.message,
      });

      navigate("/login");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Setup Gagal",
        description: error.message || "Terjadi kesalahan saat setup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <p className="text-white">Memeriksa status setup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Initial Setup - Gaming Top Up Platform</CardTitle>
          <CardDescription>
            Setup pertama kali untuk membuat akun superadmin dan konfigurasi API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPhone">Nomor WhatsApp Admin (format: 628xxx)</Label>
              <Input
                id="adminPhone"
                type="tel"
                placeholder="6282140264050"
                value={formData.adminPhone}
                onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nomor ini akan menjadi superadmin dan untuk menerima OTP WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password Admin</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ketik ulang password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">API Configuration (Required)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fonnteToken">Fonnte API Token *</Label>
                <Input
                  id="fonnteToken"
                  type="text"
                  placeholder="Dapatkan di fonnte.com"
                  value={formData.fonnteToken}
                  onChange={(e) => setFormData({ ...formData, fonnteToken: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Token API Fonnte untuk mengirim OTP WhatsApp. Wajib diisi!
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Uniplay API (Optional - bisa diisi nanti)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="uniplayApiKey">Uniplay API Key</Label>
                <Input
                  id="uniplayApiKey"
                  type="text"
                  placeholder="Kosongkan jika belum punya"
                  value={formData.uniplayApiKey}
                  onChange={(e) => setFormData({ ...formData, uniplayApiKey: e.target.value })}
                />
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="uniplayPincode">Uniplay Pincode</Label>
                <Input
                  id="uniplayPincode"
                  type="password"
                  placeholder="Kosongkan jika belum punya"
                  value={formData.uniplayPincode}
                  onChange={(e) => setFormData({ ...formData, uniplayPincode: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Setup Sekarang"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Setup hanya bisa dilakukan sekali. Setelah itu gunakan panel admin untuk mengubah konfigurasi.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
