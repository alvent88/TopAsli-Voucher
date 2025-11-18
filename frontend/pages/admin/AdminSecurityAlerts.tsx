import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBackend } from "@/lib/useBackend";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertTriangle, CheckCircle2, Eye, Trash2, Filter, RefreshCw } from "lucide-react";

interface SecurityAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  phoneNumber: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  newAlerts: number;
  investigating: number;
  resolved: number;
  highSeverity: number;
  criticalSeverity: number;
}

export default function AdminSecurityAlerts() {
  const navigate = useNavigate();
  const backend = useBackend();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<Stats>({
    newAlerts: 0,
    investigating: 0,
    resolved: 0,
    highSeverity: 0,
    criticalSeverity: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>("all");
  
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<"investigating" | "resolved" | "false_positive">("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await backend.admin.listSecurityAlerts({
        status: statusFilter === "all" ? undefined : statusFilter,
        severity: severityFilter === "all" ? undefined : severityFilter,
        alertType: alertTypeFilter === "all" ? undefined : alertTypeFilter,
        limit: 100,
        offset: 0,
      });
      
      setAlerts(response.alerts);
      setStats(response.stats);
      setTotal(response.total);
    } catch (error: any) {
      console.error("Failed to fetch security alerts:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat security alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, alertTypeFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600 hover:bg-red-700";
      case "high": return "bg-orange-600 hover:bg-orange-700";
      case "medium": return "bg-yellow-600 hover:bg-yellow-700";
      case "low": return "bg-blue-600 hover:bg-blue-700";
      default: return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-red-600 hover:bg-red-700";
      case "investigating": return "bg-yellow-600 hover:bg-yellow-700";
      case "resolved": return "bg-green-600 hover:bg-green-700";
      case "false_positive": return "bg-gray-600 hover:bg-gray-700";
      default: return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rate_limit_exceeded: "Rate Limit Exceeded",
      brute_force_otp: "Brute Force OTP",
      brute_force_voucher: "Brute Force Voucher",
      multiple_ip_attack: "Multiple IP Attack",
      fonnte_api_failure: "Fonnte API Failure",
      suspicious_login: "Suspicious Login",
      account_takeover_attempt: "Account Takeover",
      other: "Other",
    };
    return labels[type] || type;
  };

  const handleViewDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setShowDetailDialog(true);
  };

  const handleResolve = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setResolutionStatus("resolved");
    setResolutionNotes("");
    setShowResolveDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAlert) return;

    try {
      setUpdating(true);
      await backend.admin.updateAlertStatus({
        alertId: selectedAlert.id,
        status: resolutionStatus,
        resolutionNotes: resolutionNotes || undefined,
      });

      toast({
        title: "Berhasil",
        description: "Status alert berhasil diupdate",
      });

      setShowResolveDialog(false);
      setResolutionNotes("");
      fetchAlerts();
    } catch (error: any) {
      console.error("Failed to update alert:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alert ini? (Hanya Superadmin)")) return;

    try {
      await backend.admin.deleteAlert({ alertId });
      toast({
        title: "Berhasil",
        description: "Alert berhasil dihapus",
      });
      fetchAlerts();
    } catch (error: any) {
      console.error("Failed to delete alert:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus alert",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Alerts</h1>
            <p className="text-muted-foreground">Monitor dan kelola ancaman keamanan sistem</p>
          </div>
        </div>
        <Button onClick={fetchAlerts} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.newAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.investigating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highSeverity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalSeverity}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Alerts ({total})</CardTitle>
              <CardDescription>Daftar semua alert keamanan yang terdeteksi</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                  <SelectItem value="brute_force_otp">Brute Force OTP</SelectItem>
                  <SelectItem value="brute_force_voucher">Brute Force Voucher</SelectItem>
                  <SelectItem value="multiple_ip_attack">Multiple IP</SelectItem>
                  <SelectItem value="fonnte_api_failure">API Failure</SelectItem>
                  <SelectItem value="suspicious_login">Suspicious Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada security alerts</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-sm">{formatDate(alert.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getAlertTypeLabel(alert.alertType)}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{alert.title}</TableCell>
                    <TableCell className="text-sm">{alert.phoneNumber || "-"}</TableCell>
                    <TableCell className="text-sm font-mono">{alert.ipAddress || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(alert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.status === "new" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleResolve(alert)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedAlert.status)}>
                    {selectedAlert.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getAlertTypeLabel(selectedAlert.alertType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formatDate(selectedAlert.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{selectedAlert.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-mono text-sm">{selectedAlert.phoneNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedAlert.ipAddress || "-"}</p>
                </div>
              </div>
              
              {selectedAlert.userAgent && (
                <div>
                  <p className="text-sm text-muted-foreground">User Agent</p>
                  <p className="text-xs font-mono break-all">{selectedAlert.userAgent}</p>
                </div>
              )}
              
              {selectedAlert.metadata && (
                <div>
                  <p className="text-sm text-muted-foreground">Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedAlert.resolvedBy && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved By</p>
                      <p className="font-medium">{selectedAlert.resolvedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved At</p>
                      <p className="font-medium">{selectedAlert.resolvedAt ? formatDate(selectedAlert.resolvedAt) : "-"}</p>
                    </div>
                  </div>
                  {selectedAlert.resolutionNotes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Resolution Notes</p>
                      <p className="text-sm">{selectedAlert.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Alert Status</DialogTitle>
            <DialogDescription>
              Ubah status alert dan tambahkan catatan resolusi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={resolutionStatus} onValueChange={(v: any) => setResolutionStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Tambahkan catatan resolusi (opsional)..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
