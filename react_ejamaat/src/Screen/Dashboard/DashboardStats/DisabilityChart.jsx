import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Accessibility } from "lucide-react";

export default function DisabilityChart({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allmohalla?.disablityCounts) {
      const disabled = allmohalla.disablityCounts
        .filter((item) => item.disablity === "yes")
        .reduce((sum, item) => sum + item.count, 0);
      const perfect = allmohalla.disablityCounts
        .filter((item) => item.disablity === "no")
        .reduce((sum, item) => sum + item.count, 0);

      setData([
        { name: "Disabled", value: disabled },
        { name: "Perfect", value: perfect },
      ]);
      setLoading(false);
    }
  }, [allmohalla]);

  const COLORS = ["#ef4444", "#10b981"];

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
          <Accessibility className="h-4 w-4" />
          Disability Status
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
