import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, useUser, useClerk } from "@clerk/clerk-react";
import { useBackend } from "@/lib/useBackend";
import { useIdleLogout } from "@/lib/useIdleLogout";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import TransactionPage from "./pages/TransactionPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import RedeemVoucherPage from "./pages/RedeemVoucherPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import PurchaseConfirmationPage from "./pages/PurchaseConfirmationPage";
import TransactionSuccessPage from "./pages/TransactionSuccessPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminVouchers from "./pages/admin/AdminVouchers";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminWhatsAppCS from "./pages/admin/AdminWhatsAppCS";
import AdminUniPlaySync from "./pages/admin/AdminUniPlaySync";

const PUBLISHABLE_KEY = "pk_test_aGVscGluZy1rYW5nYXJvby03Ny5jbGVyay5hY2NvdW50cy5kZXYk";

function BanChecker() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const backend = useBackend();

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!isLoaded || !user) return;

      const email = user.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const banCheckKey = `ban_checked_${email}`;
      if (sessionStorage.getItem(banCheckKey)) {
        return;
      }

      try {
        await backend.auth.checkUser({ identifier: email });
      } catch (error: any) {
        if (error.message?.includes("dibanned")) {
          sessionStorage.setItem(banCheckKey, "true");
          await signOut();
          window.location.href = "/";
        }
      }
    };

    checkBanStatus();
    const interval = setInterval(checkBanStatus, 10000);

    return () => clearInterval(interval);
  }, [isLoaded, user, backend, signOut]);

  return null;
}

function AppInner() {
  useIdleLogout();
  
  return (
    <>
      <BanChecker />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/redeem-voucher" element={<RedeemVoucherPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/purchase-confirmation" element={<PurchaseConfirmationPage />} />
          <Route path="/transaction-success" element={<TransactionSuccessPage />} />
          <Route path="/transaction/:id" element={<TransactionPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="uniplay-sync" element={<AdminUniPlaySync />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="whatsapp-cs" element={<AdminWhatsAppCS />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppInner />
    </ClerkProvider>
  );
}
