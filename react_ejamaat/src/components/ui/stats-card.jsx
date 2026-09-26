import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function StatsCard({ icon: Icon = Activity, title, value, trend }) {
  // Format number with commas (e.g., 1000 -> 1,000)
  const formatNumber = (num) => {
    if (typeof num === "string") {
      const parsed = parseInt(num, 10);
      return isNaN(parsed) ? num : parsed.toLocaleString();
    }
    return typeof num === "number" ? num.toLocaleString() : num;
  };

  const RenderIcon = Icon || Activity;

  return (
    <Card className="overflow-hidden border-border/40 bg-card">
      <CardContent className="p-0">
        <div className="flex items-center">
          {/* Icon Section - Left Side */}
          <div className="flex items-center justify-center bg-primary/10 px-5 py-6">
            <RenderIcon className="h-7 w-7 text-primary" />
          </div>

          {/* Stats Section - Right Side */}
          <div className="flex-1 px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">
                {formatNumber(value)}
              </p>
              {trend && (
                <span className="text-xs text-muted-foreground">{trend}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
