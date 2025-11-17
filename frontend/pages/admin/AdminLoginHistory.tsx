import { useState, useEffect, useMemo } from "react";
import { useBackend } from "@/lib/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Filter, Search, ChevronLeft, ChevronRight, Download, Users } from "lucide-react";

interface LoginHistoryEntry {
  id: number;
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  loginType: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginStatus: string;
  failureReason: string | null;
  createdAt: Date;
}

interface UserIPInfo {
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  loginCount: number;
  successCount: number;
  failedCount: number;
  lastLogin: Date;
  firstLogin: Date;
}

export default function AdminLoginHistory() {
  const backend = useBackend();

  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [ipFilter, setIpFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [searchIp, setSearchIp] = useState("");
  const [ipUsers, setIpUsers] = useState<UserIPInfo[]>([]);
  const [showIpSearch, setShowIpSearch] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await backend.admin.listLoginHistory({
          limit,
          offset: page * limit,
          ipAddress: ipFilter || undefined,
          userId: userIdFilter || undefined,
          loginStatus: statusFilter === "all" ? undefined : statusFilter,
        });

        setEntries(response.entries);
        setTotal(response.total);
      } catch (err: any) {
        console.error("Failed to load login history:", err);
        setError(err.message || "Gagal memuat login history");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [page, ipFilter, userIdFilter, statusFilter, limit]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / limit);

  const handleResetFilters = () => {
    setIpFilter("");
    setUserIdFilter("");
    setStatusFilter("all");
    setPage(0);
  };

  const handleSearchByIP = async () => {
    if (!searchIp.trim()) {
      setError("Masukkan IP address terlebih dahulu");
      return;
    }

    try {
      setError("");
      const response = await backend.admin.getUsersByIP({
        ipAddress: searchIp.trim(),
      });
      setIpUsers(response.users);
      setShowIpSearch(true);
    } catch (err: any) {
      console.error("Failed to search users by IP:", err);
      setError(err.message || "Gagal mencari users berdasarkan IP");
    }
  };

  const handleDownloadHistory = async () => {
    try {
      const response = await backend.admin.exportLoginHistory({
        ipAddress: ipFilter || undefined,
        userId: userIdFilter || undefined,
        loginStatus: statusFilter === "all" ? undefined : statusFilter,
      });

      const binaryString = atob(response.xlsx);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `login-history-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download login history:", err);
      setError(err.message || "Gagal mendownload login history");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Login History</h1>
          <p className="text-muted-foreground mt-2">
            Track user login attempts and detect suspicious activity
          </p>
        </div>
        <Button onClick={handleDownloadHistory} className="gap-2">
          <Download className="w-4 h-4" />
          Download XLSX
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Search Users by IP Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearchByIP}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {showIpSearch && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  Found {ipUsers.length} user(s) from IP {searchIp}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowIpSearch(false)}>
                  Close
                </Button>
              </div>

              {ipUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users found with this IP address</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Logins</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>First Login</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipUsers.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>{user.name || "-"}</TableCell>
                          <TableCell>
                            {user.phoneNumber || "-"}
                          </TableCell>
                          <TableCell>{user.loginCount}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                              {user.successCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                              {user.failedCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(user.firstLogin)}</TableCell>
                          <TableCell className="text-sm">{formatDate(user.lastLogin)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">IP Address</label>
              <Input
                placeholder="Filter by IP..."
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="Filter by Name..."
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleResetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login History Entries ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading login history...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No login history found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          {entry.name || "-"}
                        </TableCell>
                        <TableCell>
                          {entry.phoneNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.loginType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.ipAddress || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              entry.loginStatus === "success"
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            }
                          >
                            {entry.loginStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs" title={entry.userAgent || ""}>
                          {entry.userAgent || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
