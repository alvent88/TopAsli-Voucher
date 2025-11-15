import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backend from "~backend/client";

export function useSetupCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      if (location.pathname === "/setup") {
        setIsChecking(false);
        return;
      }

      try {
        const status = await backend.admin.checkSetupStatus();
        
        if (status.needsSetup) {
          navigate("/setup");
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
