import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Search, Download, CheckCircle2, Clock, Loader2, RefreshCw, AlertTriangle, QrCode, Upload } from "lucide-react";
import QRCode from "qrcode";
import { usePermissions } from "@/lib/usePermissions";
import { withAuditMetadata } from "@/lib/withAuditMetadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBackend } from "@/lib/useBackend";

interface Voucher {
  code: string;
  amount: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  claimedByPhone: string | null;
  claimedAt: string | null;
}

function VoucherQRCode({ code }: { code: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(code, {
      width: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("QR code generation error:", err));
  }, [code]);

  if (!qrDataUrl) return <div className="w-12 h-12 bg-slate-800 rounded animate-pulse" />;

  return <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 rounded" />;
}

export default function AdminVouchers() {
  const backend = useBackend();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [sortBy, setSortBy] = useState<"created" | "amount" | "claimed">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<{
    totalCreated: number;
    totalClaimed: number;
    totalUnclaimed: number;
  }>({ totalCreated: 0, totalClaimed: 0, totalUnclaimed: 0 });

  const [amount, setAmount] = useState<number>(10000);
  const [quantity, setQuantity] = useState<number>(10);
  const [expiresAt, setExpiresAt] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, [searchQuery, statusFilter]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      const { vouchers: data, statistics: stats } = await backend.admin.listVouchers(params);
      setVouchers(data);
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to load vouchers:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data voucher",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    setCreating(true);
    try {
      const payload = await withAuditMetadata({
        amount,
        quantity,
        expiresAt: expiresAt || undefined,
      });
      const result = await backend.admin.createVoucherBatch(payload);

      setGeneratedCodes(result.codes);
      
      toast({
        title: "Berhasil",
        description: `${quantity} voucher berhasil dibuat`,
      });
      
      loadVouchers();
    } catch (error: any) {
      console.error("Failed to create voucher batch:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat voucher",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Hapus voucher ${code}?`)) return;

    try {
      const payload = await withAuditMetadata({ code });
      await backend.admin.deleteVoucher(payload);
      toast({
        title: "Berhasil",
        description: "Voucher berhasil dihapus",
      });
      loadVouchers();
    } catch (error) {
      console.error("Failed to delete voucher:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus voucher",
        variant: "destructive",
      });
    }
  };

  const handleDownloadVouchers = async () => {
    try {
      const response = await backend.admin.exportVouchers();
      
      const blob = new Blob([response.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vouchers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Voucher berhasil didownload",
      });
    } catch (error: any) {
      console.error("Failed to download vouchers:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mendownload voucher",
        variant: "destructive",
      });
    }
  };

  const handleUploadVouchers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      
      const result = await backend.admin.importVouchers({ csvData: text });

      toast({
        title: "Upload Berhasil",
        description: `${result.imported} voucher diimport, ${result.skipped} diskip${result.errors.length > 0 ? `, ${result.errors.length} error` : ""}`,
      });

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      setUploadDialogOpen(false);
      loadVouchers();
    } catch (error: any) {
      console.error("Failed to upload vouchers:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload voucher",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const downloadVoucherCodes = async () => {
    if (!generatedCodes || generatedCodes.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada kode voucher untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Starting Excel download with", generatedCodes.length, "codes");
      
      const XLSX = await import('xlsx');
      
      const worksheetData = [
        ['Kode Voucher', 'Nominal'],
        ...generatedCodes.map(code => [code, amount])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers');
      
      XLSX.writeFile(workbook, `vouchers_${amount}_${Date.now()}.xlsx`);
      
      console.log("Excel download complete");

      toast({
        title: "Download Berhasil",
        description: `File Excel dengan ${generatedCodes.length} voucher berhasil diunduh`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: `Gagal mendownload file: ${error}`,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteAll = async () => {
    const confirmText = "Apakah Anda yakin ingin menghapus SEMUA voucher? Tindakan ini tidak dapat dibatalkan!";
    if (!confirm(confirmText)) return;
    
    const doubleConfirm = "Konfirmasi sekali lagi: Semua voucher akan dihapus (saldo user tidak berubah). Ketik 'HAPUS' untuk melanjutkan.";
    const userInput = prompt(doubleConfirm);
    if (userInput !== "HAPUS") {
      toast({
        title: "Dibatalkan",
        description: "Penghapusan dibatalkan",
      });
      return;
    }

    try {
      const payload = await withAuditMetadata({});
      const voucherResult = await backend.admin.deleteAllVouchers(payload);
      
      toast({
        title: "Berhasil",
        description: `${voucherResult.deletedCount} voucher berhasil dihapus`,
      });
      
      loadVouchers();
    } catch (error: any) {
      console.error("Failed to delete all:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus voucher",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortedVouchers = [...vouchers].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case "amount":
        compareValue = a.amount - b.amount;
        break;
      case "claimed":
        const aTime = a.claimedAt ? new Date(a.claimedAt).getTime() : 0;
        const bTime = b.claimedAt ? new Date(b.claimedAt).getTime() : 0;
        compareValue = aTime - bTime;
        break;
      case "created":
      default:
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  const handleSort = (column: "created" | "amount" | "claimed") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white">Voucher Management</h2>
          <p className="text-sm lg:text-base text-slate-400">Kelola voucher saldo user</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadVouchers}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-900 bg-slate-100 hover:bg-slate-200 flex-1 lg:flex-none"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleDownloadVouchers}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20 flex-1 lg:flex-none"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          {canEdit && (
            <>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-900/20 flex-1 lg:flex-none"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <Button
                onClick={handleDeleteAll}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-900/20 flex-1 lg:flex-none"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua
              </Button>
              <Button
                onClick={() => {
                  setCreateDialogOpen(true);
                  setGeneratedCodes([]);
                }}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 lg:flex-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Batch
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border-blue-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 text-sm font-medium">Total Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-white">
              {statistics.totalCreated.toLocaleString()}
            </div>
            <p className="text-xs text-blue-300 mt-1">Semua voucher yang dibuat</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-500/10 border-green-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 text-sm font-medium">Sudah Diklaim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-white">
              {statistics.totalClaimed.toLocaleString()}
            </div>
            <p className="text-xs text-green-300 mt-1">
              {statistics.totalCreated > 0 
                ? `${((statistics.totalClaimed / statistics.totalCreated) * 100).toFixed(1)}% dari total`
                : "0% dari total"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 border-yellow-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 text-sm font-medium">Belum Diklaim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-white">
              {statistics.totalUnclaimed.toLocaleString()}
            </div>
            <p className="text-xs text-yellow-300 mt-1">
              {statistics.totalCreated > 0 
                ? `${((statistics.totalUnclaimed / statistics.totalCreated) * 100).toFixed(1)}% dari total`
                : "0% dari total"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Cari Kode / No. HP</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari kode voucher atau nomor HP user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="claimed">Sudah Diklaim</SelectItem>
                  <SelectItem value="unclaimed">Belum Diklaim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Urutkan Berdasarkan</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="created">Tanggal Dibuat</SelectItem>
                  <SelectItem value="amount">Nominal</SelectItem>
                  <SelectItem value="claimed">Tanggal Diklaim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Urutan</Label>
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="desc">Terbaru/Terbesar</SelectItem>
                  <SelectItem value="asc">Terlama/Terkecil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Daftar Voucher</CardTitle>
          <CardDescription className="text-slate-400">
            {loading ? "Memuat..." : `${vouchers.length} voucher ditemukan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Memuat data...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Belum ada voucher</div>
          ) : (
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300 text-xs lg:text-sm">QR Code</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Kode</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Nominal</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm hidden md:table-cell">Diklaim Oleh</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm hidden lg:table-cell">Tgl Diklaim</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm hidden xl:table-cell">Dibuat</TableHead>
                    <TableHead className="text-slate-300 text-xs lg:text-sm text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVouchers.map((voucher) => (
                    <TableRow key={voucher.code} className="border-slate-700">
                      <TableCell>
                        <VoucherQRCode code={voucher.code} />
                      </TableCell>
                      <TableCell className="text-white font-mono font-bold text-xs lg:text-sm">
                        {voucher.code}
                      </TableCell>
                      <TableCell className="text-white font-semibold text-xs lg:text-sm">
                        {formatCurrency(voucher.amount)}
                      </TableCell>
                      <TableCell>
                        {voucher.claimedByPhone ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Diklaim</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Belum</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs lg:text-sm hidden md:table-cell">
                        {voucher.claimedByPhone ? (
                          <span className="text-blue-400 truncate block max-w-[150px]">{voucher.claimedByPhone}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs lg:text-sm hidden lg:table-cell">
                        {voucher.claimedAt ? formatDate(voucher.claimedAt) : "-"}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs hidden xl:table-cell">
                        {formatDate(voucher.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {canEdit ? (
                          <Button
                            onClick={() => handleDelete(voucher.code)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
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
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-[95vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Buat Voucher Batch</DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate beberapa voucher sekaligus dengan kode unik
            </DialogDescription>
          </DialogHeader>

          {generatedCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">
                  ✅ {generatedCodes.length} voucher berhasil dibuat!
                </h3>
                <p className="text-slate-300 text-sm">
                  Kode voucher telah digenerate. Silakan download atau salin kode-kode di bawah.
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto bg-slate-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {generatedCodes.map((code) => (
                    <div
                      key={code}
                      className="bg-slate-800 px-3 py-2 rounded font-mono text-sm text-white border border-slate-600"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={downloadVoucherCodes}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
                <Button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setGeneratedCodes([]);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-800"
                >
                  Selesai
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nominal Voucher</Label>
                  <Select value={amount.toString()} onValueChange={(v) => setAmount(parseInt(v))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="2000">Rp 2.000</SelectItem>
                      <SelectItem value="5000">Rp 5.000</SelectItem>
                      <SelectItem value="10000">Rp 10.000</SelectItem>
                      <SelectItem value="20000">Rp 20.000</SelectItem>
                      <SelectItem value="50000">Rp 50.000</SelectItem>
                      <SelectItem value="100000">Rp 100.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Jumlah Voucher</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Contoh: 100"
                  />
                  <p className="text-xs text-slate-400">Maksimal 1000 voucher per batch</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Tanggal Kadaluarsa (Opsional)</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    <strong>Ringkasan:</strong> Akan dibuat {quantity} voucher dengan nominal{" "}
                    {formatCurrency(amount)} per voucher. Total nilai: {formatCurrency(amount * quantity)}
                  </p>
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
                  onClick={handleCreateBatch}
                  disabled={creating || quantity < 1}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <Ticket className="mr-2 h-4 w-4" />
                      Buat {quantity} Voucher
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Voucher CSV</DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload file CSV untuk restore voucher yang telah di-download sebelumnya
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">Peringatan:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>File harus dalam format CSV yang di-download dari sistem ini</li>
                    <li>Voucher yang sudah ada akan diskip</li>
                    <li>Status claimed akan di-restore sesuai data CSV</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Pilih File CSV</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleUploadVouchers}
                disabled={uploading}
                className="bg-slate-800 border-slate-600 text-white file:bg-slate-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4"
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengupload dan memproses...</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setUploadDialogOpen(false)}
              variant="outline"
              disabled={uploading}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
