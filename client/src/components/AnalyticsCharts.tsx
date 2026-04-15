import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from "recharts";
import { formatAbsoluteTimeIST } from "@/lib/utils";
import type { AccessLogWithUser } from "@shared/schema";

interface AnalyticsChartsProps {
  logs: AccessLogWithUser[];
}

/**
 * Gets the start of day in Mumbai timezone (IST)
 * Backend sends timestamps already converted to IST: "YYYY-MM-DD HH:MM:SS"
 * We extract just the date part and normalize to midnight for comparison
 * 
 * ✅ CRITICAL: Parse as IST date without applying additional timezone conversion
 */
function getStartOfDayIST(timestamp: string | Date): number {
  try {
    let date: Date;
    if (typeof timestamp === "string") {
      let isoFormat = timestamp.replace(" ", "T").replace(/Z$/, "");
      if (!isoFormat.match(/(Z|[+-]\d{2}:\d{2})$/)) {
        isoFormat += "+05:30";
      }
      date = new Date(isoFormat);
    } else {
      date = timestamp;
    }
    
    // ✅ CRITICAL FIX: Format date in IST timezone first
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };
    const dateStr = date.toLocaleString("en-CA", options); // Returns "YYYY-MM-DD"
    
    // Create new date from IST date string (treated as local time)
    const startOfDay = new Date(dateStr);
    return startOfDay.getTime();
  } catch (error) {
    console.error("Error getting start of day IST:", error);
    return 0;
  }
}

/**
 * Gets a date N days ago in Mumbai timezone
 * Respects IST date boundaries, not UTC boundaries
 * 
 * ✅ CRITICAL: All calculations use IST timezone
 */
function getDateNDaysAgoIST(daysAgo: number): number {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };
    const todayIST = now.toLocaleString("en-CA", options); // Returns "YYYY-MM-DD"
    
    // Parse today's IST date as local time
    const todayDate = new Date(todayIST);
    
    // Calculate target date (subtract days)
    const targetDate = new Date(todayDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return targetDate.getTime();
  } catch (error) {
    console.error("Error getting date N days ago IST:", error);
    return 0;
  }
}

/**
 * Formats a date in Mumbai timezone for display
 * Used for chart axis labels to show dates in IST
 */
function formatDateIST(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };
    return date.toLocaleString("en-US", options);
  } catch (error) {
    console.error("Error formatting date IST:", error);
    return "Unknown";
  }
}

export function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
  // ✅ CRITICAL FIX: Prepare data for trend chart using IST-aware date calculations
  // Backend returns timestamps already converted to IST, so we group by IST dates
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const dateTimestamp = getDateNDaysAgoIST(6 - i);
    const dayLogs = logs.filter((log) => {
      // ✅ CRITICAL: Compare IST dates, not UTC dates
      const logDayTimestamp = getStartOfDayIST(log.createdAt);
      return logDayTimestamp === dateTimestamp;
    });

    return {
      date: formatDateIST(dateTimestamp),
      granted: dayLogs.filter((l) => l.result === "GRANTED").length,
      denied: dayLogs.filter((l) => l.result === "DENIED").length,
      registered: dayLogs.filter((l) => l.result === "REGISTERED").length,
    };
  });
  
  // Prepare data for status distribution
  const statusData = [
    {
      name: "Granted",
      value: logs.filter((l) => l.result === "GRANTED").length,
      color: "hsl(142 76% 45%)",
    },
    {
      name: "Denied",
      value: logs.filter((l) => l.result === "DENIED").length,
      color: "hsl(0 84% 60%)",
    },
    {
      name: "Registered",
      value: logs.filter((l) => l.result === "REGISTERED").length,
      color: "hsl(217 91% 60%)",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Access Trend (Last 7 Days)</CardTitle>
          <CardDescription>Daily access attempts breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line 
                type="monotone"
                dataKey="granted"
                stroke="hsl(142 76% 45%)"
                strokeWidth={2}
                name="Granted"
              />
              <Line
                type="monotone"
                dataKey="denied"
                stroke="hsl(0 84% 60%)"
                strokeWidth={2}
                name="Denied"
              />
              <Line
                type="monotone"
                dataKey="registered"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                name="Registered"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Access Status Distribution</CardTitle>
          <CardDescription>Overall access results breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Access Rate</CardTitle>
          <CardDescription>Comparison of granted vs denied access</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="granted" fill="hsl(142 76% 45%)" name="Granted" />
              <Bar dataKey="denied" fill="hsl(0 84% 60%)" name="Denied" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}