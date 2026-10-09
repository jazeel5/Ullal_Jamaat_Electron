import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Plus, Edit2, Users, Home } from "lucide-react";
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

export default function Family() {
  const navigate = useNavigate();
  const { allfamily } = useGlobalContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

    // Helper to get nested values
    const getNestedValue = (obj, path) => {
      return path.split(".").reduce((value, key) => value?.[key], obj);
    };

  // Filter families
  const filteredFamilies = useMemo(() => {
    return (
      allfamily?.filter((item) => {
        const {
          houseOwnerName,
          mobileNumber,
          houseAddress,
          form_no,
          doorNumber,
          fatherOrHusbandName,
        } = item?.familyData || {};

        const searchLower = searchTerm.toLowerCase();
        return (
          houseOwnerName?.toLowerCase().includes(searchLower) ||
          fatherOrHusbandName?.toLowerCase().includes(searchLower) ||
          mobileNumber?.includes(searchTerm) ||
          houseAddress?.toLowerCase().includes(searchLower) ||
          form_no?.toLowerCase().includes(searchLower) ||
          doorNumber?.toString().toLowerCase().includes(searchLower)
        );
      }) || []
    );
  }, [allfamily, searchTerm]);

  // Sort families
  const sortedFamilies = useMemo(() => {
    const sorted = [...filteredFamilies];

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
            ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" })
            : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: "base" });
        }

        return 0;
      });
    }

    return sorted;
  }, [filteredFamilies, sortConfig]);

  // Paginate families
  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedFamilies.slice(startIndex, endIndex);
  }, [sortedFamilies, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedFamilies.length / pageSize);



  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Get stats
  const getStats = () => {
    return {
      totalFamilies: allfamily?.length || 0,
      totalMembers:
        allfamily?.reduce(
          (sum, family) => sum + (family?.members?.length || 0),
          0
        ) || 0,
    };
  };

  const stats = getStats();

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle navigate to single family
  const handleViewFamily = (familyId) => {
    navigate(`/singlefamily/${familyId}`);
  };

  // Handle add/edit family
  const handleAddFamily = (familyId = null) => {
    if (familyId) {
      navigate(`/addfamily/${familyId}`);
    } else {
      navigate("/addfamily");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Section */}
      <div className="border-b bg-background px-4 py-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Family Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore families across all Mohallas and discover detailed
              information
            </p>
          </div>

          {/* Stats Cards - Right Side */}
          <div className="flex flex-wrap gap-4">
            <StatsCard
              icon={Home}
              title="Total Families"
              value={stats.totalFamilies}
            />
            <StatsCard
              icon={Users}
              title="Total Members"
              value={stats.totalMembers}
            />
          </div>
        </div>

        {/* Search & Add Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input - Left Side */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search families..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add Family Button - Right Side */}
          <Button
            onClick={() => handleAddFamily()}
            className="gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Family
          </Button>
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.form_no")}
                  >
                    Form No
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.doorNumber")}
                  >
                    Door No
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.houseOwnerName")}
                  >
                    House Owner
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.fatherOrHusbandName")}
                  >
                    Care Of
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.mobileNumber")}
                  >
                    Phone
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right hover:text-foreground"
                    onClick={() => handleSort("members.length")}
                  >
                    Members
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("familyData.houseAddress")}
                  >
                    Address
                  </TableHead>
                  <TableHead className="text-center w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFamilies.length > 0 ? (
                  paginatedFamilies.map((family, index) => (
                    <TableRow key={family._id}>
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {family?.familyData?.form_no || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {family?.familyData?.doorNumber || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {family?.familyData?.houseOwnerName || "-"}
                      </TableCell>
                      <TableCell>
                        {family?.familyData?.fatherOrHusbandName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {family?.familyData?.mobileNumber || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {family?.members?.length || 0}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {family?.familyData?.houseAddress || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFamily(family?._id)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddFamily(family?._id)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No families found.
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
      {sortedFamilies.length > 0 && (
        <div className="border-t bg-background px-4 py-4 flex-shrink-0">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedFamilies.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
