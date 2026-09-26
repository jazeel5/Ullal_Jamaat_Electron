import React, { useState, useMemo } from "react";
import { useGlobalContext } from "../../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building2 } from "lucide-react";

export default function MohallaSelector({ onMohallaSelect, currentMohalla }) {
  const { allmohalla, allkariyas } = useGlobalContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKariya, setSelectedKariya] = useState("All");

  const filteredMohallas = useMemo(() => {
    return (
      allmohalla?.mohallaData?.filter((mohalla) => {
        const matchesSearch = mohalla.mohallaName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesKariya =
          selectedKariya === "All" ||
          mohalla.kariyaDetails?.kariyaName === selectedKariya;
        return matchesSearch && matchesKariya;
      }) || []
    );
  }, [allmohalla, searchTerm, selectedKariya]);

  return (
    <Card className="border-border/40">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Select Mohalla
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mohallas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Kariya Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedKariya === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedKariya("All")}
          >
            All
          </Button>
          {allkariyas?.map((kariya) => (
            <Button
              key={kariya._id}
              variant={
                selectedKariya === kariya.kariyaName ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedKariya(kariya.kariyaName)}
            >
              {kariya.kariyaName}
            </Button>
          ))}
        </div>

        {/* Mohalla Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {filteredMohallas.map((mohalla) => (
            <Button
              key={mohalla._id}
              variant={
                currentMohalla?.mohallaName === mohalla.mohallaName
                  ? "default"
                  : "outline"
              }
              onClick={() => onMohallaSelect(allmohalla)}
              className="h-auto py-2 text-xs"
            >
              <span className="truncate">{mohalla.mohallaName}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
