import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Receipt, LogOut, Users, MessageSquare, Gift, Menu, X, MessageCircle, Home, RefreshCw, FileText, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackend } from "@/lib/useBackend";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      const adminStatus = sessionStorage.getItem("isAdmin") === "true";
      
      if (!isLoggedIn) {
        setIsChecking(false);
        setIsAdmin(false);
        navigate("/404", { replace: true });
        return;
      }

      setIsAdmin(adminStatus);
      setIsChecking(false);

      if (!adminStatus) {
        navigate("/404", { replace: true });
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/messages", icon: MessageSquare, label: "Pesan" },
    { path: "/admin/whatsapp-cs", icon: MessageCircle, label: "WhatsApp CS" },
    { path: "/admin/transactions", icon: Receipt, label: "Transaksi" },
    { path: "/admin/products", icon: ShoppingBag, label: "Produk" },
    { path: "/admin/packages", icon: Package, label: "Paket" },
    { path: "/admin/vouchers", icon: Gift, label: "Voucher" },
    { path: "/admin/users", icon: Users, label: "Pengguna" },
    { path: "/admin/validation-games", icon: CheckCircle, label: "Validasi User ID" },
    { path: "/admin/login-history", icon: Shield, label: "Login History" },
    { path: "/admin/audit-logs", icon: FileText, label: "Audit Logs" },
    { path: "/admin/security-alerts", icon: AlertTriangle, label: "Security Alerts" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        <aside className={`
          fixed inset-y-0 left-0 z-50
          w-64 border-r border-slate-800 bg-slate-900
          transform transition-transform duration-300 ease-in-out
          ${(mobileMenuOpen || sidebarOpen) ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 lg:p-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs lg:text-sm text-slate-400 mt-1">TopUpHub</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => {
                  setMobileMenuOpen(false);
                  setSidebarOpen(false);
                }}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-sm lg:text-base">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-64 p-3 border-t border-slate-800">
            <Link to="/voucher" onClick={() => {
              setMobileMenuOpen(false);
              setSidebarOpen(false);
            }}>
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                <Home className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                <span className="text-sm lg:text-base">Halaman Utama</span>
              </Button>
            </Link>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto w-full">
          <div className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => {
                setMobileMenuOpen(true);
                setSidebarOpen(true);
              }}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h2 className="text-white font-semibold">Admin Panel</h2>
            <div className="w-10"></div>
          </div>
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
