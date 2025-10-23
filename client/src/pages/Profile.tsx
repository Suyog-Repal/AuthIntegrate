import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Fingerprint, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { SystemStats } from "@shared/schema";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [hardwareConnected, setHardwareConnected] = useState(false);
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/api/stats"],
  });

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
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* === Change: Added Full Name display === */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold mt-1">{user?.profile?.name || "N/A"}</p>
                </div>
              </div>
              {/* === Change: Dedicated card for Hardware ID === */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-lg font-bold">#</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Hardware User ID</p>
                  <p className="text-lg font-mono font-semibold mt-1">{user?.id}</p>
                </div>
              </div>
              {/* =============================================== */}
              
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Fingerprint ID</p>
                  <p className="text-lg font-mono font-semibold mt-1">{user?.fingerId}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold mt-1">{user?.profile?.email}</p>
                </div>
              </div>
              {user?.profile?.mobile && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <p className="text-lg font-semibold mt-1">{user.profile.mobile}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold mt-1">
                    {user?.createdAt && format(new Date(user.createdAt), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Role</p>
                <Badge
                  variant={user?.profile?.role === "admin" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {user?.profile?.role || "user"}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}