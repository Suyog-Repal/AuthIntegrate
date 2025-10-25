// client\src\components\LiveStatus.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Shield } from "lucide-react"; // Import Shield icon
import type { AccessLogWithUser } from "@shared/schema";

// NOTE: The AccessLogWithUser type is implicitly updated via shared/schema.ts
// The log object now contains: { ..., email, mobile, name, ... }

// Extend AccessLogWithUser to explicitly include the joined profile fields for certainty
interface CustomAccessLog extends AccessLogWithUser {
  email?: string;
  mobile?: string;
  name?: string; // Explicitly define the name field
}

interface LiveStatusProps {
  logs: CustomAccessLog[];
  isConnected: boolean;
}

export function LiveStatus({ logs, isConnected }: LiveStatusProps) {
  const [animateNew, setAnimateNew] = useState<number[]>([]);

  useEffect(() => {
    if (logs.length > 0) {
      const latestId = logs[0].id;
      setAnimateNew([latestId]);
      const timer = setTimeout(() => {
        setAnimateNew([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [logs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Live Access Monitor</CardTitle>
            <CardDescription>Real-time hardware authentication events</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div   
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-success animate-pulse" : "bg-destructive"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Live" : "Offline"}       
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No access events yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Events will appear here in real-time
              </p>
            </div>
          ) : (        
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border bg-card transition-all ${
                    animateNew.includes(log.id)  
                      ? "ring-2 ring-primary animate-in fade-in slide-in-from-top-2"
                      : ""
                  }`}
                  data-testid={`access-log-${log.id}`}
                >
                  <div className="flex items-start 
justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={log.result} />
                        <span className="text-xs 
text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {/* CRITICAL FIX: Display the user name if available, otherwise show "Unknown" */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">User:</span>
                          <span className="font-medium">
                            {log.name || "Unknown"}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            (ID: {log.userId || "—"})
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-sm text-muted-foreground">{log.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}