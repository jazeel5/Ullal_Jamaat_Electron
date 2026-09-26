import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, BarChart3 } from "lucide-react";

export default function RationCardStats({ mohallaDetail }) {
  const { allmohalla } = useGlobalContext();
  const [stats, setStats] = useState({ apl: 0, bpl: 0, na: 0 });

  useEffect(() => {
    const data = allmohalla?.rationCardCounts || [];
    setStats({
      apl: data.find((d) => d.rationCard === "APL")?.count || 0,
      bpl: data.find((d) => d.rationCard === "BPL")?.count || 0,
      na: data.find((d) => d.rationCard === "NA")?.count || 0,
    });
  }, [allmohalla]);

  return (
    <Card className="border-border/40">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Ration Card Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.apl}</p>
            <p className="text-xs text-muted-foreground mt-1">APL</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.bpl}</p>
            <p className="text-xs text-muted-foreground mt-1">BPL</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.na}</p>
            <p className="text-xs text-muted-foreground mt-1">N/A</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
