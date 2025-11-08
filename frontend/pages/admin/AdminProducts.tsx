import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import type { Product } from "~backend/product/list";
import { RefreshCw, Gamepad2, Plus, Pencil, Trash2, Upload, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminProducts() {
  const backend = useBackend();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "MOBA",
    description: "",
    iconUrl: "",
    isActive: true,
  });
  
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { products: data } = await backend.admin.listAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      category: "MOBA",
      description: "",
      iconUrl: "",
      isActive: true,
    });
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingIcon(true);
    try {
      const { uploadUrl, publicUrl } = await backend.admin.getUploadUrl({
        fileName: file.name,
        contentType: file.type,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setFormData({ ...formData, iconUrl: publicUrl });
      
      toast({
        title: "Berhasil",
        description: "Icon berhasil diupload",
      });
    } catch (error: any) {
      console.error("Failed to upload icon:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload icon",
        variant: "destructive",
      });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description || "",
      iconUrl: product.iconUrl || "",
      isActive: product.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.name || !formData.slug || !formData.category) {
      toast({
        title: "Error",
        description: "Nama, slug, dan kategori wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await backend.admin.createProduct({
        name: formData.name,
        slug: formData.slug,
        category: formData.category,
        description: formData.description || undefined,
        iconUrl: formData.iconUrl || undefined,
      });
      
      toast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan",
      });
      
      setCreateDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan produk",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      await backend.admin.updateProduct({
        productId: selectedProduct.id,
        name: formData.name,
        slug: formData.slug,
        category: formData.category,
        description: formData.description || undefined,
        iconUrl: formData.iconUrl || undefined,
        isActive: formData.isActive,
      });
      
      toast({
        title: "Berhasil",
        description: "Produk berhasil diperbarui",
      });
      
      setEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error("Failed to update product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui produk",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      await backend.admin.deleteProduct({ productId: selectedProduct.id });
      
      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
      });
      
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus produk",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await backend.admin.toggleProduct({
        productId: product.id,
        isActive: !product.isActive,
      });
      
      toast({
        title: "Berhasil",
        description: `Produk ${!product.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      
      loadProducts();
    } catch (error: any) {
      console.error("Failed to toggle product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status produk",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await backend.admin.toggleFeatured({
        productId: product.id,
        isFeatured: !product.isFeatured,
      });
      
      toast({
        title: "Berhasil",
        description: `Produk ${!product.isFeatured ? 'ditandai' : 'dihapus dari'} produk unggulan`,
      });
      
      loadProducts();
    } catch (error: any) {
      console.error("Failed to toggle featured:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status unggulan",
        variant: "destructive",
      });
    }
  };

  const handleToggleServerId = async (product: Product) => {
    try {
      await backend.admin.toggleServerIdRequirement({
        productId: product.id,
        requiresServerId: !product.requiresServerId,
      });
      
      toast({
        title: "Berhasil",
        description: `Produk ${product.requiresServerId ? 'tidak membutuhkan' : 'membutuhkan'} Server ID`,
      });
      
      loadProducts();
    } catch (error: any) {
      console.error("Failed to toggle server ID:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah kebutuhan Server ID",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Produk</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Kelola produk game</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Tambah</span> Produk
            </Button>
          )}
          <Button
            onClick={loadProducts}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white text-sm"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari nama game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-white text-base md:text-lg">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              {searchQuery ? "Tidak ada produk yang cocok dengan pencarian" : "Tidak ada produk"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400 text-xs md:text-sm">Icon</TableHead>
                    <TableHead className="text-slate-400 text-xs md:text-sm">Nama</TableHead>
                    <TableHead className="text-slate-400 text-xs md:text-sm">Status</TableHead>
                    <TableHead className="text-slate-400 text-xs md:text-sm hidden md:table-cell">Unggulan</TableHead>
                    <TableHead className="text-slate-400 text-xs md:text-sm hidden lg:table-cell">Perlu Server ID</TableHead>
                    <TableHead className="text-slate-400 text-xs md:text-sm text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell>
                        {product.iconUrl ? (
                          <img
                            src={product.iconUrl}
                            alt={product.name}
                            className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 md:h-12 md:w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Gamepad2 className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white font-medium text-xs md:text-sm max-w-[150px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggleActive(product)}
                          />
                        ) : (
                          <Badge
                            className={
                              product.isActive
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }
                          >
                            {product.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={product.isFeatured}
                            onCheckedChange={() => handleToggleFeatured(product)}
                          />
                        ) : (
                          <Badge
                            className={
                              product.isFeatured
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-slate-500/20 text-slate-400"
                            }
                          >
                            {product.isFeatured ? "★" : "-"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={product.requiresServerId ?? true}
                            onCheckedChange={() => handleToggleServerId(product)}
                          />
                        ) : (
                          <Badge
                            className={
                              product.requiresServerId
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-500/20 text-slate-400"
                            }
                          >
                            {product.requiresServerId ? "Ya" : "Tidak"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-700 text-blue-400 hover:bg-blue-900/20"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-700 text-red-400 hover:bg-red-900/20"
                              onClick={() => handleDelete(product)}
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tambahkan produk game baru ke sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Mobile Legends"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-300">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white font-mono"
                placeholder="mobile-legends"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-300">Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="MOBA" className="text-white hover:bg-slate-800">MOBA</SelectItem>
                  <SelectItem value="Battle Royale" className="text-white hover:bg-slate-800">Battle Royale</SelectItem>
                  <SelectItem value="RPG" className="text-white hover:bg-slate-800">RPG</SelectItem>
                  <SelectItem value="Sports" className="text-white hover:bg-slate-800">Sports</SelectItem>
                  <SelectItem value="Card Game" className="text-white hover:bg-slate-800">Card Game</SelectItem>
                  <SelectItem value="Strategy" className="text-white hover:bg-slate-800">Strategy</SelectItem>
                  <SelectItem value="Other" className="text-white hover:bg-slate-800">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iconUrl" className="text-slate-300">Icon Produk</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploadingIcon}
                  />
                </div>
                <div className="text-xs text-slate-400">atau masukkan URL icon:</div>
                <Input
                  id="iconUrl"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="https://example.com/icon.png"
                  disabled={uploadingIcon}
                />
                {uploadingIcon && (
                  <div className="text-sm text-blue-400">Mengupload...</div>
                )}
                {formData.iconUrl && (
                  <div className="mt-2">
                    <img src={formData.iconUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border-2 border-slate-700" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Deskripsi produk"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
              onClick={() => setCreateDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={submitCreate}
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription className="text-slate-400">
              Perbarui informasi produk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-slate-300">Nama Produk *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug" className="text-slate-300">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-slate-300">Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="MOBA" className="text-white hover:bg-slate-800">MOBA</SelectItem>
                  <SelectItem value="Battle Royale" className="text-white hover:bg-slate-800">Battle Royale</SelectItem>
                  <SelectItem value="RPG" className="text-white hover:bg-slate-800">RPG</SelectItem>
                  <SelectItem value="Sports" className="text-white hover:bg-slate-800">Sports</SelectItem>
                  <SelectItem value="Card Game" className="text-white hover:bg-slate-800">Card Game</SelectItem>
                  <SelectItem value="Strategy" className="text-white hover:bg-slate-800">Strategy</SelectItem>
                  <SelectItem value="Other" className="text-white hover:bg-slate-800">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-iconUrl" className="text-slate-300">Icon Produk</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="bg-slate-800 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploadingIcon}
                  />
                </div>
                <div className="text-xs text-slate-400">atau masukkan URL icon:</div>
                <Input
                  id="edit-iconUrl"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="https://example.com/icon.png"
                  disabled={uploadingIcon}
                />
                {uploadingIcon && (
                  <div className="text-sm text-blue-400">Mengupload...</div>
                )}
                {formData.iconUrl && (
                  <div className="mt-2">
                    <img src={formData.iconUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border-2 border-slate-700" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-slate-300">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-slate-300">Status</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="active" className="text-white hover:bg-slate-800">Aktif</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-slate-800">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={submitEdit}
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription className="text-slate-400">
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                {selectedProduct.iconUrl ? (
                  <img
                    src={selectedProduct.iconUrl}
                    alt={selectedProduct.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-purple-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{selectedProduct.name}</p>
                  <p className="text-slate-400 text-sm">{selectedProduct.slug}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={submitDelete}
              disabled={submitting}
            >
              {submitting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
