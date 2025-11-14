export function usePermissions() {
  const userPhone = sessionStorage.getItem("userPhone") || "";
  
  const isSuperAdmin = userPhone === "62818848168";
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
