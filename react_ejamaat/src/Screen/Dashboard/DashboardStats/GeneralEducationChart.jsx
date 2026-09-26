import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GraduationCap } from "lucide-react";

export default function GeneralEducationChart({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allmohalla?.generalEducationCount) {
      const chartData = allmohalla.generalEducationCount.map((item) => ({
        name: item.academicEducationLevel?.slice(0, 10) || "Other",
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
          <GraduationCap className="h-4 w-4" />
          General Education
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
