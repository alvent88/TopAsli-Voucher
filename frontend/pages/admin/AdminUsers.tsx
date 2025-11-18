import { useState, useEffect } from "react";
import { Users, Trash2, Mail, Phone, Calendar, Loader2, AlertTriangle, RefreshCw, Shield, ShieldOff, Crown, Edit, Wallet, Ban, Unlock, ArrowUpDown, ArrowUp, ArrowDown, History, Download, Upload, Search, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";

interface User {
  id: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  birthDate: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  balance: number;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
}

type SortField = "name" | "phone" | "balance" | "createdAt" | "role" | "status";
type SortOrder = "asc" | "desc";

export default function AdminUsers() {
  const backend = useBackend();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editing, setEditing] = useState(false);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { users: data } = await backend.admin.listUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadUsers = async () => {
    try {
      const response = await backend.admin.exportUsers();
      
      const blob = new Blob([response.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil didownload",
      });
    } catch (error: any) {
      console.error("Failed to download users:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mendownload data pengguna",
        variant: "destructive",
      });
    }
  };

  const handleUploadUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      
      const result = await backend.admin.importUsers({ csvData: text });

      toast({
        title: "Upload Berhasil",
        description: `${result.updated} saldo diupdate, ${result.skipped} diskip${result.errors.length > 0 ? `, ${result.errors.length} error` : ""}`,
      });

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      setUploadDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error("Failed to upload users:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload data pengguna",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortOrder === "asc" ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = (user.fullName || user.firstName || "").toLowerCase();
    const phone = (user.phoneNumber || "").toLowerCase();
    return fullName.includes(query) || phone.includes(query);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case "name":
        aVal = (a.fullName || a.firstName || "").toLowerCase();
        bVal = (b.fullName || b.firstName || "").toLowerCase();
        break;
      case "phone":
        aVal = a.phoneNumber || "";
        bVal = b.phoneNumber || "";
        break;
      case "balance":
        aVal = a.balance;
        bVal = b.balance;
        break;
      case "createdAt":
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case "role":
        aVal = a.isSuperAdmin ? 3 : a.isAdmin ? 2 : 1;
        bVal = b.isSuperAdmin ? 3 : b.isAdmin ? 2 : 1;
        break;
      case "status":
        aVal = a.isBanned ? 1 : 0;
        bVal = b.isBanned ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await backend.admin.deleteUser({ userId: userToDelete.id });
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePromoteToAdmin = async (user: User, role: "admin" | "superadmin") => {
    try {
      await backend.admin.promoteToAdmin({ userId: user.id, role });
      toast({
        title: "Berhasil 🎉",
        description: `${user.fullName || user.phoneNumber} berhasil diangkat menjadi ${role === "superadmin" ? "superadmin" : "admin"}`,
      });
      loadUsers();
    } catch (error: any) {
      console.error("Failed to promote user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengangkat user menjadi admin",
        variant: "destructive",
      });
    }
  };

  const handleDemoteFromAdmin = async (user: User) => {
    try {
      await backend.admin.demoteFromAdmin({ userId: user.id });
      toast({
        title: "Berhasil",
        description: `${user.fullName || user.phoneNumber} berhasil diturunkan dari admin`,
      });
      loadUsers();
    } catch (error: any) {
      console.error("Failed to demote user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menurunkan admin",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditFullName(user.fullName || "");
    setEditPhoneNumber(user.phoneNumber || "");
    
    let formattedBirthDate = "";
    if (user.birthDate) {
      try {
        const date = new Date(user.birthDate);
        formattedBirthDate = date.toISOString().split('T')[0];
      } catch (e) {
        formattedBirthDate = user.birthDate;
      }
    }
    setEditBirthDate(formattedBirthDate);
    
    setEditBalance(user.balance || 0);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!userToEdit) return;

    setEditing(true);
    try {
      await backend.admin.editUser({
        userId: userToEdit.id,
        fullName: editFullName || undefined,
        phoneNumber: editPhoneNumber || undefined,
        birthDate: editBirthDate || undefined,
        balance: editBalance,
      });
      toast({
        title: "Berhasil ✅",
        description: "Data pengguna berhasil diperbarui",
      });
      setEditDialogOpen(false);
      setUserToEdit(null);
      loadUsers();
    } catch (error: any) {
      console.error("Failed to edit user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data pengguna",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const handleBanUser = async (user: User) => {
    const reason = prompt("Masukkan alasan banned:");
    if (!reason) return;

    try {
      await backend.admin.banUser({ userId: user.id, reason });
      toast({
        title: "Berhasil",
        description: `${user.fullName || user.phoneNumber} berhasil dibanned`,
      });
      loadUsers();
    } catch (error: any) {
      console.error("Failed to ban user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memban user",
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async (user: User) => {
    try {
      await backend.admin.unbanUser({ userId: user.id });
      toast({
        title: "Berhasil",
        description: `${user.fullName || user.phoneNumber} berhasil di-unban`,
      });
      loadUsers();
    } catch (error: any) {
      console.error("Failed to unban user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal unban user",
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewTransactions = async (user: User) => {
    setSelectedUser(user);
    setTransactionDialogOpen(true);
    setLoadingTransactions(true);
    
    try {
      const { transactions } = await backend.admin.getUserTransactions({ userId: user.id });
      setUserTransactions(transactions);
    } catch (error: any) {
      console.error("Failed to load user transactions:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat riwayat transaksi",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Manajemen Pengguna
          </h1>
          <p className="text-slate-400">
            Kelola pengguna yang terdaftar di website
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadUsers}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          {canEdit && (
            <Button
              onClick={() => setUploadDialogOpen(true)}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-900/20"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          )}
          <Button
            onClick={loadUsers}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white">Refresh</span>
          </Button>
        </div>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Daftar Pengguna</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari berdasarkan nama atau nomor HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-400">Memuat data pengguna...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Belum ada pengguna terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Nama
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center">
                        Nomor HP
                        {getSortIcon("phone")}
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Tanggal Lahir
                    </TableHead>
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("balance")}
                    >
                      <div className="flex items-center">
                        Saldo
                        {getSortIcon("balance")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center">
                        Role
                        {getSortIcon("role")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-slate-400 cursor-pointer select-none"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Terdaftar
                        {getSortIcon("createdAt")}
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-400">Login Terakhir</TableHead>
                    <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`border-slate-700 hover:bg-slate-800/50 ${user.isBanned ? 'bg-red-900/10' : ''}`}
                    >
                      <TableCell className="text-white font-medium">
                        {user.fullName || user.firstName || "-"}
                        {user.lastName && ` ${user.lastName}`}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span className="font-mono text-xs">{user.phoneNumber || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.birthDate && user.birthDate !== '' ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-xs">
                              {(() => {
                                const bd: any = user.birthDate;
                                const dateStr = typeof bd === 'string' 
                                  ? bd 
                                  : bd instanceof Date 
                                    ? bd.toISOString().split('T')[0]
                                    : null;
                                if (!dateStr) return '-';
                                const [year, month, day] = dateStr.split('-');
                                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                              })()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-green-400" />
                          <span className="text-xs">{formatCurrency(user.balance)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-red-600 text-xs w-fit">
                              <Ban className="mr-1 h-3 w-3" />
                              Banned
                            </Badge>
                            {user.bannedReason && (
                              <span className="text-xs text-slate-400 truncate max-w-[120px]">{user.bannedReason}</span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-green-600 text-xs w-fit">Aktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.isSuperAdmin ? (
                          <Badge className="bg-yellow-600 text-xs w-fit">
                            <Crown className="mr-1 h-3 w-3" />
                            Super
                          </Badge>
                        ) : user.isAdmin ? (
                          <Badge className="bg-blue-600 text-xs w-fit">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">User</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {user.lastSignInAt ? formatDate(user.lastSignInAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-600 hover:bg-slate-800"
                              >
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white w-48">
                              <DropdownMenuItem
                                onClick={() => handleViewTransactions(user)}
                                className="hover:bg-purple-600/20 cursor-pointer"
                              >
                                <History className="mr-2 h-4 w-4 text-purple-400" />
                                Riwayat Transaksi
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => handleEditClick(user)}
                                className="hover:bg-blue-600/20 cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4 text-blue-400" />
                                Edit Data
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-slate-800" />

                              {user.isBanned ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnbanUser(user)}
                                  className="hover:bg-green-600/20 cursor-pointer"
                                >
                                  <Unlock className="mr-2 h-4 w-4 text-green-400" />
                                  Unban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleBanUser(user)}
                                  className="hover:bg-orange-600/20 cursor-pointer"
                                >
                                  <Ban className="mr-2 h-4 w-4 text-orange-400" />
                                  Ban User
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator className="bg-slate-800" />

                              {user.isSuperAdmin ? (
                                <DropdownMenuItem
                                  onClick={() => handleDemoteFromAdmin(user)}
                                  className="hover:bg-orange-600/20 cursor-pointer"
                                >
                                  <ShieldOff className="mr-2 h-4 w-4 text-orange-400" />
                                  Turunkan dari SA
                                </DropdownMenuItem>
                              ) : user.isAdmin ? (
                                <DropdownMenuItem
                                  onClick={() => handleDemoteFromAdmin(user)}
                                  className="hover:bg-orange-600/20 cursor-pointer"
                                >
                                  <ShieldOff className="mr-2 h-4 w-4 text-orange-400" />
                                  Turunkan dari Admin
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handlePromoteToAdmin(user, "admin")}
                                    className="hover:bg-blue-600/20 cursor-pointer"
                                  >
                                    <Shield className="mr-2 h-4 w-4 text-blue-400" />
                                    Jadikan Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handlePromoteToAdmin(user, "superadmin")}
                                    className="hover:bg-yellow-600/20 cursor-pointer"
                                  >
                                    <Crown className="mr-2 h-4 w-4 text-yellow-400" />
                                    Jadikan Superadmin
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator className="bg-slate-800" />

                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(user)}
                                className="hover:bg-red-600/20 cursor-pointer text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1f3a] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <span className="text-white font-semibold">
                {userToDelete?.fullName || userToDelete?.phoneNumber}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
              disabled={deleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-400" />
              Riwayat Transaksi
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Riwayat transaksi untuk: {selectedUser?.fullName || selectedUser?.phoneNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingTransactions ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-slate-400">Memuat riwayat transaksi...</p>
              </div>
            ) : userTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400">ID</TableHead>
                      <TableHead className="text-slate-400">Produk</TableHead>
                      <TableHead className="text-slate-400">Paket</TableHead>
                      <TableHead className="text-slate-400">Total</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="text-white font-mono text-xs">
                          {transaction.id.substring(0, 10)}...
                        </TableCell>
                        <TableCell className="text-slate-300">{transaction.productName}</TableCell>
                        <TableCell className="text-slate-300">{transaction.packageName}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(transaction.total)}</TableCell>
                        <TableCell>
                          <Badge className={
                            transaction.status === "success" ? "bg-green-600" :
                            transaction.status === "pending" ? "bg-yellow-600" :
                            transaction.status === "processing" ? "bg-blue-600" :
                            "bg-red-600"
                          }>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransactionDialogOpen(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-400" />
              Edit Data Pengguna
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Ubah data pengguna: {userToEdit?.fullName || userToEdit?.phoneNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullname" className="text-sm font-medium text-slate-300">
                Nama Lengkap
              </Label>
              <Input
                id="edit-fullname"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="bg-slate-800 border-slate-700 text-white"
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-sm font-medium text-slate-300">
                Nomor HP
              </Label>
              <Input
                id="edit-phone"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                placeholder="Masukkan nomor HP (contoh: 081234567890)"
                className="bg-slate-800 border-slate-700 text-white"
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birthdate" className="text-sm font-medium text-slate-300">
                Tanggal Lahir
              </Label>
              <Input
                id="edit-birthdate"
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-balance" className="text-sm font-medium text-slate-300">
                Saldo (Rp)
              </Label>
              <Input
                id="edit-balance"
                type="number"
                value={editBalance}
                onChange={(e) => setEditBalance(parseInt(e.target.value) || 0)}
                placeholder="Masukkan saldo"
                className="bg-slate-800 border-slate-700 text-white"
                disabled={editing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editing}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleEditConfirm}
              disabled={editing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Data Pengguna</DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload file CSV untuk update saldo pengguna
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">Penting:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>File harus dalam format CSV yang di-download dari sistem ini</li>
                    <li>Hanya kolom <strong>Balance</strong> yang akan diupdate</li>
                    <li>Kolom lain (Email, Phone, Name, dll) tidak akan berubah</li>
                    <li>User yang tidak ditemukan akan diskip</li>
                    <li>Perubahan saldo akan dicatat di audit logs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Cara Penggunaan:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Download data pengguna dengan tombol "Download CSV"</li>
                  <li>Edit kolom "Balance" sesuai kebutuhan (gunakan Excel/Spreadsheet)</li>
                  <li>Upload file CSV yang sudah diedit</li>
                  <li>Sistem akan update saldo sesuai data di file</li>
                </ol>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Pilih File CSV</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleUploadUsers}
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
