import { useState, useEffect } from "react";
import { MessageCircle, Plus, Trash2, Edit, RefreshCw, Phone, User, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import { withAuditMetadata } from "@/lib/withAuditMetadata";

interface WhatsAppCS {
  id: number;
  phoneNumber: string;
  adminName: string;
  isActive: boolean;
  addedBy: string;
  addedAt: string;
  updatedAt: string;
}

export default function AdminWhatsAppCS() {
  const backend = useBackend();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [numbers, setNumbers] = useState<WhatsAppCS[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppCS | null>(null);
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adminName, setAdminName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    setLoading(true);
    try {
      const result = await backend.admin.listWhatsAppCS();
      setNumbers(result.numbers);
    } catch (error) {
      console.error("Failed to load WhatsApp CS numbers:", error);
      toast({
        title: "Error",
        description: "Gagal memuat nomor WhatsApp CS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!phoneNumber || !adminName) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = await withAuditMetadata({ phoneNumber, adminName });
      await backend.admin.addWhatsAppCS(payload);
      toast({
        title: "Berhasil",
        description: "Nomor WhatsApp CS berhasil ditambahkan",
      });
      setCreateDialogOpen(false);
      setPhoneNumber("");
      setAdminName("");
      loadNumbers();
    } catch (error: any) {
      console.error("Failed to add WhatsApp CS:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan nomor WhatsApp CS",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (number: WhatsAppCS) => {
    try {
      const payload = await withAuditMetadata({
        id: number.id,
        isActive: !number.isActive,
      });
      await backend.admin.updateWhatsAppCS(payload);
      toast({
        title: "Berhasil",
        description: `Nomor WhatsApp CS berhasil ${!number.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      });
      loadNumbers();
    } catch (error: any) {
      console.error("Failed to toggle WhatsApp CS:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus nomor WhatsApp CS ini?")) return;

    try {
      const payload = await withAuditMetadata({ id });
      await backend.admin.deleteWhatsAppCS(payload);
      toast({
        title: "Berhasil",
        description: "Nomor WhatsApp CS berhasil dihapus",
      });
      loadNumbers();
    } catch (error: any) {
      console.error("Failed to delete WhatsApp CS:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus nomor",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (number: WhatsAppCS) => {
    setSelectedNumber(number);
    setPhoneNumber(number.phoneNumber);
    setAdminName(number.adminName);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedNumber || !phoneNumber || !adminName) return;

    setSubmitting(true);
    try {
      const payload = await withAuditMetadata({
        id: selectedNumber.id,
        phoneNumber,
        adminName,
      });
      await backend.admin.updateWhatsAppCS(payload);
      toast({
        title: "Berhasil",
        description: "Nomor WhatsApp CS berhasil diupdate",
      });
      setEditDialogOpen(false);
      setSelectedNumber(null);
      setPhoneNumber("");
      setAdminName("");
      loadNumbers();
    } catch (error: any) {
      console.error("Failed to update WhatsApp CS:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate nomor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white">WhatsApp Customer Service</h2>
          <p className="text-sm lg:text-base text-slate-400">Kelola nomor WhatsApp yang menerima pesan dari website</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadNumbers}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {canEdit && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Nomor
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base lg:text-lg">Daftar Nomor WhatsApp CS</CardTitle>
          <CardDescription className="text-slate-400 text-xs lg:text-sm">
            Pesan dari contact form akan dikirim ke semua nomor yang aktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Memuat data...</div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">Belum ada nomor WhatsApp CS</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Nama Admin</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Nomor WhatsApp</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm hidden md:table-cell">Ditambahkan</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.map((number) => (
                    <TableRow key={number.id} className="border-slate-700">
                      <TableCell className="text-white font-medium text-xs lg:text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          {number.adminName}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs lg:text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span className="font-mono">{number.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {number.isActive ? (
                          <Badge className="bg-green-600 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-600 text-xs">
                            <XCircle className="mr-1 h-3 w-3" />
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs hidden md:table-cell">
                        {formatDate(number.addedAt)}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => handleToggleActive(number)}
                              variant="ghost"
                              size="sm"
                              className={`${
                                number.isActive
                                  ? "text-slate-400 hover:text-slate-300"
                                  : "text-green-400 hover:text-green-300"
                              }`}
                            >
                              {number.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              onClick={() => handleEditClick(number)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(number.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className="bg-slate-600 text-xs">View Only</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Tambah Nomor WhatsApp CS</DialogTitle>
            <DialogDescription className="text-slate-400">
              Nomor ini akan menerima notifikasi pesan dari contact form
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Admin</Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Contoh: Admin Utama"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nomor WhatsApp</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="bg-slate-800 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">Format: 08xxx atau 628xxx</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Menambahkan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Nomor WhatsApp CS</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update informasi nomor WhatsApp CS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Admin</Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nomor WhatsApp</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedNumber(null);
                setPhoneNumber("");
                setAdminName("");
              }}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
