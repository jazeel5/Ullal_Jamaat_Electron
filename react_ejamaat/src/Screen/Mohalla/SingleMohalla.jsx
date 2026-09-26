import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Home, Building2, Search, Eye } from "lucide-react";
import { useGlobalContext } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function SingleMohalla() {
  const { mohalla_id } = useParams();
  const navigate = useNavigate();
  const { allmohalla, allfamily } = useGlobalContext();
  const [singleMohalla, setSingleMohalla] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Fetch single mohalla data
  useEffect(() => {
    const matchingMohalla = allmohalla?.mohallaData?.find(
      (mohalla) => mohalla?._id.toString() === mohalla_id.toString()
    );
    setSingleMohalla(matchingMohalla);
  }, [mohalla_id, allmohalla]);

  // Get family data
  const familyData = singleMohalla?.familyDetail || [];

  // Filter families - Match FamilyTable logic
  const filteredFamilies = useMemo(() => {
    return familyData.filter((item) => {
      const {
        mobileNumber,
        houseAddress,
        form_no,
        fatherOrHusbandName,
        houseOwnerName,
        doorNumber,
      } = item || {};

      const isMatch = (value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase());

      return (
        isMatch(mobileNumber) ||
        isMatch(houseAddress) ||
        isMatch(form_no) ||
        isMatch(houseOwnerName) ||
        isMatch(fatherOrHusbandName) ||
        isMatch(doorNumber)
      );
    });
  }, [familyData, searchTerm]);

  // Sort families - Handle nested properties
  const sortedFamilies = useMemo(() => {
    const sorted = [...filteredFamilies];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Numerical comparison
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        // String comparison (case insensitive)
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
            : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
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

  // Navigate to family details
  const handleNavigate = (familyId) => {
    if (!familyId) return;
    const matchingFamily = allfamily?.find(
      (family) => family?._id?.toString() === familyId?.toString()
    );
    navigate(`/singlefamily/${familyId}`, {
      state: matchingFamily ? { familyDetail: matchingFamily } : undefined,
    });
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!singleMohalla) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Section */}
      <div className="border-b bg-background px-4 py-6 flex-shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/mohalla")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link
            to="/mohalla"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Mohalla
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">
            {singleMohalla?.mohallaName}
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {singleMohalla?.mohallaName}
          </h1>
          <p className="text-sm text-muted-foreground">
            These are the families currently residing in this mohalla.
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="overflow-hidden border-border/40 bg-card">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="flex items-center justify-center bg-muted/30 px-4 py-6">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 px-4 py-5">
                  <p className="text-sm text-muted-foreground mb-1">Mohalla</p>
                  <p className="text-2xl font-bold">
                    {singleMohalla?.mohallaName || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/40 bg-card">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="flex items-center justify-center bg-muted/30 px-4 py-6">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 px-4 py-5">
                  <p className="text-sm text-muted-foreground mb-1">Kariya</p>
                  <p className="text-2xl font-bold">
                    {singleMohalla?.kariyaDetails?.kariyaName || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <StatsCard
            icon={Home}
            title="Total Families"
            value={familyData.length}
          />
          <StatsCard
            icon={Users}
            title="Total Population"
            value={familyData.reduce((sum, f) => sum + (f?.members?.length || 0), 0)}
          />
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search families..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("form_no")}
                  >
                    Form No
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("houseOwnerName")}
                  >
                    Owner
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("fatherOrHusbandName")}
                  >
                    Care of
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("mobileNumber")}
                  >
                    Phone
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("houseAddress")}
                  >
                    Address
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right hover:text-foreground"
                    onClick={() => handleSort("members.length")}
                  >
                    Members
                  </TableHead>
                  <TableHead className="text-center w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFamilies.length > 0 ? (
                  paginatedFamilies.map((family, index) => {
                    const totalMembers = family?.members?.length || 0;
                    return (
                      <TableRow key={family._id}>
                        <TableCell className="text-muted-foreground">
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {family?.form_no || "-"}
                        </TableCell>
                        <TableCell>
                          {family?.houseOwnerName || "-"}
                        </TableCell>
                        <TableCell>
                          {family?.fatherOrHusbandName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {family?.mobileNumber || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {family?.houseAddress || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalMembers}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNavigate(family?._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No families found.</p>
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
