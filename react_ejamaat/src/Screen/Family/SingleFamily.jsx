import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Droplet,
  Zap,
  Users,
  BookOpen,
  Heart,
  Search,
  FileCheck,
  Wifi,
  Image as ImageIcon,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useGlobalContext } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MemberCard } from "@/components/MemberCard";
import { InfoSection } from "@/components/InfoSection";

// ============ Image Dialog Component ============
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

// ============ Loading Skeleton ============
function SingleFamilySkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="border-b bg-background px-4 py-6 flex-shrink-0">
        <Skeleton className="h-6 w-64 mb-4" />
        <Skeleton className="h-8 w-80 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-border/40">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-border/40">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Main Component ============
export default function SingleFamily() {
  const { family_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { allfamily, isLoadingFamily } = useGlobalContext();

  const [singleFamily, setSingleFamily] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageTitle, setImageTitle] = useState("Document Preview");

  // Fetch family data with multiple ID key checks & location.state fallback
  useEffect(() => {
    if (!family_id) return;

    // Check location state first
    if (location.state?.familyDetail) {
      setSingleFamily(location.state.familyDetail);
      return;
    }

    if (allfamily && Array.isArray(allfamily)) {
      const matchingFamily = allfamily.find(
        (family) =>
          family?._id?.toString() === family_id?.toString() ||
          family?.familyData?._id?.toString() === family_id?.toString() ||
          family?.familyData?.form_no?.toString() === family_id?.toString()
      );
      setSingleFamily(matchingFamily || null);
    }
  }, [family_id, allfamily, location.state]);

  // Handle image click
  const handleImageClick = useCallback(
    (imageUrl, title = "Document Preview") => {
      setSelectedImage(imageUrl);
      setImageTitle(title);
      setShowImageDialog(true);
    },
    []
  );

  // Extract data with memoization
  const familyData = useMemo(() => {
    if (!singleFamily) return null;

    const basicDetail = singleFamily?.familyData || singleFamily;
    const members = singleFamily?.members || [];
    const mohallaName = singleFamily?.mohallaDetail?.[0]?.mohallaName || "-";
    const kariyaName = singleFamily?.kariyaDetail?.[0]?.kariyaName || "-";
    const mohalla_id = basicDetail?.mohalla_id;

    return {
      basicDetail,
      members,
      mohallaName,
      kariyaName,
      mohalla_id,
      academicStats: singleFamily?.academicEducationCounts || [],
      maritalStats: singleFamily?.maritalStatusCounts || [],
      religiousStats: singleFamily?.religiousEducationCounts || [],
      disabilityCount: (
        singleFamily?.disablityCounts?.filter(
          (item) => item?.disablity === "yes"
        ) || []
      ).reduce((acc, curr) => acc + (curr?.count || 0), 0),
    };
  }, [singleFamily]);

  // Filter members by search - memoized
  const filteredMembers = useMemo(() => {
    if (!familyData || !familyData.members) return [];
    return familyData.members.filter((member) =>
      [
        member?.fullName,
        member?.occupation,
        member?.relationToOwner,
        member?.gender,
      ].some((field) =>
        field?.toLowerCase?.().includes(searchTerm.toLowerCase())
      )
    );
  }, [familyData, searchTerm]);

  if (!singleFamily || !familyData) {
    if (isLoadingFamily || !allfamily) {
      return <SingleFamilySkeleton />;
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/60" />
        <div>
          <h2 className="text-xl font-bold">Family Record Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The requested family details could not be found or have been removed.
          </p>
        </div>
        <Button onClick={() => navigate("/family")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Family Directory
        </Button>
      </div>
    );
  }

  const {
    basicDetail,
    members,
    mohallaName,
    kariyaName,
    mohalla_id,
    academicStats,
    maritalStats,
    religiousStats,
    disabilityCount,
  } = familyData;

  // Helper function to check if ration card is available
  const getrationCardStatus = () => {
    const rationCard = basicDetail?.rationCard;
    return (
      rationCard &&
      rationCard !== "Not-available" &&
      rationCard !== "No" &&
      rationCard !== "-"
    );
  };

  const hasRationCard = getrationCardStatus();
  const rationCardType = basicDetail?.rationCard || "Not Available";
  const hasRationCardDoc = basicDetail?.rationCardDoc;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
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
          <button
            onClick={() => navigate(`/singlemohalla/${mohalla_id}`)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {mohallaName}
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">#{basicDetail?.doorNumber}</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {basicDetail?.houseOwnerName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Care of {basicDetail?.fatherOrHusbandName}
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main Info Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE - Owner & Contact Details */}
            <div className="space-y-4">
              {/* Owner Card */}
              <Card className="border-border/40 pt-0 overflow-hidden">
                <CardHeader className="pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Owner Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      House Owner
                    </p>
                    <p className="text-sm font-semibold">
                      {basicDetail?.houseOwnerName || "-"}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Care of (Father/Husband)
                    </p>
                    <p className="text-sm font-semibold">
                      {basicDetail?.fatherOrHusbandName || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card className="border-border/40 pt-0">
                <CardHeader className="pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Phone Number
                    </p>
                    <Badge variant="secondary" className="text-sm font-mono">
                      {basicDetail?.mobileNumber || "-"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Form Card */}
              <Card className="border-border/40 pt-0">
                <CardHeader className="pb-3 pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Form Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Badge className="text-sm">
                    {basicDetail?.form_no || "-"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDE - Address & Facilities */}
            <div className="lg:col-span-2 space-y-4">
              {/* Address Card */}
              <Card className="border-border/40 pt-0">
                <CardHeader className="pb-3 pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Door No: </span>
                    <span className="font-semibold">#{basicDetail?.doorNumber}</span>
                  </p>
                  <p className="text-sm mt-2 leading-relaxed">
                    <span className="text-muted-foreground">Address: </span>
                    <span className="font-semibold">
                      {basicDetail?.houseAddress || "-"}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* Mohalla & Kariya Card */}
              <Card className="border-border/40 pt-0">
                <CardHeader className="pb-3 pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Family Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Mohalla
                      </p>
                      <Badge variant="default">{mohallaName || "-"}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Kariya
                      </p>
                      <Badge variant="secondary">{kariyaName || "-"}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facilities Card */}
              <Card className="border-border/40 pt-0">
                <CardHeader className="pb-3 pt-3 bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Facilities & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          House Type
                        </p>
                        <p className="text-sm font-medium">
                          {basicDetail?.houseOwnership || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Electricity
                        </p>
                        <p className="text-sm font-medium">
                          {basicDetail?.electricity === "Yes"
                            ? "✓ Available"
                            : basicDetail?.electricity || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Water Supply
                        </p>
                        <p className="text-sm font-medium">
                          {basicDetail?.waterSupply || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Toilet</p>
                        <p className="text-sm font-medium">
                          {basicDetail?.washroom === "Yes"
                            ? "✓ Available"
                            : basicDetail?.washroom || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Ration Card Status Section */}
          <Card
            className={`border-border/40 pt-0 ${
              hasRationCard
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
            }`}
          >
            <CardHeader
              className={`pb-3 pt-3 ${
                hasRationCard
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard
                  className={`h-5 w-5 ${
                    hasRationCard
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                />
                Ration Card Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Status Row */}
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  {hasRationCard ? (
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {hasRationCard ? "Ration Card Available" : "Ration Card Not Available"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Type: <span className="font-medium">{rationCardType}</span>
                    </p>
                  </div>
                </div>
                {hasRationCard && (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {rationCardType}
                  </Badge>
                )}
              </div>

              {/* Document Preview Section */}
              {hasRationCard && hasRationCardDoc && (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/40 border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                      <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Document Available</p>
                      <p className="text-xs text-muted-foreground">
                        Click to view the ration card document
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleImageClick(hasRationCardDoc, `Ration Card - ${rationCardType}`)
                    }
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    View Document
                  </Button>
                </div>
              )}

              {/* No Document Message */}
              {hasRationCard && !hasRationCardDoc && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Ration card is available but document image not uploaded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Family Stats Section */}
          {(academicStats.length > 0 ||
            maritalStats.length > 0 ||
            religiousStats.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {academicStats.length > 0 && (
                <InfoSection
                  title="Academic Education"
                  icon={BookOpen}
                  description="Family education distribution"
                >
                  <div className="space-y-2">
                    {academicStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">
                          {stat.academicEducationLevel}
                        </span>
                        <Badge variant="outline">{stat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

              {religiousStats.length > 0 && (
                <InfoSection
                  title="Religious Education"
                  icon={BookOpen}
                  description="Religious learning levels"
                >
                  <div className="space-y-2">
                    {religiousStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">
                          {stat.religiousEducationLevel}
                        </span>
                        <Badge variant="outline">{stat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

              {maritalStats.length > 0 && (
                <InfoSection
                  title="Marital Status"
                  icon={Heart}
                  description="Family marital distribution"
                >
                  <div className="space-y-2">
                    {maritalStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{stat.maritalStatus}</span>
                        <Badge variant="outline">{stat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}
            </div>
          )}

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Family Members</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredMembers.length} of {members.length} members
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    onAadhaarClick={(url) =>
                      handleImageClick(
                        url,
                        `Aadhaar Card - ${member.fullName}`
                      )
                    }
                    folderPath={null}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-border/40 pt-0">
                <CardContent className="p-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">
                    No members match your search
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching with different keywords
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Image Dialog */}
      <ImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        selectedImage={selectedImage}
        title={imageTitle}
      />
    </div>
  );
}
