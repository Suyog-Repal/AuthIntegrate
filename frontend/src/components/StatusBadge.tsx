import { CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "GRANTED" | "DENIED" | "REGISTERED";
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = {
    GRANTED: {
      icon: CheckCircle,
      label: "Access Granted",
      className: "bg-success/10 text-success border-success/20",
    },
    DENIED: {
      icon: XCircle,
      label: "Access Denied",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    REGISTERED: {
      icon: UserPlus,
      label: "Registered",
      className: "bg-primary/10 text-primary border-primary/20",
    },
  };

  const { icon: Icon, label, className: statusClass } = config[status];

  return (
    <Badge
      variant="outline"
      className={`${statusClass} ${className} flex items-center gap-1.5 font-medium`}
      data-testid={`badge-${status.toLowerCase()}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
}
