import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backend from "~backend/client";

export function useSetupCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const cachedSetupStatus = localStorage.getItem("setupComplete");
        
        if (cachedSetupStatus === "true") {
          if (location.pathname === "/setup") {
            navigate("/");
          }
          setIsChecking(false);
          return;
        }
        
        const status = await backend.admin.checkSetupStatus();
        
        if (!status.needsSetup) {
          localStorage.setItem("setupComplete", "true");
          if (location.pathname === "/setup") {
            navigate("/");
          }
        } else {
          localStorage.removeItem("setupComplete");
          if (location.pathname !== "/setup") {
            navigate("/setup");
          }
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetup();
  }, [navigate, location.pathname]);

  return { isChecking };
}
