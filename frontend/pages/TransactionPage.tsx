import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Download, TrendingUp, TrendingDown, Wallet, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBackend } from "@/lib/useBackend";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface HistoryItem {
  id: string;
  date: string;
  type: "topup" | "voucher" | "purchase";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  relatedData?: {
    productName?: string;
    packageName?: string;
    gameId?: string;
    voucherCode?: string;
  };
}

export default function TransactionPage() {
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await backend.transaction.getUserTransactionHistory(params);
      setHistory(result.history);
      setCurrentBalance(result.currentBalance);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat transaksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "voucher":
        return { label: "Redeem Voucher", color: "bg-green-600" };
      case "topup":
        return { label: "Top Up", color: "bg-blue-600" };
      case "purchase":
        return { label: "Pembelian", color: "bg-purple-600" };
      default:
        return { label: type, color: "bg-gray-600" };
    }
  };

  const exportToCSV = () => {
    try {
      const BOM = "\uFEFF";
      const headers = ["Tanggal", "Keterangan", "Debit", "Kredit", "Saldo"];
      const csvRows = [
        headers.join(","),
        ...history.map(item => [
          formatDate(item.date),
          `"${item.description}"`,
          item.debit || 0,
          item.credit || 0,
          item.balance,
        ].join(","))
      ];
      const csvContent = BOM + csvRows.join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `riwayat_transaksi_${new Date().getTime()}.csv`;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Export Berhasil",
        description: "File CSV berhasil diunduh",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Gagal export file CSV",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Popup diblokir browser. Silakan izinkan popup.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Riwayat Transaksi - TopAsli</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1a1f3a; border-bottom: 3px solid #1a1f3a; padding-bottom: 10px; }
            .header { margin-bottom: 20px; }
            .balance { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1a1f3a; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .debit { color: #059669; font-weight: bold; }
            .credit { color: #dc2626; font-weight: bold; }
            .balance-col { font-weight: bold; color: #1a1f3a; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Riwayat Transaksi TopAsli</h1>
            <p><strong>Dicetak pada:</strong> ${new Date().toLocaleString("id-ID")}</p>
          </div>
          
          <div class="balance">
            <h3 style="margin: 0 0 10px 0; color: #1a1f3a;">Saldo Saat Ini</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #059669;">
              ${formatCurrency(currentBalance)}
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th width="15%">Tanggal</th>
                <th width="35%">Keterangan</th>
                <th width="15%" style="text-align: right;">Debit</th>
                <th width="15%" style="text-align: right;">Kredit</th>
                <th width="20%" style="text-align: right;">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(item => `
                <tr>
                  <td>${formatDate(item.date)}</td>
                  <td>${item.description}</td>
                  <td class="debit" style="text-align: right;">
                    ${item.debit > 0 ? formatCurrency(item.debit) : "-"}
                  </td>
                  <td class="credit" style="text-align: right;">
                    ${item.credit > 0 ? formatCurrency(item.credit) : "-"}
                  </td>
                  <td class="balance-col" style="text-align: right;">
                    ${formatCurrency(item.balance)}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
            <p>TopAsli - Platform Top Up Game Terpercaya</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const totalDebit = history.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = history.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="min-h-screen bg-[#0F1B2B]">
      <nav className="border-b border-slate-800 bg-[#0f1229]">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="text-white hover:text-blue-400 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Riwayat Transaksi</h1>
          <p className="text-sm lg:text-base text-slate-400">Buku transaksi lengkap dengan debit, kredit, dan saldo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardContent className="pt-4 lg:pt-6 pb-4 lg:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-300">Saldo Saat Ini</p>
                  <p className="text-lg lg:text-2xl font-bold text-white">{formatCurrency(currentBalance)}</p>
                </div>
                <Wallet className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="pt-4 lg:pt-6 pb-4 lg:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-400">Total Debit</p>
                  <p className="text-lg lg:text-2xl font-bold text-green-400">{formatCurrency(totalDebit)}</p>
                </div>
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="pt-4 lg:pt-6 pb-4 lg:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-400">Total Kredit</p>
                  <p className="text-lg lg:text-2xl font-bold text-red-400">{formatCurrency(totalCredit)}</p>
                </div>
                <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1a1f3a] border-slate-700 mb-4 lg:mb-6">
          <CardHeader className="pb-3 lg:pb-6">
            <CardTitle className="text-white flex items-center gap-2 text-base lg:text-lg">
              <Filter className="h-4 w-4 lg:h-5 lg:w-5" />
              Filter Tanggal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs lg:text-sm">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-sm lg:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs lg:text-sm">Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-sm lg:text-base"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 lg:mt-4">
              <Button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                size="sm"
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 flex-1 sm:flex-none"
              >
                Reset
              </Button>
              <Button
                onClick={loadHistory}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={exportToCSV}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                onClick={exportToPDF}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="pb-3 lg:pb-6">
            <CardTitle className="text-white text-base lg:text-lg">Buku Transaksi</CardTitle>
            <CardDescription className="text-slate-400 text-xs lg:text-sm">
              {loading ? "Memuat..." : `${history.length} transaksi ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Memuat transaksi...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Belum ada transaksi</div>
            ) : (
              <div className="overflow-x-auto -mx-4 lg:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs lg:text-sm">Tanggal</TableHead>
                      <TableHead className="text-slate-300 text-xs lg:text-sm">Keterangan</TableHead>
                      <TableHead className="text-slate-300 text-xs lg:text-sm text-right hidden sm:table-cell">Debit (+)</TableHead>
                      <TableHead className="text-slate-300 text-xs lg:text-sm text-right hidden sm:table-cell">Kredit (-)</TableHead>
                      <TableHead className="text-slate-300 text-xs lg:text-sm text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => {
                      const typeInfo = getTypeLabel(item.type);
                      return (
                        <TableRow key={item.id} className="border-slate-700">
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-1 lg:gap-2">
                              <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-slate-500" />
                              <span className="text-xs lg:text-sm">{formatDate(item.date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={`${typeInfo.color} text-xs`}>
                                {typeInfo.label}
                              </Badge>
                              <p className="text-white text-xs lg:text-sm font-medium break-words">{item.description}</p>
                              {item.relatedData?.voucherCode && (
                                <p className="text-slate-400 text-xs font-mono break-all">
                                  Kode: {item.relatedData.voucherCode}
                                </p>
                              )}
                              {item.relatedData?.gameId && (
                                <p className="text-slate-400 text-xs break-all">
                                  ID: {item.relatedData.gameId}
                                </p>
                              )}
                              <div className="sm:hidden flex gap-2 text-xs mt-1">
                                {item.debit > 0 && (
                                  <span className="text-green-400 font-bold">+{formatCurrency(item.debit)}</span>
                                )}
                                {item.credit > 0 && (
                                  <span className="text-red-400 font-bold">-{formatCurrency(item.credit)}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {item.debit > 0 ? (
                              <span className="text-green-400 font-bold text-xs lg:text-sm">
                                + {formatCurrency(item.debit)}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs lg:text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {item.credit > 0 ? (
                              <span className="text-red-400 font-bold text-xs lg:text-sm">
                                - {formatCurrency(item.credit)}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs lg:text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-white font-bold text-sm lg:text-base">
                              {formatCurrency(item.balance)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
