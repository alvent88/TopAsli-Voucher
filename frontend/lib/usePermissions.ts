export function usePermissions() {
  const userEmail = sessionStorage.getItem("userEmail") || "";
  
  const isSuperAdmin = userEmail === "alvent88@gmail.com";
  const isAdmin = isSuperAdmin;
  
  const canEdit = isSuperAdmin;
  const canView = isSuperAdmin || isAdmin;
  
  return {
    isSuperAdmin,
    isAdmin,
    canEdit,
    canView,
  };
}
