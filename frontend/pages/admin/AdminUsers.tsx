import { useState, useEffect } from "react";
import { Users, Trash2, Mail, Phone, Calendar, Loader2, AlertTriangle, RefreshCw, Shield, ShieldOff, Crown, Edit, Wallet, Ban, Unlock, ArrowUpDown, ArrowUp, ArrowDown, History } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";

interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  balance: number;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
}

type SortField = "name" | "email" | "phone" | "balance" | "createdAt" | "role" | "status";
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
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editing, setEditing] = useState(false);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case "name":
        aVal = (a.fullName || a.firstName || "").toLowerCase();
        bVal = (b.fullName || b.firstName || "").toLowerCase();
        break;
      case "email":
        aVal = (a.email || "").toLowerCase();
        bVal = (b.email || "").toLowerCase();
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
        description: `${user.fullName || user.email || user.phoneNumber} berhasil diangkat menjadi ${role === "superadmin" ? "superadmin" : "admin"}`,
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
        description: `${user.fullName || user.email || user.phoneNumber} berhasil diturunkan dari admin`,
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
    setEditEmail(user.email || "");
    setEditPhoneNumber(user.phoneNumber || "");
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
        email: editEmail || undefined,
        phoneNumber: editPhoneNumber || undefined,
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
      await backend.admin.banUser({ email: user.email || "", reason });
      toast({
        title: "Berhasil",
        description: `${user.fullName || user.email} berhasil dibanned`,
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
      await backend.admin.unbanUser({ email: user.email || "" });
      toast({
        title: "Berhasil",
        description: `${user.fullName || user.email} berhasil diunban`,
      });
      
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to unban user:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengunban user",
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
        <Button
          onClick={loadUsers}
          variant="outline"
          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="text-white">Refresh</span>
        </Button>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Daftar Pengguna</CardTitle>
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
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon("email")}
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
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="truncate max-w-[200px]">{user.email || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span className="font-mono text-xs">{user.phoneNumber || "-"}</span>
                        </div>
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
                      <TableCell>
                        {canEdit ? (
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTransactions(user)}
                                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/50 w-full"
                              >
                                <History className="h-3 w-3 mr-1" />
                                <span className="text-xs">Riwayat</span>
                              </Button>

                              {user.isBanned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnbanUser(user)}
                                  className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-600/50 w-full"
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Unban</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBanUser(user)}
                                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-600/50 w-full"
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Ban</span>
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(user)}
                                className="bg-slate-600/20 hover:bg-slate-600/30 text-slate-300 border border-slate-600/50 w-full"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                <span className="text-xs">Edit</span>
                              </Button>

                              {user.isSuperAdmin ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDemoteFromAdmin(user)}
                                  className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/50 w-full"
                                >
                                  <ShieldOff className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Turunkan SA</span>
                                </Button>
                              ) : user.isAdmin ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDemoteFromAdmin(user)}
                                  className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/50 w-full"
                                >
                                  <ShieldOff className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Turunkan</span>
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePromoteToAdmin(user, "admin")}
                                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 w-full"
                                  >
                                    <Shield className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Admin</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePromoteToAdmin(user, "superadmin")}
                                    className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/50 w-full"
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Superadmin</span>
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClick(user)}
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 w-full"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="text-xs">Hapus</span>
                              </Button>
                            </div>
                        ) : (
                          <Badge className="bg-slate-600 text-xs w-full">View Only</Badge>
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
                {userToDelete?.fullName || userToDelete?.email || userToDelete?.phoneNumber}
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
              Riwayat transaksi untuk: {selectedUser?.fullName || selectedUser?.email || selectedUser?.phoneNumber}
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
              Ubah data pengguna: {userToEdit?.fullName || userToEdit?.email || userToEdit?.phoneNumber}
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
              <Label htmlFor="edit-email" className="text-sm font-medium text-slate-300">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Masukkan email"
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
    </div>
  );
}
