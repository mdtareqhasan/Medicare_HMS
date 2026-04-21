import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string; // tailwind color class token
}

export function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-secondary" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={trend === "up" ? "text-secondary" : "text-destructive"}>
            {change}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </div>
    </div>
  );
}
