import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserCircle, User, History, LogOut, Shield, Ticket, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBackend } from "@/lib/useBackend";
import { useEffect, useState } from "react";

export function AuthButton() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const backend = useBackend();
  const [balance, setBalance] = useState<number | null>(null);

  const isSuperAdmin = (user?.publicMetadata?.isSuperAdmin as boolean) || false;
  const isAdmin = isSuperAdmin || (user?.publicMetadata?.isAdmin as boolean) || false;

  useEffect(() => {
    if (isSignedIn && user) {
      loadBalance();
    }
  }, [isSignedIn, user]);

  const loadBalance = async () => {
    try {
      const result = await backend.balance.getBalance();
      setBalance(result.balance);
    } catch (error) {
      console.error("Failed to load balance:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isSignedIn) {
    const fullName = user.fullName || user.firstName || "User";
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="text-white hover:text-blue-400 hover:bg-slate-800"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            {fullName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-[#1a1f3a] border-slate-700" align="end">
          <DropdownMenuLabel className="text-white">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {fullName}
              </p>
              <p className="text-xs text-slate-400">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-slate-700" />
          
          <div className="px-2 py-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-slate-300">Saldo</span>
              </div>
              <span className="text-sm font-bold text-white">
                {balance !== null ? formatCurrency(balance) : "..."}
              </span>
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-slate-700" />
          
          <DropdownMenuItem
            onClick={() => navigate("/profile")}
            className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Profil Saya
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/redeem-voucher")}
            className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <Ticket className="mr-2 h-4 w-4" />
            Redeem Voucher
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/transactions")}
            className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <History className="mr-2 h-4 w-4" />
            Riwayat Transaksi
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="text-blue-400 hover:text-blue-300 hover:bg-slate-700 cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem
            onClick={() => signOut(() => navigate("/"))}
            className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => navigate("/login")}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
    >
      <LogIn className="mr-2 h-4 w-4" />
      Masuk / Daftar
    </Button>
  );
}
