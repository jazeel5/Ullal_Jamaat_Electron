import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, ChevronRight } from "lucide-react";

export default function KariyaList() {
  const navigate = useNavigate();
  const { allkariyas } = useGlobalContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allkariyas) {
      setLoading(false);
    }
  }, [allkariyas]);

  if (loading) {
    return (
      <Card className="border-border/40">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted rounded animate-pulse mb-2"
              ></div>
            ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          {/* <Mosque className="h-4 w-4" /> */}
          Kariyas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allkariyas?.map((kariya) => (
          <Button
            key={kariya._id}
            variant="ghost"
            onClick={() =>
              navigate("/mohalla", { state: { kariya: kariya.kariyaName } })
            }
            className="w-full justify-between h-auto p-3"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0 text-left">
              <div className="flex-1">
                <p className="font-medium truncate">{kariya.kariyaName}</p>
                <p className="text-xs text-muted-foreground">
                  {kariya.familyCount} families
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
