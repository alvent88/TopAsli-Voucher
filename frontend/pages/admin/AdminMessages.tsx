import { useState, useEffect } from "react";
import { Mail, Trash2, CheckCircle, Circle, Loader2, AlertTriangle, Calendar, User, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useBackend } from "@/lib/useBackend";

interface Message {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessages() {
  const backend = useBackend();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, [showRead, sortBy, order]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { messages: data, unreadCount: count } = await backend.message.list({
        showRead,
        sortBy,
        order,
      });
      setMessages(data);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pesan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await backend.message.markAsRead({ messageId });
      toast({
        title: "Berhasil",
        description: "Pesan ditandai sebagai sudah dibaca",
      });
      loadMessages();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast({
        title: "Error",
        description: "Gagal menandai pesan",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (message: Message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    setDeleting(true);
    try {
      await backend.message.deleteMessage({ messageId: messageToDelete.id });
      toast({
        title: "Berhasil",
        description: "Pesan berhasil dihapus",
      });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pesan",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Mail className="h-8 w-8" />
            Pesan dari Pengguna
          </h1>
          <p className="text-slate-400">
            Kelola pesan yang masuk dari formulir kontak
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2">
            {unreadCount} Belum Dibaca
          </Badge>
          <Button
            onClick={loadMessages}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={showRead ? "all" : "unread"} onValueChange={(v) => setShowRead(v === "all")}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all" className="text-white hover:bg-slate-700">Semua Pesan</SelectItem>
            <SelectItem value="unread" className="text-white hover:bg-slate-700">Belum Dibaca</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: "date" | "name") => setSortBy(v)}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="date" className="text-white hover:bg-slate-700">Urutkan: Tanggal</SelectItem>
            <SelectItem value="name" className="text-white hover:bg-slate-700">Urutkan: Nama</SelectItem>
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={(v: "asc" | "desc") => setOrder(v)}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="desc" className="text-white hover:bg-slate-700">Terbaru</SelectItem>
            <SelectItem value="asc" className="text-white hover:bg-slate-700">Terlama</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#1a1f3a] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Daftar Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-400">Memuat pesan...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Tidak ada pesan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-400 w-12"></TableHead>
                      <TableHead className="text-slate-400">Pengirim</TableHead>
                      <TableHead className="text-slate-400">WhatsApp</TableHead>
                      <TableHead className="text-slate-400">Subjek</TableHead>
                      <TableHead className="text-slate-400">Tanggal</TableHead>
                      <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow
                        key={message.id}
                        className={`border-slate-700 hover:bg-slate-800/50 cursor-pointer ${
                          selectedMessage?.id === message.id ? "bg-slate-800/50" : ""
                        }`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.isRead) {
                            handleMarkAsRead(message.id);
                          }
                        }}
                      >
                        <TableCell>
                          {message.isRead ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-blue-400" />
                          )}
                        </TableCell>
                        <TableCell className={`${message.isRead ? "text-slate-300" : "text-white font-semibold"}`}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            {message.name}
                          </div>
                          <div className="text-xs text-slate-500">{message.email}</div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {message.phoneNumber || "-"}
                        </TableCell>
                        <TableCell className={`${message.isRead ? "text-slate-400" : "text-white font-medium"}`}>
                          {message.subject}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(message.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(message);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Detail Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium">Dari</label>
                  <p className="text-white font-semibold">{selectedMessage.name}</p>
                  <p className="text-slate-400 text-sm">{selectedMessage.email}</p>
                  {selectedMessage.phoneNumber && (
                    <p className="text-slate-400 text-sm">WhatsApp: {selectedMessage.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium">Subjek</label>
                  <p className="text-white font-semibold">{selectedMessage.subject}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium">Tanggal</label>
                  <p className="text-slate-400 text-sm">{formatDate(selectedMessage.createdAt)}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium">Pesan</label>
                  <div className="bg-slate-800 rounded-lg p-4 mt-2">
                    <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  {!selectedMessage.isRead && (
                    <Button
                      onClick={() => handleMarkAsRead(selectedMessage.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tandai Dibaca
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteClick(selectedMessage)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Pilih pesan untuk melihat detail</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a1f3a] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Apakah Anda yakin ingin menghapus pesan dari{" "}
              <span className="text-white font-semibold">{messageToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600" disabled={deleting}>
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
    </div>
  );
}
