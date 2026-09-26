import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Droplet } from "lucide-react";

export default function WaterSupplyChart({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allmohalla?.waterSupplyCounts) {
      const chartData = allmohalla.waterSupplyCounts.map((item) => ({
        name: item.waterSupply || "Unknown",
        value: item.count,
      }));
      setData(chartData);
      setLoading(false);
    }
  }, [allmohalla]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <Card className="border-border/40">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="h-72 bg-muted rounded animate-pulse"></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplet className="h-4 w-4" />
          Water Supply
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
