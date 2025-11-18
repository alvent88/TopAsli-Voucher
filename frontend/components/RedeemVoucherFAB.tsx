import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RedeemVoucherFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hiddenPaths = ['/redeem-voucher', '/login', '/register', '/admin'];
    const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
    setIsVisible(!shouldHide);
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <Button
      onClick={() => navigate('/redeem-voucher')}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
      aria-label="Redeem Voucher"
    >
      <Ticket className="h-6 w-6" />
      <span className="hidden group-hover:inline-block font-semibold">
        Redeem Voucher
      </span>
    </Button>
  );
}
