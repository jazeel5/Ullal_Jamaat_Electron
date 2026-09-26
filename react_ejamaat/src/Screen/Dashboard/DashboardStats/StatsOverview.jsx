import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Home } from "lucide-react";

export default function StatsOverview({ mohallaDetail }) {
  const stats = [
    {
      title: "Total Mohallas",
      value: mohallaDetail?.mohallaData?.length || 0,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Total Families",
      value: mohallaDetail?.TotalCount?.[0]?.familyCount || 0,
      icon: Home,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Population",
      value: mohallaDetail?.TotalCount?.[0]?.totalMembersCount || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
