import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, NotificationData } from "@/lib/useNotifications";

export default function NotificationBell() {
  const { notifications, isConnected, clearNotifications } = useNotifications(true);

  const unreadCount = notifications.length;

  const formatNotificationMessage = (notification: NotificationData) => {
    if (notification.type === "transaction") {
      return {
        title: "Transaksi Baru",
        description: `${notification.data.productName} - Rp ${notification.data.amount?.toLocaleString("id-ID")}`,
        timestamp: new Date(notification.data.timestamp).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } else if (notification.type === "message") {
      return {
        title: "Pesan Baru",
        description: `${notification.data.name}: ${notification.data.subject}`,
        timestamp: new Date(notification.data.timestamp).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Notifikasi</h3>
            <p className="text-xs text-slate-400">
              {isConnected ? "● Terhubung" : "○ Tidak terhubung"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-xs text-slate-400 hover:text-white"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tandai dibaca
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notification: NotificationData, index: number) => {
              const formatted = formatNotificationMessage(notification);
              if (!formatted) return null;

              return (
                <DropdownMenuItem
                  key={index}
                  className="p-3 cursor-pointer hover:bg-slate-800 border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-white text-sm">{formatted.title}</p>
                      <span className="text-xs text-slate-400">{formatted.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-400">{formatted.description}</p>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
