import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Users, Calendar, Filter, X, Image as ImageIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

// Helper function to get nested values
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((value, key) => {
    if (key.includes("[")) {
      const [arrayKey, index] = key.split("[");
      const actualIndex = parseInt(index.replace("]", ""), 10);
      return value?.[arrayKey]?.[actualIndex];
    }
    return value?.[key];
  }, obj);
};

// Image Dialog Component
function ImageDialog({ open, onOpenChange, selectedImage, title }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[88vh] overflow-y-auto sm:rounded-xl bg-background/95 backdrop-blur-md border border-border/40 shadow-2xl p-4 sm:p-6">
        <div className="space-y-4">
          <DialogHeader className="border-b pb-3 pr-8">
            <DialogTitle className="text-lg sm:text-xl font-bold">{title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Full Document Preview
            </p>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-muted/30 p-2 sm:p-4 border border-border/30">
                <img
                  src={selectedImage}
                  alt="Document"
                  className="w-full h-auto object-contain rounded-lg max-h-[65vh] mx-auto"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-2.5 border border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-medium">Document Loaded Successfully</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Member Detail Modal Component
function MemberDetailModal({
  member,
  familyData,
  isOpen,
  onClose,
  onViewFamily,
  onShowImage,
}) {
  if (!member) return null;

  const getMaritalStatus = (status) => {
    const statusMap = {
      Married: "Married",
      Unmarried: "Unmarried",
      Yes: "Married",
      No: "Unmarried",
    };
    return statusMap[status] || status;
  };

  const getAvailabilityStatus = (status) => {
    const statusMap = { Yes: "Available", No: "Not Available" };
    return statusMap[status] || status;
  };

  // Check if ration card is available
  const hasRationCard = familyData?.rationCard && familyData?.rationCard !== "Not-available";
  const hasRationCardDoc = familyData?.rationCardDoc;
  const hasAadhaarCard = member?.aadhaarCard === "Yes";
  const hasAadhaarCardDoc = member?.aadhaarCardDoc;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-3 pr-8">
          <DialogTitle className="text-lg font-bold">Member Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Header */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">{member?.fullName}</h3>
            <p className="text-sm text-muted-foreground">
              Relation to Family: {member?.relationToOwner}
            </p>
          </div>

          {/* Member Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="text-sm font-medium">
                {member?.dateOfBirth || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-sm font-medium">{member?.gender || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sayyed/Malabari</p>
              <p className="text-sm font-medium">
                {member?.sayyedOrMalabari || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Marital Status</p>
              <p className="text-sm font-medium">
                {getMaritalStatus(member?.maritalStatus)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">General Education</p>
              <p className="text-sm font-medium">
                {member?.academicEducationLevel || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Education Specialization
              </p>
              <p className="text-sm font-medium">
                {member?.educationSpecialization || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Religious Education
              </p>
              <p className="text-sm font-medium">
                {member?.religiousEducationLevel || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Religious Principle
              </p>
              <p className="text-sm font-medium">
                {member?.religiousPrinciple || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Occupation</p>
              <p className="text-sm font-medium">{member?.occupation || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual Income</p>
              <p className="text-sm font-medium">
                ₹{member?.annualIncome?.toLocaleString() || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Voter ID</p>
              <Badge variant="outline" className="text-xs">
                {getAvailabilityStatus(member?.voterId)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Voter List Name</p>
              <Badge variant="outline" className="text-xs">
                {getAvailabilityStatus(member?.voterListName)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aadhaar Card</p>
              <Badge variant="outline" className="text-xs">
                {getAvailabilityStatus(member?.aadhaarCard)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disability</p>
              <Badge variant="outline" className="text-xs">
                {member?.disablity === "yes" ? "Yes" : "No"}
              </Badge>
            </div>
            {member?.disablity === "yes" && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Disability Status
                </p>
                <p className="text-sm font-medium">
                  {member?.disablityStatus || "-"}
                </p>
              </div>
            )}
          </div>

          {/* Family Information */}
          {familyData && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Family Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Form Number</p>
                    <p className="text-sm font-medium">
                      {familyData?.form_no || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">House Owner</p>
                    <p className="text-sm font-medium">
                      {familyData?.houseOwnerName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Mobile Number
                    </p>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {familyData?.mobileNumber || "-"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      House Address
                    </p>
                    <p className="text-sm font-medium truncate">
                      {familyData?.houseAddress || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      House Ownership
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {familyData?.houseOwnership || "-"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ration Card
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {familyData?.rationCard || "-"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Water Supply
                    </p>
                    <p className="text-sm font-medium">
                      {familyData?.waterSupply || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Electricity
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {getAvailabilityStatus(familyData?.electricity)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Documents</h4>
                <div className="space-y-3">
                  {/* Ration Card Document */}
                  {hasRationCard && hasRationCardDoc && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                          <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Ration Card
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            {familyData?.rationCard}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onShowImage(
                            hasRationCardDoc,
                            `Ration Card - ${familyData?.rationCard}`
                          )
                        }
                        className="gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  )}

                  {/* Aadhaar Card Document - Show if Ration Card is available */}
                  {hasRationCard && hasAadhaarCard && hasAadhaarCardDoc && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded">
                          <ImageIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Aadhaar Card
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-400">
                            ID Document
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onShowImage(hasAadhaarCardDoc, "Aadhaar Card")
                        }
                        className="gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  )}

                  {/* No Documents Message */}
                  {(!hasRationCard ||
                    (!hasRationCardDoc && !hasAadhaarCardDoc)) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents available
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() =>
                  onViewFamily(familyData?.family_id || familyData?._id)
                }
                className="w-full"
              >
                View Complete Family Details
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Population() {
  const navigate = useNavigate();
  const { population } = useGlobalContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Helpers for Age and Income Brackets
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeBracket = (dob) => {
    const age = calculateAge(dob);
    if (age === null || isNaN(age)) return null;
    if (age <= 5) return "0-5";
    if (age <= 12) return "6-12";
    if (age <= 18) return "13-18";
    if (age <= 25) return "19-25";
    if (age <= 35) return "26-35";
    if (age <= 45) return "36-45";
    if (age <= 55) return "46-55";
    if (age <= 65) return "56-65";
    if (age <= 75) return "66-75";
    return "76+";
  };

  const getIncomeRange = (income) => {
    if (!income && income !== 0) return null;
    const val = typeof income === "number" ? income : parseInt(income, 10);
    if (isNaN(val)) return null;
    if (val < 50000) return "Below 50k";
    if (val <= 100000) return "50k - 1L";
    if (val <= 300000) return "1L - 3L";
    if (val <= 500000) return "3L - 5L";
    return "Above 5L";
  };

  // Filter states
  const [filters, setFilters] = useState({
    gender: "all",
    relationToOwner: "all",
    maritalStatus: "all",
    sayyedOrMalabari: "all",
    religiousPrinciple: "all",
    academicEducationLevel: "all",
    educationSpecialization: "all",
    religiousEducationLevel: "all",
    occupation: "all",
    incomeRange: "all",
    ageBracket: "all",
    houseOwnership: "all",
    rationCard: "all",
    electricity: "all",
    washroom: "all",
    waterSupply: "all",
    hasVoterId: "all",
    voterListName: "all",
    hasAadhaar: "all",
    disability: "all",
    disablityStatus: "all",
    kariya: "all",
    mohalla: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Image dialog states
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("Document Preview");

  // Get unique filter options
  const getUniqueValues = (path) => {
    return [
      ...new Set(
        population?.map((item) => getNestedValue(item, path)).filter(Boolean)
      ),
    ].sort();
  };

  // Filter options
  const filterOptions = {
    gender: getUniqueValues("member.gender"),
    relationToOwner: getUniqueValues("member.relationToOwner"),
    sayyedOrMalabari: getUniqueValues("member.sayyedOrMalabari"),
    maritalStatus: getUniqueValues("member.maritalStatus"),
    religiousPrinciple: getUniqueValues("member.religiousPrinciple"),
    academicEducationLevel: getUniqueValues("member.academicEducationLevel"),
    educationSpecialization: getUniqueValues("member.educationSpecialization"),
    religiousEducationLevel: getUniqueValues("member.religiousEducationLevel"),
    occupation: getUniqueValues("member.occupation"),
    incomeRange: ["Below 50k", "50k - 1L", "1L - 3L", "3L - 5L", "Above 5L"],
    ageBracket: [
      "0-5",
      "6-12",
      "13-18",
      "19-25",
      "26-35",
      "36-45",
      "46-55",
      "56-65",
      "66-75",
      "76+",
    ],
    houseOwnership: getUniqueValues("familyData.houseOwnership"),
    rationCard: getUniqueValues("familyData.rationCard"),
    waterSupply: getUniqueValues("familyData.waterSupply"),
    washroom: getUniqueValues("familyData.washroom"),
    electricity: ["Yes", "No"],
    kariya: getUniqueValues("familyData.kariyaDetail[0].kariyaName"),
    mohalla: getUniqueValues("familyData.mohallaDetail[0].mohallaName"),
    voterId: ["Yes", "No"],
    voterListName: ["Yes", "No"],
    aadhaarCard: ["Yes", "No"],
    disability: ["Yes", "No"],
    disablityStatus: getUniqueValues("member.disablityStatus"),
  };

  // Filter population
  const filteredPopulation = useMemo(() => {
    return (
      population?.filter((item) => {
        const member = item?.member || {};
        const family = item?.familyData || {};

        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          member.fullName?.toLowerCase().includes(searchLower) ||
          member.gender?.toLowerCase().includes(searchLower) ||
          member.occupation?.toLowerCase().includes(searchLower) ||
          family.mobileNumber?.includes(searchTerm) ||
          family.houseAddress?.toLowerCase().includes(searchLower) ||
          family.form_no?.toLowerCase().includes(searchLower) ||
          family.doorNumber?.toLowerCase().includes(searchLower) ||
          family.houseOwnerName?.toLowerCase().includes(searchLower);

        // Gender filter
        const matchesGender =
          filters.gender === "all" || member.gender === filters.gender;

        // Relation to Owner filter
        const matchesRelation =
          filters.relationToOwner === "all" ||
          member.relationToOwner === filters.relationToOwner;

        // Marital Status filter
        const matchesMarital =
          filters.maritalStatus === "all" ||
          member.maritalStatus === filters.maritalStatus;

        // Sayyed/Malabari filter
        const matchesSayyed =
          filters.sayyedOrMalabari === "all" ||
          member.sayyedOrMalabari === filters.sayyedOrMalabari;

        // Religious Principle filter
        const matchesReligiousPrinciple =
          filters.religiousPrinciple === "all" ||
          member.religiousPrinciple === filters.religiousPrinciple;

        // Academic Education filter
        const matchesAcademic =
          filters.academicEducationLevel === "all" ||
          member.academicEducationLevel === filters.academicEducationLevel;

        // Education Specialization filter
        const matchesSpecialization =
          filters.educationSpecialization === "all" ||
          member.educationSpecialization === filters.educationSpecialization;

        // Religious Education filter
        const matchesReligious =
          filters.religiousEducationLevel === "all" ||
          member.religiousEducationLevel === filters.religiousEducationLevel;

        // Occupation filter
        const matchesOccupation =
          filters.occupation === "all" ||
          member.occupation === filters.occupation;

        // Income Range filter
        const matchesIncome =
          filters.incomeRange === "all" ||
          getIncomeRange(member.annualIncome) === filters.incomeRange;

        // Age Bracket filter
        const matchesAge =
          filters.ageBracket === "all" ||
          getAgeBracket(member.dateOfBirth) === filters.ageBracket;

        // House Ownership filter
        const matchesHouseOwnership =
          filters.houseOwnership === "all" ||
          family.houseOwnership === filters.houseOwnership;

        // Ration Card filter
        const matchesRationCard =
          filters.rationCard === "all" ||
          family.rationCard === filters.rationCard;

        // Water Supply filter
        const matchesWaterSupply =
          filters.waterSupply === "all" ||
          family.waterSupply === filters.waterSupply;

        // Washroom filter
        const matchesWashroom =
          filters.washroom === "all" || family.washroom === filters.washroom;

        // Electricity filter
        const matchesElectricity =
          filters.electricity === "all" ||
          family.electricity === filters.electricity;

        // Voter ID filter
        const matchesVoterId =
          filters.hasVoterId === "all" || member.voterId === filters.hasVoterId;

        // Voter List Name filter
        const matchesVoterListName =
          filters.voterListName === "all" ||
          member.voterListName === filters.voterListName;

        // Aadhaar Card filter
        const matchesAadhaar =
          filters.hasAadhaar === "all" ||
          member.aadhaarCard === filters.hasAadhaar;

        // Disability filter
        const matchesDisability =
          filters.disability === "all" ||
          (member.disablity === "yes" && filters.disability === "yes") ||
          (member.disablity === "no" && filters.disability === "no");

        // Disability Status filter
        const matchesDisabilityStatus =
          filters.disablityStatus === "all" ||
          member.disablityStatus === filters.disablityStatus;

        // Kariya filter
        const matchesKariya =
          filters.kariya === "all" ||
          family.kariyaDetail?.[0]?.kariyaName === filters.kariya;

        // Mohalla filter
        const matchesMohalla =
          filters.mohalla === "all" ||
          family.mohallaDetail?.[0]?.mohallaName === filters.mohalla;

        return (
          matchesSearch &&
          matchesGender &&
          matchesRelation &&
          matchesMarital &&
          matchesSayyed &&
          matchesReligiousPrinciple &&
          matchesAcademic &&
          matchesSpecialization &&
          matchesReligious &&
          matchesOccupation &&
          matchesIncome &&
          matchesAge &&
          matchesHouseOwnership &&
          matchesRationCard &&
          matchesWaterSupply &&
          matchesWashroom &&
          matchesElectricity &&
          matchesVoterId &&
          matchesVoterListName &&
          matchesAadhaar &&
          matchesDisability &&
          matchesDisabilityStatus &&
          matchesKariya &&
          matchesMohalla
        );
      }) || []
    );
  }, [population, searchTerm, filters]);

  // Sort population
  const sortedPopulation = useMemo(() => {
    const sorted = [...filteredPopulation];

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
            ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
            : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
        }

        return 0;
      });
    }

    return sorted;
  }, [filteredPopulation, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedPopulation.length / pageSize);
  const paginatedPopulation = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPopulation.slice(start, start + pageSize);
  }, [sortedPopulation, currentPage, pageSize]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      gender: "all",
      relationToOwner: "all",
      maritalStatus: "all",
      sayyedOrMalabari: "all",
      religiousPrinciple: "all",
      academicEducationLevel: "all",
      educationSpecialization: "all",
      religiousEducationLevel: "all",
      occupation: "all",
      incomeRange: "all",
      ageBracket: "all",
      houseOwnership: "all",
      rationCard: "all",
      electricity: "all",
      washroom: "all",
      waterSupply: "all",
      hasVoterId: "all",
      voterListName: "all",
      hasAadhaar: "all",
      disability: "all",
      disablityStatus: "all",
      kariya: "all",
      mohalla: "all",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Get stats
  const getStats = () => {
    return {
      totalMembers: population?.length || 0,
      totalFamilies:
        new Set(population?.map((p) => p?.familyData?._id)).size || 0,
    };
  };

  const stats = getStats();

  // Handle view member modal
  const handleViewMember = (item) => {
    setSelectedMember(item);
    setShowModal(true);
  };

  // Handle show image
  const handleShowImage = (imageUrl, title) => {
    setSelectedImage(imageUrl);
    setImageTitle(title);
    setShowImageDialog(true);
  };

  // Handle view family
  const handleViewFamily = (familyId) => {
    navigate(`/singlefamily/${familyId}`);
    setShowModal(false);
  };

  const getMaritalStatus = (status) => {
    const statusMap = { Married: "Married", Unmarried: "Unmarried" };
    return statusMap[status] || status;
  };

  const hasActiveFilters = Object.values(filters).some((f) => f !== "all");

  // Filter keys for display
  const filterKeys = [
    { key: "gender", label: "Gender", options: filterOptions.gender },
    {
      key: "relationToOwner",
      label: "Relation to Owner",
      options: filterOptions.relationToOwner,
    },
    {
      key: "sayyedOrMalabari",
      label: "Sayyed/Malabari",
      options: filterOptions.sayyedOrMalabari,
    },
    {
      key: "maritalStatus",
      label: "Marital Status",
      options: filterOptions.maritalStatus,
    },
    {
      key: "religiousPrinciple",
      label: "Religious Principle",
      options: filterOptions.religiousPrinciple,
    },
    {
      key: "academicEducationLevel",
      label: "Academic Education",
      options: filterOptions.academicEducationLevel,
    },
    {
      key: "educationSpecialization",
      label: "Specialization",
      options: filterOptions.educationSpecialization,
    },
    {
      key: "religiousEducationLevel",
      label: "Religious Education",
      options: filterOptions.religiousEducationLevel,
    },
    {
      key: "occupation",
      label: "Occupation",
      options: filterOptions.occupation,
    },
    {
      key: "incomeRange",
      label: "Annual Income",
      options: filterOptions.incomeRange,
    },
    {
      key: "ageBracket",
      label: "Age Group",
      options: filterOptions.ageBracket,
    },
    {
      key: "houseOwnership",
      label: "House Ownership",
      options: filterOptions.houseOwnership,
    },
    {
      key: "rationCard",
      label: "Ration Card",
      options: filterOptions.rationCard,
    },
    {
      key: "waterSupply",
      label: "Water Supply",
      options: filterOptions.waterSupply,
    },
    {
      key: "washroom",
      label: "Washroom",
      options: filterOptions.washroom,
    },
    {
      key: "electricity",
      label: "Electricity",
      options: filterOptions.electricity,
    },
    {
      key: "hasVoterId",
      label: "Voter ID",
      options: filterOptions.voterId,
    },
    {
      key: "voterListName",
      label: "Voter List Name",
      options: filterOptions.voterListName,
    },
    {
      key: "hasAadhaar",
      label: "Aadhaar Card",
      options: filterOptions.aadhaarCard,
    },
    {
      key: "disability",
      label: "Disability",
      options: filterOptions.disability,
    },
    {
      key: "disablityStatus",
      label: "Disability Status",
      options: filterOptions.disablityStatus,
    },
    {
      key: "kariya",
      label: "Kariya",
      options: filterOptions.kariya,
    },
    {
      key: "mohalla",
      label: "Mohalla",
      options: filterOptions.mohalla,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Section */}
      <div className="border-b bg-background px-4 py-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Members</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore all members from various mohallas and families
            </p>
          </div>

          {/* Stats Cards - Right Side */}
          <div className="flex flex-wrap gap-4">
            <StatsCard
              icon={Users}
              title="Total Members"
              value={stats.totalMembers}
            />
            <StatsCard
              icon={Calendar}
              title="Total Families"
              value={stats.totalFamilies}
            />
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(filters).filter((f) => f !== "all").length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-muted/30 rounded-lg border space-y-4 max-h-[360px] overflow-y-auto shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {filterKeys.map((filterKey) => (
                <div key={filterKey.key}>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">
                    {filterKey.label}
                  </label>
                  <Select
                    value={filters[filterKey.key]}
                    onValueChange={(value) =>
                      handleFilterChange(filterKey.key, value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filterKey.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterKeys.map(
              (filterKey) =>
                filters[filterKey.key] !== "all" && (
                  <Badge
                    key={filterKey.key}
                    variant="secondary"
                    className="gap-1.5 cursor-pointer"
                    onClick={() => handleFilterChange(filterKey.key, "all")}
                  >
                    {filterKey.label}: {filters[filterKey.key]}
                    <X className="h-3 w-3" />
                  </Badge>
                )
            )}
          </div>
        )}
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
                  onClick={() => handleSort("member.fullName")}
                >
                  Name
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("member.gender")}
                >
                  Gender
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("member.maritalStatus")}
                >
                  Marital Status
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("member.sayyedOrMalabari")}
                >
                  Type
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right hover:text-foreground"
                  onClick={() => handleSort("member.annualIncome")}
                >
                  Annual Income
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() =>
                    handleSort("familyData.mohallaDetail[0].mohallaName")
                  }
                >
                  Mohalla
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("familyData.houseAddress")}
                >
                  Address
                </TableHead>
                <TableHead className="text-center w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPopulation.length > 0 ? (
                paginatedPopulation.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item?.member?.fullName || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item?.member?.gender || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getMaritalStatus(item?.member?.maritalStatus) || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item?.member?.sayyedOrMalabari || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹
                      {item?.member?.annualIncome?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {item?.familyData?.mohallaDetail?.[0]?.mohallaName || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item?.familyData?.houseAddress || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMember(item)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No members found.</p>
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
      {sortedPopulation.length > 0 && (
        <div className="border-t bg-background px-4 py-4 flex-shrink-0">
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedPopulation.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Member Detail Modal */}
      <MemberDetailModal
        member={selectedMember?.member}
        familyData={selectedMember?.familyData}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onViewFamily={handleViewFamily}
        onShowImage={handleShowImage}
      />

      {/* Image Preview Dialog */}
      <ImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        selectedImage={selectedImage}
        title={imageTitle}
      />
    </div>
  );
}
