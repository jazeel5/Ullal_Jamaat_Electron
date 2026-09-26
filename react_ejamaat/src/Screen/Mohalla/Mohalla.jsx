import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Eye, Users, Home } from "lucide-react";
import { useGlobalContext } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export default function Mohalla() {
  const location = useLocation();
  const { kariya } = location.state || {};
  const { allkariyas, allmohalla } = useGlobalContext();
  const navigate = useNavigate();

  const AllMohalla = allmohalla?.mohallaData || [];
  // Helper to get nested values
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((value, key) => value?.[key], obj);
  };

  const [selectedKariya, setSelectedKariya] = useState(kariya || "All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const allCategories = [{ kariyaName: "All" }, ...(allkariyas ?? [])];

  // Filter mohallas
  const filteredMohalla = useMemo(
    () =>
      Array.isArray(AllMohalla)
        ? AllMohalla.filter(
            (item) =>
              (selectedKariya === "All" ||
                item?.kariyaDetails?.kariyaName === selectedKariya) &&
              item?.mohallaName
                ?.toLowerCase()
                ?.includes(searchTerm.toLowerCase())
          )
        : [],
    [AllMohalla, selectedKariya, searchTerm]
  );

  // Sort mohallas
  const sortedMohalla = useMemo(() => {
    const sorted = [...filteredMohalla];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
    }
    return sorted;
  }, [filteredMohalla, sortConfig]);

  // Paginate data
  const paginatedMohalla = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedMohalla.slice(startIndex, endIndex);
  }, [sortedMohalla, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedMohalla.length / pageSize);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Get stats
  const getStats = (kariyaName) => {
    const filtered =
      kariyaName === "All"
        ? AllMohalla
        : AllMohalla.filter((m) => m?.kariyaDetails?.kariyaName === kariyaName);

    return {
      family: filtered.reduce((sum, item) => sum + (item.familyCount || 0), 0),
      population: filtered.reduce(
        (sum, item) => sum + (item.totalMembersCount || 0),
        0
      ),
    };
  };

  const stats = getStats(selectedKariya);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedKariya, searchTerm]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Section */}
      <div className="border-b bg-background px-4 py-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Kariya & Mohallas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and manage mohallas across different kariyas
            </p>
          </div>

          {/* Stats Cards - Right Side */}
          <div className="flex flex-wrap gap-4">
            <StatsCard
              icon={Users}
              title="Total Families"
              value={stats.family}
            />
            <StatsCard
              icon={Home}
              title="Total Population"
              value={stats.population}
            />
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Kariya Filter Buttons */}
          <div className="flex flex-wrap gap-2 flex-1 overflow-x-auto pb-1 md:pb-0">
            {allCategories?.map((kariya, index) => (
              <Button
                key={index}
                variant={
                  selectedKariya === kariya?.kariyaName ? "default" : "outline"
                }
                onClick={() => setSelectedKariya(kariya?.kariyaName)}
                size="sm"
                className="whitespace-nowrap"
              >
                {kariya?.kariyaName}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mohallas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("mohallaName")}
                  >
                    Mohalla
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("kariyaDetails.kariyaName")}
                  >
                    Kariya
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("familyCount")}
                  >
                    Family
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => handleSort("totalMembersCount")}
                  >
                    Population
                  </TableHead>
                  <TableHead className="text-center w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMohalla.length > 0 ? (
                  paginatedMohalla.map((item, index) => (
                    <TableRow key={item._id}>
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item?.mohallaName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item?.kariyaDetails?.kariyaName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item?.familyCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {item?.totalMembersCount || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/singlemohalla/${item?._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No mohallas found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Pagination Footer - Fixed at Bottom */}
      {sortedMohalla.length > 0 && (
        <div className="border-t bg-background px-4 py-4 flex-shrink-0">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedMohalla.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
