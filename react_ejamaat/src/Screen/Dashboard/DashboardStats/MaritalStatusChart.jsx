import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Heart } from "lucide-react";

export default function MaritalStatusChart({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allmohalla?.maritalStatusCounts) {
      const chartData = allmohalla.maritalStatusCounts.map((item) => ({
        name: item.maritalStatus || "Unknown",
        count: item.count,
      }));
      setData(chartData);
      setLoading(false);
    }
  }, [allmohalla]);

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
          <Heart className="h-4 w-4" />
          Marital Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
