import { useState, useEffect, useMemo } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Filter, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface AuditLog {
  id: number;
  adminId: string;
  adminEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const actionTypeColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-700 dark:text-green-400",
  UPDATE: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
  ACTIVATE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DEACTIVATE: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  PROMOTE: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  BAN: "bg-red-500/10 text-red-700 dark:text-red-400",
  UNBAN: "bg-green-500/10 text-green-700 dark:text-green-400",
  EXPORT: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  SYNC: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  TOGGLE: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  UPLOAD: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

const entityTypeColors: Record<string, string> = {
  USER: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  VOUCHER: "bg-green-500/10 text-green-700 dark:text-green-400",
  PRODUCT: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  PACKAGE: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  CONFIG: "bg-red-500/10 text-red-700 dark:text-red-400",
  TRANSACTION: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  WHATSAPP_CS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ADMIN: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

export default function AdminAuditLogs() {
  const authenticatedBackend = backend;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [adminIdFilter, setAdminIdFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await authenticatedBackend.audit.list({
          limit,
          offset: page * limit,
          actionType: actionTypeFilter === "all" ? undefined : actionTypeFilter,
          entityType: entityTypeFilter === "all" ? undefined : entityTypeFilter,
          adminId: adminIdFilter || undefined,
        });

        setLogs(response.logs);
        setTotal(response.total);
      } catch (err: any) {
        console.error("Failed to load audit logs:", err);
        setError(err.message || "Gagal memuat audit logs");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [page, actionTypeFilter, entityTypeFilter, adminIdFilter, authenticatedBackend, limit]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / limit);

  const handleResetFilters = () => {
    setActionTypeFilter("all");
    setEntityTypeFilter("all");
    setAdminIdFilter("");
    setPage(0);
  };

  const handleDownloadLogs = async () => {
    try {
      const response = await authenticatedBackend.audit.exportLogs({
        actionType: actionTypeFilter === "all" ? undefined : actionTypeFilter,
        entityType: entityTypeFilter === "all" ? undefined : entityTypeFilter,
        adminId: adminIdFilter || undefined,
      });

      const binaryString = atob(response.xlsx);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download audit logs:", err);
      setError(err.message || "Gagal mendownload audit logs");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Track all admin actions and system changes
          </p>
        </div>
        <Button onClick={handleDownloadLogs} className="gap-2">
          <Download className="w-4 h-4" />
          Download XLSX
        </Button>
      </div>

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
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="ACTIVATE">Activate</SelectItem>
                  <SelectItem value="DEACTIVATE">Deactivate</SelectItem>
                  <SelectItem value="PROMOTE">Promote</SelectItem>
                  <SelectItem value="BAN">Ban</SelectItem>
                  <SelectItem value="UNBAN">Unban</SelectItem>
                  <SelectItem value="TOGGLE">Toggle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="VOUCHER">Voucher</SelectItem>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="PACKAGE">Package</SelectItem>
                  <SelectItem value="CONFIG">Config</SelectItem>
                  <SelectItem value="TRANSACTION">Transaction</SelectItem>
                  <SelectItem value="WHATSAPP_CS">WhatsApp CS</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Admin Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={adminIdFilter}
                  onChange={(e) => setAdminIdFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
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
          <CardTitle>Audit Log Entries ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.adminEmail || log.adminId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={actionTypeColors[log.actionType] || ""}
                          >
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={entityTypeColors[log.entityType] || ""}
                          >
                            {log.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.entityId || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            View
                          </Button>
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

      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-background border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Audit Log Details</h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                <div className="font-mono">{formatDate(selectedLog.createdAt)}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Admin</div>
                <div className="font-mono">{selectedLog.adminEmail || selectedLog.adminId}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Action Type</div>
                  <Badge className={actionTypeColors[selectedLog.actionType] || ""}>
                    {selectedLog.actionType}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Entity Type</div>
                  <Badge className={entityTypeColors[selectedLog.entityType] || ""}>
                    {selectedLog.entityType}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Entity ID</div>
                <div className="font-mono text-sm">{selectedLog.entityId || "-"}</div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Old Values</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">New Values</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Metadata</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">IP Address</div>
                  <div className="font-mono text-sm">{selectedLog.ipAddress || "-"}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">User Agent</div>
                  <div className="font-mono text-xs truncate" title={selectedLog.userAgent || ""}>
                    {selectedLog.userAgent || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={() => setSelectedLog(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
