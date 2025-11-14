import { useEffect, useState, useRef } from "react";
import backend from "./backend";

export interface NotificationData {
  type: "transaction" | "message";
  data: {
    transactionId?: string;
    userId?: string;
    productName?: string;
    amount?: number;
    status?: string;
    messageId?: string;
    name?: string;
    email?: string;
    subject?: string;
    timestamp: Date;
  };
}

export function useNotifications(enabled: boolean = false) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const streamRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isCancelled = false;

    const connect = async () => {
      if (isCancelled) return;

      try {
        console.log("🔌 Connecting to notification stream...");
        const stream = await backend.notification.notifications();
        
        if (isCancelled) {
          return;
        }

        streamRef.current = stream;
        setIsConnected(true);
        console.log("✅ Connected to notification stream");

        for await (const message of stream) {
          if (isCancelled) break;
          
          if (message.type === "transaction" && "transactionId" in message.data && message.data.transactionId === "connected") {
            continue;
          }

          console.log("📬 New notification:", message);
          setNotifications((prev) => [message as NotificationData, ...prev].slice(0, 50));
        }
      } catch (error) {
        console.error("❌ Notification stream error:", error);
        setIsConnected(false);
        
        if (!isCancelled) {
          console.log("⏳ Will retry connection in 10 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Reconnecting to notification stream...");
            connect();
          }, 10000);
        }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    clearNotifications,
  };
}
