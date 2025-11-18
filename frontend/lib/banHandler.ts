export function handleBannedError(error: any, navigate: (path: string) => void, toast: (options: any) => void) {
  if (error?.code === "permission_denied" && error?.message?.includes("banned")) {
    sessionStorage.clear();
    toast({
      title: "Akun Dibanned",
      description: error.message,
      variant: "destructive",
    });
    setTimeout(() => {
      navigate("/login");
    }, 2000);
    return true;
  }
  return false;
}
