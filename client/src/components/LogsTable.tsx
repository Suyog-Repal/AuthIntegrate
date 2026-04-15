import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAbsoluteTimeIST } from "@/lib/utils";
import { useRelativeTimeIST } from "@/hooks/use-relative-time";
import type { AccessLogWithUser } from "@shared/schema";

function RelativeTimeDisplay({ timestamp }: { timestamp: string | Date }) {
  const relativeTime = useRelativeTimeIST(timestamp);
  return <span>{relativeTime}</span>;
}

interface LogsTableProps {
  logs: AccessLogWithUser[];
  isLoading: boolean;
}

export function LogsTable({ logs, isLoading }: LogsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No access logs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Log ID</TableHead>
            <TableHead className="font-semibold">User ID</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Note</TableHead>
            <TableHead className="font-semibold">Timestamp (IST)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
              <TableCell className="font-mono font-medium">{log.id}</TableCell>
              <TableCell className="font-mono">{log.userId || "—"}</TableCell>
              <TableCell>
                <StatusBadge status={log.result} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                {log.note || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {/* Display relative time with hover tooltip showing absolute time in IST */}
                <span title={formatAbsoluteTimeIST(log.createdAt)}>
                  <RelativeTimeDisplay timestamp={log.createdAt} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
