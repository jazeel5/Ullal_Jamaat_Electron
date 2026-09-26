import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Zap } from "lucide-react";

export default function ElectricityChart({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allmohalla?.electricityCount) {
      const available = allmohalla.electricityCount
        .filter((item) => item.electricity === "Yes")
        .reduce((sum, item) => sum + item.count, 0);
      const notAvailable = allmohalla.electricityCount
        .filter((item) => item.electricity === "No")
        .reduce((sum, item) => sum + item.count, 0);

      setData([
        { name: "Available", value: available },
        { name: "Not Available", value: notAvailable },
      ]);
      setLoading(false);
    }
  }, [allmohalla]);

  const COLORS = ["#fbbf24", "#ef4444"];

  if (loading) {
    return (
      <Card>
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
          <Zap className="h-4 w-4" />
          Electricity
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
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
