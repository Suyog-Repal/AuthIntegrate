// client/src/pages/AdminDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { LiveStatus } from "@/components/LiveStatus";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { UserTable } from "@/components/UserTable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SystemStats,
  UserWithProfile,
  AccessLogWithUser,
} from "@shared/schema";
import { useEffect, useState, useRef, useCallback } from "react"; 
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext"; 

export default function AdminDashboard() {
  const { isAdmin } = useAuth(); 

  const [hardwareConnected, setHardwareConnected] = useState(false);
  
  const [liveLogs, setLiveLogs] = useState<AccessLogWithUser[]>(() => {
    try {
      const savedLogs = localStorage.getItem('liveAccessLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch {
      return [];
    }
  });
  
  // Refs for stable access to latest props/state
  const usersRef = useRef<UserWithProfile[]>([]); 
  
  // Fetch queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
    enabled: isAdmin,
   });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery<AccessLogWithUser[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 3000,
    enabled: isAdmin,
  });

  // Memoize the entire refetch logic to make it stable
  const refetchGroup = useCallback(() => {
    refetchStats();
    refetchLogs();
    refetchUsers();
  }, [refetchStats, refetchLogs, refetchUsers]); 


  // Update the users ref whenever users data changes
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  
  // Persist liveLogs to local storage whenever it changes.
  useEffect(() => {
    localStorage.setItem('liveAccessLogs', JSON.stringify(liveLogs));
  }, [liveLogs]);

  // Fix "User: Unknown" for old logs by ensuring liveLogs are enriched using the current users data.
  useEffect(() => {
    if (users.length > 0) {
        setLiveLogs(prevLogs => {
            let changed = false;
            const newLogs = prevLogs.map(log => {
                // Check if name is missing (Unknown) but userId exists
                if ((log.name === 'Unknown' || !log.name) && log.userId) {
                    const matchedUser = users.find(u => u.id === log.userId)?.profile;
                    if (matchedUser) {
                        changed = true;
                        return { ...log, name: matchedUser.name, email: matchedUser.email };
                    }
                }
                return log;
            });
            return changed ? newLogs : prevLogs; 
        });
    }
  }, [users]);


  // WebSocket connection: Stable logic is already in place
  useEffect(() => {
    if (!isAdmin) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected successfully.");
      setHardwareConnected(true); 
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "access_log") {
          
          refetchGroup(); 
          
          setLiveLogs((prev) => {
              const newLog = data.log as AccessLogWithUser;
              if (prev.some(log => log.id === newLog.id)) return prev;
              
              const matchedUser = usersRef.current.find(u => u.id === newLog.userId)?.profile;
              const enrichedLog = matchedUser 
                ? { ...newLog, name: matchedUser.name, email: matchedUser.email }
                : newLog;

              return [enrichedLog, ...prev].slice(0, 20);
          });
        } else if (data.type === "hardware_status") {
          setHardwareConnected(data.connected);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };
    
    ws.onerror = () => setHardwareConnected(false);
    ws.onclose = (event) => {
        if (event.code !== 1000) { 
            console.log("WebSocket closed unexpectedly. Check server or network.");
        }
        setHardwareConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmount"); 
      }
    };
  }, [isAdmin, refetchGroup]); 


  // Sync hardware connection from stats
  useEffect(() => {
    if (stats) {
      setHardwareConnected(stats.hardwareConnected);
    }
  }, [stats]);

  // Combine and de-duplicate logs robustly for accurate display and analytics
  const allLogs = [
    ...liveLogs, 
    ...logs 
  ].filter(
    (log, index, self) => index === self.findIndex((l) => l.id === log.id)
  )
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
  .slice(0, 50); 

  // Safe, accurate success rate calculator
  const calculateSuccessRate = () => {
    const granted = Number(stats?.accessGrantedToday) || 0;
    const denied = Number(stats?.accessDeniedToday) || 0;
    const attempts = granted + denied;
    if (attempts === 0) return 0;
    return Math.round((granted / attempts) * 100);
  };
  const successRate = calculateSuccessRate();

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
        
        <StatsCards key={stats?.totalAccessLogs} stats={stats} isLoading={statsLoading} />
        {/* 🔥 LAYOUT FIX: Replaced incorrect classes with standard grid classes for 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
          <div className="lg:col-span-2">
            <LiveStatus
              logs={allLogs.slice(0, 10)} 
              isConnected={hardwareConnected}
            />
          </div>
          {/* This card now naturally occupies the remaining column */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SUCCESS RATE SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">
                    {stats ? `${successRate}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
              {/* ACTIVE USERS */}
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-medium">{stats?.totalUsers || 0}</span>
                </div>
              </div>
              {/* TOTAL EVENTS */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-medium">{stats?.totalAccessLogs || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* TABS SECTION */}
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
                <CardDescription>
                  Manage registered users and their access
                </CardDescription>
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
