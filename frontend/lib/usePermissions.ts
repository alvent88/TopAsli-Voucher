import { useUser } from "@clerk/clerk-react";

export function usePermissions() {
  const { user } = useUser();
  
  const isSuperAdmin = (user?.publicMetadata?.isSuperAdmin as boolean) || false;
  const isAdmin = (user?.publicMetadata?.isAdmin as boolean) || false;
  
  const canEdit = isSuperAdmin;
  const canView = isSuperAdmin || isAdmin;
  
  return {
    isSuperAdmin,
    isAdmin,
    canEdit,
    canView,
  };
}
