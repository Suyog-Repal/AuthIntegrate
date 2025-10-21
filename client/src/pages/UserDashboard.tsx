import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogsTable } from "@/components/LogsTable";
import { useAuth } from "@/contexts/AuthContext";
import type { SystemStats, AccessLogWithUser } from "@shared/schema";
import { Activity, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function UserDashboard() {
  const { user } = useAuth();
  const [hardwareConnected, setHardwareConnected] = useState(false);

  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<AccessLogWithUser[]>({
    queryKey: ["/api/logs/user", user?.id],
    enabled: !!user,
  });

  useEffect(() => {
    if (stats) {
      setHardwareConnected(stats.hardwareConnected);
    }
  }, [stats]);

  const userLogs = logs.filter((log) => log.userId === user?.id);
  const grantedCount = userLogs.filter((log) => log.result === "GRANTED").length;
  const deniedCount = userLogs.filter((log) => log.result === "DENIED").length;

  return (
    <div className="min-h-screen bg-background">
      <Header hardwareConnected={hardwareConnected} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View your access history and account details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="stat-card-total">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Access</p>
                  <p className="text-3xl font-bold text-foreground">{userLogs.length}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-granted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Granted</p>
                  <p className="text-3xl font-bold text-foreground">{grantedCount}</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-denied">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Denied</p>
                  <p className="text-3xl font-bold text-foreground">{deniedCount}</p>
                </div>
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Access History</CardTitle>
            <CardDescription>Your recent access attempts and events</CardDescription>
          </CardHeader>
          <CardContent>
            <LogsTable logs={userLogs} isLoading={logsLoading} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
