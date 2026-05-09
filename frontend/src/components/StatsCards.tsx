import { Users, Shield, Activity, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SystemStats } from "@shared/schema";

interface StatsCardsProps {
  stats: SystemStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Access Logs",
      value: stats?.totalAccessLogs || 0,
      icon: Activity,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Granted Today",
      value: stats?.accessGrantedToday || 0,
      icon: Shield,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Denied Today",
      value: stats?.accessDeniedToday || 0,
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? (
                      <span className="inline-block w-16 h-9 bg-muted animate-pulse rounded" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
