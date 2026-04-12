// client\src\components\AnalyticsCharts.tsx
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
import type { AccessLogWithUser } from "@shared/schema";

interface AnalyticsChartsProps {
  logs: AccessLogWithUser[];
}

/**
 * Converts a UTC date to IST date for comparison
 */
function getISTDate(utcDate: Date): Date {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(utcDate.getTime() + istOffset);
}

/**
 * Gets the start of day in IST
 */
function getStartOfDayIST(date: Date): number {
  const istDate = getISTDate(date);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const startOfDay = new Date(Date.UTC(year, month, day));
  return startOfDay.getTime();
}

/**
 * Gets a date N days ago in IST
 */
function getDateNDaysAgoIST(daysAgo: number): number {
  const now = new Date();
  const istDate = getISTDate(now);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  
  const targetDate = new Date(Date.UTC(year, month, day - daysAgo));
  return targetDate.getTime();
}

/**
 * Formats a date in IST for display
 */
function formatDateIST(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  };
  return date.toLocaleString("en-US", options);
}

export function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
  // Prepare data for trend chart (last 7 days in IST)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const dateTimestamp = getDateNDaysAgoIST(6 - i);
    const dayLogs = logs.filter((log) => {
      const logDayTimestamp = getStartOfDayIST(new Date(log.createdAt));
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
          <CardDescription>Daily access attempts breakdown (IST - UTC+5:30)</CardDescription>
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
          <CardDescription>Comparison of granted vs denied access (dates in IST)</CardDescription>
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