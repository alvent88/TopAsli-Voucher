import { useState, useEffect } from "react";
import { useBackend } from "@/lib/useBackend";
import { usePermissions } from "@/lib/usePermissions";
import type { Package } from "~backend/pkg/list";
import type { Product } from "~backend/product/list";
import { RefreshCw, Plus, Pencil, Trash2, Package2, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPackages() {
  const backend = useBackend();
  const [packages, setPackages] = useState<Package[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: 0,
    name: "",
    amount: 0,
    unit: "Diamond",
    price: 0,
    discountPrice: 0,
    isActive: true,
    uniplayEntitasId: "",
    uniplayDenomId: "",
  });

  useEffect(() => {
    loadData();
    loadGlobalDiscount();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, productsData] = await Promise.all([
        backend.admin.listAllPackages(),
        backend.admin.listAllProducts(),
      ]);
      setPackages(packagesData.packages);
      setProducts(productsData.products);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data paket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalDiscount = async () => {
    try {
      const { discount } = await backend.admin.getGlobalDiscount();
      setGlobalDiscount(discount);
    } catch (error) {
      console.error("Failed to load global discount:", error);
    }
  };

  const saveGlobalDiscount = async () => {
    try {
      await backend.admin.saveGlobalDiscount({ discount: globalDiscount });
      toast({
        title: "Berhasil",
        description: "Diskon global berhasil disimpan",
      });
    } catch (error: any) {
      console.error("Failed to save global discount:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan diskon global",
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

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (globalDiscount <= 0) return originalPrice;
    return originalPrice - (originalPrice * globalDiscount / 100);
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || "Unknown";
  };

  const filteredPackages = packages.filter((pkg) => {
    const productName = getProductName(pkg.productId).toLowerCase();
    const packageName = pkg.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return productName.includes(query) || packageName.includes(query);
  });

  const resetForm = () => {
    setFormData({
      productId: products[0]?.id || 0,
      name: "",
      amount: 0,
      unit: "Diamond",
      price: 0,
      discountPrice: 0,
      isActive: true,
      uniplayEntitasId: "",
      uniplayDenomId: "",
    });
  };

  const handleCreate = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      productId: pkg.productId,
      name: pkg.name,
      amount: pkg.amount,
      unit: pkg.unit,
      price: pkg.price,
      discountPrice: pkg.discountPrice || 0,
      isActive: pkg.isActive,
      uniplayEntitasId: (pkg as any).uniplayEntitasId || "",
      uniplayDenomId: (pkg as any).uniplayDenomId || "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    setSelectedPackage(pkg);
    setDeleteDialogOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.name || !formData.productId || !formData.amount || !formData.unit || !formData.price) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await backend.admin.createPackage({
        productId: formData.productId,
        name: formData.name,
        amount: formData.amount,
        unit: formData.unit,
        price: formData.price,
        discountPrice: formData.discountPrice > 0 ? formData.discountPrice : undefined,
        uniplayEntitasId: formData.uniplayEntitasId || undefined,
        uniplayDenomId: formData.uniplayDenomId || undefined,
      });
      
      toast({
        title: "Berhasil",
        description: "Paket berhasil ditambahkan",
      });
      
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Failed to create package:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan paket",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedPackage) return;

    setSubmitting(true);
    try {
      await backend.admin.updatePackage({
        packageId: selectedPackage.id,
        productId: formData.productId,
        name: formData.name,
        amount: formData.amount,
        unit: formData.unit,
        price: formData.price,
        discountPrice: formData.discountPrice > 0 ? formData.discountPrice : undefined,
        isActive: formData.isActive,
        uniplayEntitasId: formData.uniplayEntitasId || undefined,
        uniplayDenomId: formData.uniplayDenomId || undefined,
      });
      
      toast({
        title: "Berhasil",
        description: "Paket berhasil diperbarui",
      });
      
      setEditDialogOpen(false);
      setSelectedPackage(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Failed to update package:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui paket",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedPackage) return;

    setSubmitting(true);
    try {
      await backend.admin.deletePackage({ packageId: selectedPackage.id });
      
      toast({
        title: "Berhasil",
        description: "Paket berhasil dihapus",
      });
      
      setDeleteDialogOpen(false);
      setSelectedPackage(null);
      loadData();
    } catch (error: any) {
      console.error("Failed to delete package:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus paket",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    try {
      await backend.admin.togglePackage({
        packageId: pkg.id,
        isActive: !pkg.isActive,
      });
      
      toast({
        title: "Berhasil",
        description: `Paket ${!pkg.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      
      loadData();
    } catch (error: any) {
      console.error("Failed to toggle package:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status paket",
        variant: "destructive",
      });
    }
  };

  const handleToggleSpecialItem = async (pkg: Package) => {
    try {
      await backend.admin.toggleSpecialItem({
        packageId: pkg.id,
        isSpecialItem: !pkg.isSpecialItem,
      });
      
      toast({
        title: "Berhasil",
        description: `Paket ${!pkg.isSpecialItem ? 'ditandai sebagai' : 'dihapus dari'} Special Item`,
      });
      
      loadData();
    } catch (error: any) {
      console.error("Failed to toggle special item:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status special item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Paket</h1>
          <p className="text-slate-400 mt-1">Kelola paket top-up</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Paket
            </Button>
          )}
          <Button
            onClick={loadData}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Cari nama paket atau game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>

      {canEdit && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Diskon Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="global-discount" className="text-slate-300">Persentase Diskon (%)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="global-discount"
                    type="number"
                    min="0"
                    max="100"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    onClick={saveGlobalDiscount}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    Simpan
                  </Button>
                </div>
              </div>
              <div className="text-slate-400 text-sm">
                <p>Diskon akan diterapkan ke semua harga paket</p>
                <p className="text-xs mt-1">Contoh: 10% dari Rp 100.000 = Rp 90.000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Daftar Paket</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              {searchQuery ? "Tidak ada paket yang cocok dengan pencarian" : "Tidak ada paket"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Produk</TableHead>
                    <TableHead className="text-slate-400">Nama Paket</TableHead>
                    <TableHead className="text-slate-400">Harga Asli</TableHead>
                    <TableHead className="text-slate-400">Harga Setelah Diskon</TableHead>
                    <TableHead className="text-slate-400">Special Item</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">
                        {getProductName(pkg.productId)}
                      </TableCell>
                      <TableCell className="text-slate-300">{pkg.name}</TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(pkg.price)}
                      </TableCell>
                      <TableCell className="text-green-300 font-medium">
                        {pkg.discountPrice && pkg.discountPrice < pkg.price 
                          ? formatCurrency(pkg.discountPrice)
                          : formatCurrency(calculateDiscountedPrice(pkg.price))
                        }
                        {!pkg.discountPrice && globalDiscount > 0 && (
                          <span className="ml-2 text-xs text-red-400">(-{globalDiscount}%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={pkg.isSpecialItem}
                            onCheckedChange={() => handleToggleSpecialItem(pkg)}
                          />
                        ) : (
                          <Badge
                            className={
                              pkg.isSpecialItem
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-slate-500/20 text-slate-300"
                            }
                          >
                            {pkg.isSpecialItem ? "Special" : "Normal"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={pkg.isActive}
                            onCheckedChange={() => handleToggleActive(pkg)}
                          />
                        ) : (
                          <Badge
                            className={
                              pkg.isActive
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }
                          >
                            {pkg.isActive ? "Aktif" : "Nonaktif"}
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
                              onClick={() => handleEdit(pkg)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-700 text-red-400 hover:bg-red-900/20"
                              onClick={() => handleDelete(pkg)}
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
            <DialogTitle>Tambah Paket Baru</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tambahkan paket top-up baru untuk produk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productId" className="text-slate-300">Produk *</Label>
              <Select value={formData.productId.toString()} onValueChange={(value) => setFormData({ ...formData, productId: parseInt(value) })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()} className="text-white hover:bg-slate-800">
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Nama Paket *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="100 Diamond"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">Jumlah *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-slate-300">Unit *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Diamond"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-300">Harga *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice" className="text-slate-300">Harga Diskon</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="45000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uniplayEntitasId" className="text-slate-300">UniPlay Entitas ID</Label>
                <Input
                  id="uniplayEntitasId"
                  value={formData.uniplayEntitasId}
                  onChange={(e) => setFormData({ ...formData, uniplayEntitasId: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Dari inquiry-dtu atau inquiry-voucher"
                />
                <p className="text-xs text-slate-500">ID produk dari UniPlay API</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniplayDenomId" className="text-slate-300">UniPlay Denom ID</Label>
                <Input
                  id="uniplayDenomId"
                  value={formData.uniplayDenomId}
                  onChange={(e) => setFormData({ ...formData, uniplayDenomId: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Dari denom list UniPlay"
                />
                <p className="text-xs text-slate-500">ID denominasi dari UniPlay API</p>
              </div>
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
            <DialogTitle>Edit Paket</DialogTitle>
            <DialogDescription className="text-slate-400">
              Perbarui informasi paket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-productId" className="text-slate-300">Produk *</Label>
              <Select value={formData.productId.toString()} onValueChange={(value) => setFormData({ ...formData, productId: parseInt(value) })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()} className="text-white hover:bg-slate-800">
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-slate-300">Nama Paket *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-slate-300">Jumlah *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit" className="text-slate-300">Unit *</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-slate-300">Harga *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discountPrice" className="text-slate-300">Harga Diskon</Label>
                <Input
                  id="edit-discountPrice"
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-uniplayEntitasId" className="text-slate-300">UniPlay Entitas ID</Label>
                <Input
                  id="edit-uniplayEntitasId"
                  value={formData.uniplayEntitasId}
                  onChange={(e) => setFormData({ ...formData, uniplayEntitasId: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Dari inquiry-dtu atau inquiry-voucher"
                />
                <p className="text-xs text-slate-500">ID produk dari UniPlay API</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-uniplayDenomId" className="text-slate-300">UniPlay Denom ID</Label>
                <Input
                  id="edit-uniplayDenomId"
                  value={formData.uniplayDenomId}
                  onChange={(e) => setFormData({ ...formData, uniplayDenomId: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Dari denom list UniPlay"
                />
                <p className="text-xs text-slate-500">ID denominasi dari UniPlay API</p>
              </div>
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
            <DialogTitle>Hapus Paket</DialogTitle>
            <DialogDescription className="text-slate-400">
              Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Package2 className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedPackage.name}</p>
                  <p className="text-slate-400 text-sm">
                    {getProductName(selectedPackage.productId)} • {formatCurrency(selectedPackage.price)}
                  </p>
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
