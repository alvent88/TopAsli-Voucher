import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import type { Transaction } from "~backend/transaction/get";
import { RefreshCw, Search, FileDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

type DateFilter = "realtime" | "today" | "7days" | "30days";
type StatusFilter = "all" | "success" | "failed";

export default function AdminTransactions() {
  const backend = useBackend();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("realtime");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [dateFilter, statusFilter, emailFilter, allTransactions]);

  const applyFilters = () => {
    let filtered = [...allTransactions];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === "today") {
      filtered = filtered.filter((t) => new Date(t.createdAt) >= today);
    } else if (dateFilter === "7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((t) => new Date(t.createdAt) >= sevenDaysAgo);
    } else if (dateFilter === "30days") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((t) => new Date(t.createdAt) >= thirtyDaysAgo);
    }

    if (statusFilter === "success") {
      filtered = filtered.filter((t) => t.status === "success");
    } else if (statusFilter === "failed") {
      filtered = filtered.filter((t) => t.status === "failed");
    }

    if (emailFilter) {
      filtered = filtered.filter((t) => 
        t.userEmail?.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    setTransactions(filtered);
  };

  const loadTransactions = async () => {
    try {
      const { transactions: data } = await backend.admin.listTransactions({ 
        email: undefined
      });
      setAllTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await backend.admin.updateTransaction({ id, status });
      toast({
        title: "Berhasil",
        description: "Status transaksi berhasil diperbarui",
      });
      loadTransactions();
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status transaksi",
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

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500/20 text-yellow-300",
      processing: "bg-blue-500/20 text-blue-300",
      success: "bg-green-500/20 text-green-300",
      failed: "bg-red-500/20 text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-slate-500/20 text-slate-300";
  };

  const handleExportToXLSX = async () => {
    try {
      toast({
        title: "Mengekspor...",
        description: "Mohon tunggu, sedang mengunduh data transaksi",
      });

      const { data } = await backend.admin.exportTransactions();

      const worksheet = XLSX.utils.json_to_sheet(data.map((row) => ({
        "ID Transaksi": row.id,
        "Tanggal": row.transactionDate,
        "Email User": row.userEmail,
        "User ID": row.userId,
        "Game ID": row.gameId,
        "Username": row.username,
        "Produk": row.productName,
        "Paket": row.packageName,
        "Jumlah": row.amount,
        "Harga": row.price,
        "Biaya Admin": row.fee,
        "Total": row.total,
        "Metode Pembayaran": row.paymentMethod,
        "Status": row.status,
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");

      const fileName = `Transaksi_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Berhasil! ✅",
        description: `${data.length} transaksi berhasil diekspor ke ${fileName}`,
      });
    } catch (error: any) {
      console.error("Failed to export transactions:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengekspor transaksi",
        variant: "destructive",
      });
    }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "realtime": return "Real-time - Hari Ini";
      case "today": return "Kemarin";
      case "7days": return "7 hari sebelumnya";
      case "30days": return "30 hari sebelumnya";
      default: return "Real-time - Hari Ini";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transaksi</h1>
          <p className="text-slate-400 mt-1">Kelola semua transaksi</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportToXLSX}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export XLSX
          </Button>
          <Button
            onClick={loadTransactions}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 justify-start min-w-72"
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Periode Data: {getDateFilterLabel()}
          </Button>
          {isDateFilterOpen && (
            <div className="absolute top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 p-2">
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-red-400 border-b border-slate-700">Real-time</div>
                <button onClick={() => { setDateFilter("realtime"); setIsDateFilterOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded">
                  Real-time
                </button>
                <div className="px-3 py-2 text-xs font-semibold text-orange-400 border-t border-slate-700 mt-2">Hari Ini - Pk 08:00 (GMT+07)</div>
                <button onClick={() => { setDateFilter("today"); setIsDateFilterOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded">
                  Kemarin
                </button>
                <button onClick={() => { setDateFilter("7days"); setIsDateFilterOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded">
                  7 hari sebelumnya.
                </button>
                <button onClick={() => { setDateFilter("30days"); setIsDateFilterOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded">
                  30 hari sebelumnya.
                </button>
                <div className="px-3 py-2 text-xs font-semibold text-blue-400 border-t border-slate-700 mt-2">Per Hari</div>
                <div className="px-3 py-2 text-xs font-semibold text-purple-400 border-t border-slate-700 mt-2">Per Minggu</div>
                <div className="px-3 py-2 text-xs font-semibold text-green-400 border-t border-slate-700 mt-2">Per Bulan</div>
                <div className="px-3 py-2 text-xs font-semibold text-pink-400 border-t border-slate-700 mt-2">Berdasarkan Tahun</div>
              </div>
            </div>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all" className="text-white hover:bg-slate-700">Semua Status</SelectItem>
            <SelectItem value="success" className="text-white hover:bg-slate-700">Success</SelectItem>
            <SelectItem value="failed" className="text-white hover:bg-slate-700">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filter by email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Daftar Transaksi ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Tidak ada transaksi</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Produk</TableHead>
                    <TableHead className="text-slate-400">Paket</TableHead>
                    <TableHead className="text-slate-400">User ID</TableHead>
                    <TableHead className="text-slate-400">Total</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Tanggal</TableHead>
                    <TableHead className="text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-white font-mono text-xs">
                        {transaction.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {transaction.userEmail || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {transaction.productName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {transaction.packageName}
                      </TableCell>
                      <TableCell className="text-slate-300">{transaction.userId}</TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {new Date(transaction.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.status}
                          onValueChange={(value) => updateStatus(transaction.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                            <SelectItem value="processing" className="text-white hover:bg-slate-700">Processing</SelectItem>
                            <SelectItem value="success" className="text-white hover:bg-slate-700">Success</SelectItem>
                            <SelectItem value="failed" className="text-white hover:bg-slate-700">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
