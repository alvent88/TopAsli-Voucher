import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useBackend } from "@/lib/useBackend";
import { useIdleLogout } from "@/lib/useIdleLogout";
import { Toaster } from "@/components/ui/toaster";
import { RedeemVoucherFAB } from "@/components/RedeemVoucherFAB";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import VoucherPage from "./pages/VoucherPage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import TransactionPage from "./pages/TransactionPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import RedeemVoucherPage from "./pages/RedeemVoucherPage";
import HowToRedeemPage from "./pages/HowToRedeemPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import PurchaseConfirmationPage from "./pages/PurchaseConfirmationPage";
import PurchaseInquiryPage from "./pages/PurchaseInquiryPage";
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
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminLoginHistory from "./pages/admin/AdminLoginHistory";
import AdminValidationGames from "./pages/admin/AdminValidationGames";
import AdminSecurityAlerts from "./pages/admin/AdminSecurityAlerts";

function AppInner() {
  useIdleLogout();
  
  return (
    <>
      <RedeemVoucherFAB />
      <Routes>
          <Route path="/" element={<CompanyProfilePage />} />
          <Route path="/voucher" element={<VoucherPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/redeem-voucher" element={<RedeemVoucherPage />} />
          <Route path="/how-to-redeem" element={<HowToRedeemPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/purchase-inquiry" element={<PurchaseInquiryPage />} />
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
            <Route path="validation-games" element={<AdminValidationGames />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="login-history" element={<AdminLoginHistory />} />
            <Route path="security-alerts" element={<AdminSecurityAlerts />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <div style={{ 
      backgroundColor: '#F4F8FB', 
      minHeight: '100vh',
      '--color-background': '#F4F8FB',
      '--color-card': '#FFFFFF',
      '--color-accent': '#3B82F6',
      '--color-primary': '#3B82F6',
      '--color-primary-foreground': '#FFFFFF',
      '--color-secondary': '#D9E4EC',
      '--color-secondary-foreground': '#0F1B2B',
    } as React.CSSProperties}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </div>
  );
}
