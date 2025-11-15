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
        // Add timestamp to prevent caching
        const status = await backend.admin.checkSetupStatus();
        
        if (location.pathname === "/setup" && !status.needsSetup) {
          navigate("/");
          return;
        }

        if (status.needsSetup && location.pathname !== "/setup") {
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
