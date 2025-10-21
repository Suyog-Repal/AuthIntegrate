import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { LiveStatus } from "@/components/LiveStatus";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { UserTable } from "@/components/UserTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemStats, UserWithProfile, AccessLogWithUser } from "@shared/schema";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [hardwareConnected, setHardwareConnected] = useState(false);
  const [liveLogs, setLiveLogs] = useState<AccessLogWithUser[]>([]);

  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/users"],
  });

  const { data: logs = [] } = useQuery<AccessLogWithUser[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 3000,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setHardwareConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "access_log") {
          setLiveLogs((prev) => [data.log, ...prev.slice(0, 19)]);
        } else if (data.type === "hardware_status") {
          setHardwareConnected(data.connected);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = () => {
      setHardwareConnected(false);
    };

    ws.onclose = () => {
      setHardwareConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Merge live logs with fetched logs
  const allLogs = [...liveLogs, ...logs].filter(
    (log, index, self) => index === self.findIndex((l) => l.id === log.id)
  );

  useEffect(() => {
    if (stats) {
      setHardwareConnected(stats.hardwareConnected);
    }
  }, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <Header hardwareConnected={hardwareConnected} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system activity and manage users
          </p>
        </div>

        <StatsCards stats={stats} isLoading={statsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveStatus logs={allLogs.slice(0, 10)} isConnected={hardwareConnected} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">
                    {stats
                      ? `${Math.round(
                          (stats.accessGrantedToday /
                            (stats.accessGrantedToday + stats.accessDeniedToday || 1)) *
                            100
                        )}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{
                      width: stats
                        ? `${Math.round(
                            (stats.accessGrantedToday /
                              (stats.accessGrantedToday + stats.accessDeniedToday || 1)) *
                              100
                          )}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-medium">{stats?.totalUsers || 0}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-medium">{stats?.totalAccessLogs || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              Users ({users.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsCharts logs={allLogs} />
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage registered users and their access</CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable users={users} isLoading={usersLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
