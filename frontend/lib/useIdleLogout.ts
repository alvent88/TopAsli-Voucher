import { useEffect, useCallback, useRef } from "react";
import { useClerk } from "@clerk/clerk-react";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export function useIdleLogout() {
  const { signOut } = useClerk();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log("User has been idle for 10 minutes. Logging out...");
      signOut();
      window.location.href = "/";
    }, IDLE_TIMEOUT);
  }, [signOut]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
}
