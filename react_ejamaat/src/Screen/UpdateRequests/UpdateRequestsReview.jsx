import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../AuthContext";
import {
  Check,
  X,
  RefreshCw,
  User,
  Home,
  Phone,
  FileText,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  Layers,
  Edit3,
  Image as ImageIcon,
  Users,
  ChevronDown,
  ChevronUp,
  Coins,
  Heart,
  Calendar,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const fieldLabels = {
  form_no: "Form Number",
  houseOwnerName: "House Owner Name",
  relationType: "Relation Type",
  fatherOrHusbandName: "Father / Husband Name",
  mobileNumber: "Registered Mobile Number",
  doorNumber: "Door Number",
  houseAddress: "House Address",
  houseOwnership: "House Ownership Type",
  totalYearsOfResidence: "Total Years of Residence",
  agreementExpDate: "Agreement Expiry Date",
  rationCard: "Ration Card Category",
  rationCardDoc: "Ration Card Photo / Document",
  waterSupply: "Water Supply Facility",
  electricity: "Electricity Available",
  washroom: "Washroom Facility",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  maritalStatus: "Marital Status",
  academicEducationLevel: "Academic Education",
  qualification: "Qualification / Specialization",
  members: "Family Members",
};

const memberPropLabels = {
  fullName: "Full Name",
  relationToOwner: "Relation to Family Head",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  maritalStatus: "Marital Status",
  academicEducationLevel: "Academic Education",
  educationSpecialization: "Education Specialization",
  religiousEducationLevel: "Religious Education",
  occupation: "Job / Occupation",
  annualIncome: "Annual Income",
  sayyedOrMalabari: "Sayyed or Malabari",
  religiousPrinciple: "Religious Principle",
  voterId: "Voter ID Card",
  voterListName: "Voter List Registered",
  aadhaarCard: "Aadhaar Card Registered",
  aadhaarCardDoc: "Aadhaar Card Photo / Document",
  disablity: "Specially Abled / Disability",
  disablityStatus: "Disability Description",
  status: "Member Status",
  dateOfDeath: "Date of Death",
  deathCertificateDoc: "Death Certificate Document",
  spouseDetails: "Spouse & Marriage Registration Details",
};

export default function UpdateRequestsReview() {
  const globalContext = useGlobalContext();
  const loadFreshData = globalContext?.loadFreshData;
  const SyncData = globalContext?.SyncData;

  // Active Tab State: PROFILE_UPDATES | MARRIAGE_REGISTRATION | MARRIAGE_AID | DEATH_CERTIFICATE
  const [activeTab, setActiveTab] = useState("PROFILE_UPDATES");

  // Raw Requests Data
  const [updateRequests, setUpdateRequests] = useState([]);
  const [marriageAidRequests, setMarriageAidRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // State for per-field decisions: { fieldName: true (approved) / false (rejected) }
  const [approvedFields, setApprovedFields] = useState({});

  // State for Admin-edited values before applying: { fieldName: newValue }
  const [editedData, setEditedData] = useState({});
  
  // Image viewer modal state
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("Document Preview");

  // Track expanded member cards
  const [expandedMembers, setExpandedMembers] = useState({});

  // Marriage Aid Approval / Rejection Modal States
  const [aidApproveDialogOpen, setAidApproveDialogOpen] = useState(false);
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [aidRejectDialogOpen, setAidRejectDialogOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Demise Reports Separate Table State
  const [demiseReports, setDemiseReports] = useState([]);

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile Update Requests
      const res1 = await fetch("http://localhost:5002/api/user/pending-update-requests");
      const data1 = await res1.json();
      const fetchedUpdates = data1 && data1.success ? data1.requests || [] : [];
      setUpdateRequests(fetchedUpdates);

      // 2. Fetch Marriage Financial Aid Requests
      const res2 = await fetch("http://localhost:5002/api/marriage-aid/all-requests");
      const data2 = await res2.json();
      const fetchedAid = data2 && data2.success ? data2.requests || [] : [];
      setMarriageAidRequests(fetchedAid);

      // 3. Fetch Demise Reports (Separate Collection / Table)
      try {
        const res3 = await fetch("http://localhost:5002/api/demise-report/all");
        const data3 = await res3.json();
        const fetchedDemise = data3 && data3.success ? data3.reports || [] : [];
        setDemiseReports(fetchedDemise);
      } catch (err3) {
        console.error("Failed to fetch demise reports:", err3);
      }

      // Set initial selected request based on current activeTab
      selectInitialRequestForTab(activeTab, fetchedUpdates, fetchedAid);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDemiseReport = async (reportId, action) => {
    try {
      const res = await fetch(`http://localhost:5002/api/demise-report/process/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data && data.success) {
        alert(`Demise report ${action.toLowerCase()}d successfully.`);
        fetchAllSubmissions();
        if (SyncData) SyncData();
      } else {
        alert(data.message || "Failed to process demise report.");
      }
    } catch (err) {
      console.error("Error processing demise report:", err);
      alert("Failed to connect to server.");
    }
  };

  // Categorize update requests into the 3 update-based tabs based on DELTA changes
  const isMarriageRegReq = (req) => {
    const newM = req?.newData?.members || [];
    const oldM = req?.oldData?.members || [];

    return newM.some((nm, idx) => {
      const om = oldM[idx]; // undefined if member is newly added (e.g. adding a child/new person)

      const newSpouse = Array.isArray(nm.spouseDetails) ? nm.spouseDetails : [];
      const oldSpouse = Array.isArray(om?.spouseDetails) ? om.spouseDetails : [];

      // 1. Check if spouse details were added or expanded
      const spouseAdded = newSpouse.length > oldSpouse.length ||
        (newSpouse.length > 0 && oldSpouse.length === 0) ||
        newSpouse.some((s) => s.marriageCertificateDocUrl || s.idDocUrl || s.marriageDate);

      // 2. Check if an EXISTING member's marital status CHANGED to Married (e.g. from Unmarried -> Married)
      // Note: om MUST exist so adding a new family member/child does NOT trigger statusChangedToMarried
      const statusChangedToMarried = Boolean(om) && om.maritalStatus && om.maritalStatus !== "Married" && nm.maritalStatus === "Married";

      // 3. Check direct marriage document fields attached
      const directMarriageDoc = Boolean(nm.marriageCertificateDoc && (!om || nm.marriageCertificateDoc !== om.marriageCertificateDoc));

      return spouseAdded || statusChangedToMarried || directMarriageDoc;
    });
  };

  const isDeathCertReq = (req) => {
    // If request is a Marriage Registration, prioritize Marriage Registration
    if (isMarriageRegReq(req)) return false;
    if (req?.requestType === "DEATH_NOTIFICATION") return true;

    const newM = req?.newData?.members || [];
    const oldM = req?.oldData?.members || [];

    return newM.some((nm, idx) => {
      const om = oldM[idx];
      const statusChangedToDeceased = Boolean(om) && om.status !== "Deceased" && nm.status === "Deceased";
      const isDeceased = nm.status === "Deceased";
      const newDeathDoc = Boolean(nm.deathCertificateDoc) && (!om || nm.deathCertificateDoc !== om.deathCertificateDoc);
      const newDateOfDeath = Boolean(nm.dateOfDeath) && (!om || nm.dateOfDeath !== om.dateOfDeath);

      return statusChangedToDeceased || isDeceased || newDeathDoc || newDateOfDeath;
    });
  };

  const marriageCertList = updateRequests.filter((r) => isMarriageRegReq(r));
  const deathCertList = updateRequests.filter((r) => isDeathCertReq(r));
  const profileUpdatesList = updateRequests.filter((r) => !isMarriageRegReq(r) && !isDeathCertReq(r));
  const marriageAidList = marriageAidRequests;

  const getListForTab = (tab, updatesList = updateRequests, aidList = marriageAidRequests) => {
    const mCertList = updatesList.filter((r) => isMarriageRegReq(r));
    const dCertList = updatesList.filter((r) => isDeathCertReq(r));
    const pUpdatesList = updatesList.filter((r) => !isMarriageRegReq(r) && !isDeathCertReq(r));

    switch (tab) {
      case "MARRIAGE_REGISTRATION":
        return mCertList;
      case "MARRIAGE_AID":
        return aidList;
      case "DEATH_CERTIFICATE":
        return dCertList;
      case "PROFILE_UPDATES":
      default:
        return pUpdatesList;
    }
  };

  const selectInitialRequestForTab = (tab, updatesList = updateRequests, aidList = marriageAidRequests) => {
    const currentList = getListForTab(tab, updatesList, aidList);
    if (currentList && currentList.length > 0) {
      selectRequest(currentList[0]);
    } else {
      setSelectedRequest(null);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    selectInitialRequestForTab(newTab);
  };

  const selectRequest = (req) => {
    setSelectedRequest(req);
    const initialDecisions = {};
    const initialEdits = {};

    if (req && req.newData) {
      Object.keys(req.newData).forEach((field) => {
        const oldVal = req.oldData ? req.oldData[field] : null;
        const newVal = req.newData[field];
        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        if (isChanged) {
          initialDecisions[field] = true;
        }
        initialEdits[field] = JSON.parse(JSON.stringify(newVal));
      });
    }
    setApprovedFields(initialDecisions);
    setEditedData(initialEdits);

    const expanded = {};
    const membersList = req?.newData?.members || req?.oldData?.members || [];
    membersList.forEach((_, idx) => {
      expanded[idx] = true;
    });
    setExpandedMembers(expanded);
  };

  const toggleFieldApproval = (field, isApproved) => {
    setApprovedFields((prev) => ({
      ...prev,
      [field]: isApproved,
    }));
  };

  const handleEditChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMemberPropChange = (memberIndex, propName, value) => {
    setEditedData((prev) => {
      const currentMembers = Array.isArray(prev.members)
        ? [...prev.members]
        : Array.isArray(selectedRequest?.newData?.members)
        ? [...selectedRequest.newData.members]
        : [];

      if (!currentMembers[memberIndex]) {
        currentMembers[memberIndex] = {};
      }

      currentMembers[memberIndex] = {
        ...currentMembers[memberIndex],
        [propName]: value,
      };

      return {
        ...prev,
        members: currentMembers,
      };
    });
  };

  const toggleMemberExpand = (index) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSaveDecisions = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:5002/api/user/process-update-request/${selectedRequest._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedFields, editedData }),
        }
      );

      const data = await res.json();
      if (data && data.success) {
        alert("Update request processed successfully! Approved changes saved to database.");
        fetchAllSubmissions();
        if (loadFreshData) {
          try { await loadFreshData(); } catch (e) {}
        } else if (SyncData) {
          try { await SyncData(true); } catch (e) {}
        }
      } else {
        alert(data.message || "Failed to process request");
      }
    } catch (err) {
      console.error("Failed to process update request:", err);
      alert("Network error processing update request.");
    } finally {
      setProcessing(false);
    }
  };

  // Marriage Aid Handlers
  const handleApproveAidSubmit = async () => {
    if (!selectedRequest) return;
    const amount = Number(approvedAmountInput);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid approved amount.");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:5002/api/marriage-aid/process/${selectedRequest._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Approved", approvedAmount: amount }),
        }
      );

      const data = await res.json();
      if (data && data.success) {
        alert(`Marriage financial aid request approved for ₹${amount.toLocaleString("en-IN")}!`);
        setAidApproveDialogOpen(false);
        fetchAllSubmissions();
      } else {
        alert(data.message || "Failed to approve request.");
      }
    } catch (err) {
      console.error("Error approving aid request:", err);
      alert("Network error processing approval.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAidSubmit = async () => {
    if (!selectedRequest) return;
    if (!rejectionReasonInput.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:5002/api/marriage-aid/process/${selectedRequest._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Rejected", rejectionReason: rejectionReasonInput.trim() }),
        }
      );

      const data = await res.json();
      if (data && data.success) {
        alert("Marriage financial aid request rejected.");
        setAidRejectDialogOpen(false);
        fetchAllSubmissions();
      } else {
        alert(data.message || "Failed to reject request.");
      }
    } catch (err) {
      console.error("Error rejecting aid request:", err);
      alert("Network error processing rejection.");
    } finally {
      setProcessing(false);
    }
  };

  // Document Viewer Modal Helper
  const openImageModal = (imageUrl, title = "Document Preview") => {
    if (!imageUrl) return;
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
  };

  // Render individual field value with image preview
  const renderFieldValue = (field, val, isEditable = false, onChange = null) => {
    if (val === null || val === undefined || val === "") {
      return <span className="text-muted-foreground italic text-xs">N/A / Blank</span>;
    }

    const isImage = typeof val === "string" && (
      field.toLowerCase().includes("doc") ||
      field.toLowerCase().includes("photo") ||
      (field.toLowerCase().includes("card") && (val.startsWith("http") || val.startsWith("data:image") || val.startsWith("file://") || val.startsWith("/uploads"))) ||
      val.startsWith("data:image") ||
      val.startsWith("http")
    );

    if (isImage) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-background/80 p-2 rounded-lg border">
            <div className="relative group">
              <img
                src={val}
                alt={field}
                className="w-20 h-16 object-cover rounded-md border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                onClick={() => openImageModal(val, fieldLabels[field] || field)}
              />
              <div
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md cursor-pointer transition-opacity"
                onClick={() => openImageModal(val, fieldLabels[field] || field)}
              >
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                {fieldLabels[field] || field}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => openImageModal(val, fieldLabels[field] || field)}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Document
              </Button>
            </div>
          </div>
          {isEditable && onChange && (
            <div className="pt-1">
              <label className="text-[10px] text-muted-foreground font-semibold">Admin Edit Image Path:</label>
              <Input
                type="text"
                className="h-8 text-xs mt-0.5"
                value={val}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          )}
        </div>
      );
    }

    if (isEditable && onChange) {
      return (
        <div className="space-y-1">
          <Input
            type="text"
            className="h-9 text-sm font-semibold border-emerald-300 dark:border-emerald-700 bg-background"
            value={val}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Edit3 className="w-3 h-3" /> Editable by Admin
          </span>
        </div>
      );
    }

    return <span className="font-semibold text-foreground text-sm">{String(val)}</span>;
  };

  // Render Detailed Member-by-Member Form List
  const renderFamilyMembersDetailed = () => {
    const oldMembers = Array.isArray(selectedRequest?.oldData?.members) ? selectedRequest.oldData.members : [];
    const newMembers = Array.isArray(editedData.members)
      ? editedData.members
      : Array.isArray(selectedRequest?.newData?.members)
      ? selectedRequest.newData.members
      : [];

    const maxMembers = Math.max(oldMembers.length, newMembers.length);
    if (maxMembers === 0) {
      return <p className="text-xs text-muted-foreground italic">No family members submitted.</p>;
    }

    const memberPropKeys = Object.keys(memberPropLabels);

    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20">
          <h4 className="font-bold text-sm flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            Detailed Family Members Comparison ({maxMembers} Members)
          </h4>
          <span className="text-xs text-muted-foreground font-medium">
            Review member details & documents below
          </span>
        </div>

        {Array.from({ length: maxMembers }).map((_, mIdx) => {
          const oldM = oldMembers[mIdx] || {};
          const newM = newMembers[mIdx] || {};
          const isExpanded = expandedMembers[mIdx] !== false;

          const memberName = newM.fullName || oldM.fullName || `Member #${mIdx + 1}`;
          const relation = newM.relationToOwner || oldM.relationToOwner || "Member";

          return (
            <Card key={mIdx} className="border shadow-sm overflow-hidden">
              {/* Member Card Header */}
              <div
                className="flex items-center justify-between p-3.5 bg-muted/50 border-b cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleMemberExpand(mIdx)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full text-primary font-bold text-xs">
                    #{mIdx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground flex items-center gap-2">
                      {memberName}
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        {relation}
                      </Badge>
                      {newM.status === "Deceased" && (
                        <Badge variant="destructive" className="text-[10px] font-bold">
                          🕊️ Deceased
                        </Badge>
                      )}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gender: {newM.gender || oldM.gender || "N/A"} • DOB: {newM.dateOfBirth || oldM.dateOfBirth || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Member Form Fields */}
              {isExpanded && (
                <CardContent className="p-4 space-y-3 bg-card">
                  {/* Marriage Registration & Spouse Verification Card */}
                  {Array.isArray(newM.spouseDetails) && newM.spouseDetails.length > 0 && (
                    <div className="p-4 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-500/10 space-y-3 mb-4">
                      <div className="flex items-center justify-between border-b border-teal-200 dark:border-teal-800 pb-2">
                        <h6 className="font-bold text-sm text-teal-700 dark:text-teal-300 flex items-center gap-2">
                          💍 Marriage Registration & Spouse Details ({newM.spouseDetails.length})
                        </h6>
                        <Badge className="bg-teal-600 text-white text-[10px] font-bold">
                          Marital Status: Married
                        </Badge>
                      </div>

                      {newM.spouseDetails.map((spouse, sIdx) => (
                        <div key={sIdx} className="space-y-3 bg-background/80 p-3.5 rounded-lg border border-teal-200 dark:border-teal-900">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Spouse Name</span>
                              <span className="font-bold text-foreground text-sm">{spouse.fullName || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Gender</span>
                              <span className="font-semibold text-foreground">{spouse.gender || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Marriage Date</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{spouse.marriageDate || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Spouse DOB</span>
                              <span className="font-semibold text-foreground">{spouse.dateOfBirth || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Mobile Number</span>
                              <span className="font-semibold text-foreground">{spouse.mobileNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Occupation</span>
                              <span className="font-semibold text-foreground">{spouse.occupation || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Academic Education</span>
                              <span className="font-semibold text-foreground">{spouse.academicEducationLevel || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">ID Document Type</span>
                              <span className="font-semibold text-foreground">{spouse.idDocType || "Aadhaar Card"}</span>
                            </div>
                          </div>

                          {spouse.houseAddress ? (
                            <div className="text-xs">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Spouse House Address</span>
                              <span className="font-medium text-foreground">{spouse.houseAddress}</span>
                            </div>
                          ) : null}

                          <div className="pt-2 border-t flex flex-wrap gap-3">
                            {spouse.marriageCertificateDocUrl ? (
                              <div className="flex-1 min-w-[200px] p-2 bg-muted/40 rounded-lg border flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">📜 Marriage Verification Document</span>
                                  <span className="text-xs font-semibold">Nikah Nama / Invitation / Certificate</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1.5 bg-teal-600 text-white hover:bg-teal-700 border-none"
                                  onClick={() => openImageModal(spouse.marriageCertificateDocUrl, `Marriage Verification Document - ${spouse.fullName}`)}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview Document
                                </Button>
                              </div>
                            ) : null}

                            {spouse.idDocUrl ? (
                              <div className="flex-1 min-w-[200px] p-2 bg-muted/40 rounded-lg border flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">🆔 Spouse ID ({spouse.idDocType || "ID Card"})</span>
                                  <span className="text-xs font-semibold">Identity Document</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90 border-none"
                                  onClick={() => openImageModal(spouse.idDocUrl, `Spouse ID (${spouse.idDocType || 'ID Card'}) - ${spouse.fullName}`)}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview ID Card
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Death Certificate Verification Banner if member is marked deceased */}
                  {(newM.status === "Deceased" || newM.deathCertificateDoc || newM.dateOfDeath || newM.noticeExpireDate) && (
                    <div className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-500/10 space-y-3 mb-4">
                      <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800 pb-2">
                        <h6 className="font-bold text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                          🕊️ Deceased Member Record & Notice Information
                        </h6>
                        <Badge variant="destructive" className="text-[10px] font-bold">
                          Status: Deceased
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Date of Death</span>
                          <span className="font-bold text-red-600 dark:text-red-400 text-sm">{newM.dateOfDeath || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Notice Expire Date</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{newM.noticeExpireDate || selectedRequest?.newData?.deathNotificationInfo?.noticeExpireDate || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Cause / Notes</span>
                          <span className="font-semibold text-foreground text-xs">{newM.causeOfDeath || selectedRequest?.newData?.deathNotificationInfo?.causeOrNotes || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Death Certificate</span>
                          {newM.deathCertificateDoc ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 bg-red-600 text-white hover:bg-red-700 border-none mt-1"
                              onClick={() => openImageModal(newM.deathCertificateDoc, `Death Certificate - ${memberName}`)}
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview Document
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Document Attached (Optional)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase text-muted-foreground pb-2 border-b">
                    <div className="col-span-4">Member Field Name</div>
                    <div className="col-span-4 text-amber-700 dark:text-amber-400">Current (Old) Value</div>
                    <div className="col-span-4 text-emerald-700 dark:text-emerald-400">Requested / Admin Edited Value</div>
                  </div>

                  {memberPropKeys.map((propKey) => {
                    const propLabel = memberPropLabels[propKey];
                    const oldPropVal = oldM[propKey];
                    const newPropVal = newM[propKey];
                    const isPropChanged = JSON.stringify(oldPropVal) !== JSON.stringify(newPropVal);
                    const isAadhaarDoc = propKey === "aadhaarCardDoc";
                    const isDeathDoc = propKey === "deathCertificateDoc";

                    if (propKey === "spouseDetails" && Array.isArray(newM.spouseDetails) && newM.spouseDetails.length > 0) {
                      return null; // Already rendered in dedicated card above
                    }

                    return (
                      <div
                        key={propKey}
                        className={`grid grid-cols-12 gap-3 items-center p-2 rounded-md transition-colors ${
                          isPropChanged ? "bg-amber-500/10 border border-amber-300/40 dark:border-amber-800/40" : "bg-muted/20"
                        }`}
                      >
                        <div className="col-span-4 font-semibold text-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{propLabel}</span>
                          {isPropChanged && (
                            <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              Modified
                            </Badge>
                          )}
                        </div>

                        <div className="col-span-4 text-xs bg-muted/40 p-2 rounded border border-border/50">
                          {(isAadhaarDoc || isDeathDoc) && oldPropVal ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={oldPropVal}
                                alt="Document"
                                className="w-12 h-10 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => openImageModal(oldPropVal, `${memberName}'s Old Document`)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] gap-1 px-2"
                                onClick={() => openImageModal(oldPropVal, `${memberName}'s Old Document`)}
                              >
                                <Eye className="w-3 h-3" /> View
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium text-foreground">{oldPropVal !== undefined && oldPropVal !== "" ? String(oldPropVal) : "N/A"}</span>
                          )}
                        </div>

                        <div className="col-span-4 text-xs bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                          {(isAadhaarDoc || isDeathDoc) ? (
                            <div className="space-y-1.5">
                              {newPropVal ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={newPropVal}
                                    alt="Document"
                                    className="w-12 h-10 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => openImageModal(newPropVal, `${memberName}'s Document`)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] gap-1 px-2"
                                    onClick={() => openImageModal(newPropVal, `${memberName}'s Document`)}
                                  >
                                    <Eye className="w-3 h-3" /> View Photo
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">No Document</span>
                              )}
                              <Input
                                type="text"
                                className="h-7 text-[11px] font-mono mt-1"
                                placeholder="Edit Image Path/URL..."
                                value={newPropVal || ""}
                                onChange={(e) => handleMemberPropChange(mIdx, propKey, e.target.value)}
                              />
                            </div>
                          ) : (
                            <Input
                              type="text"
                              className="h-8 text-xs font-semibold border-emerald-300 dark:border-emerald-700 bg-background"
                              value={newPropVal !== undefined ? newPropVal : ""}
                              onChange={(e) => handleMemberPropChange(mIdx, propKey, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const currentTabList = getListForTab(activeTab);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Notifications & Verification Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve profile updates, marriage certificates, marriage financial aid, and death certificates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllSubmissions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {/* 4 PROFESSIONAL NOTIFICATION TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-2 rounded-xl border">
        <button
          onClick={() => handleTabChange("PROFILE_UPDATES")}
          className={`flex items-center justify-between p-3 rounded-lg border font-bold text-xs transition-all ${
            activeTab === "PROFILE_UPDATES"
              ? "bg-background text-primary border-primary shadow-sm scale-[1.02]"
              : "bg-card/50 text-muted-foreground border-transparent hover:bg-card"
          }`}
        >
          <span className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-500" />
            Profile Updates
          </span>
          <Badge variant={activeTab === "PROFILE_UPDATES" ? "default" : "secondary"} className="text-[10px]">
            {profileUpdatesList.length}
          </Badge>
        </button>

        <button
          onClick={() => handleTabChange("MARRIAGE_REGISTRATION")}
          className={`flex items-center justify-between p-3 rounded-lg border font-bold text-xs transition-all ${
            activeTab === "MARRIAGE_REGISTRATION"
              ? "bg-background text-teal-600 dark:text-teal-400 border-teal-500 shadow-sm scale-[1.02]"
              : "bg-card/50 text-muted-foreground border-transparent hover:bg-card"
          }`}
        >
          <span className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-teal-500" />
            Marriage Registration
          </span>
          <Badge variant={activeTab === "MARRIAGE_REGISTRATION" ? "default" : "secondary"} className="text-[10px]">
            {marriageCertList.length}
          </Badge>
        </button>

        <button
          onClick={() => handleTabChange("MARRIAGE_AID")}
          className={`flex items-center justify-between p-3 rounded-lg border font-bold text-xs transition-all ${
            activeTab === "MARRIAGE_AID"
              ? "bg-background text-amber-600 dark:text-amber-400 border-amber-500 shadow-sm scale-[1.02]"
              : "bg-card/50 text-muted-foreground border-transparent hover:bg-card"
          }`}
        >
          <span className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            Marriage Financial Aid
          </span>
          <Badge variant={activeTab === "MARRIAGE_AID" ? "default" : "secondary"} className="text-[10px]">
            {marriageAidList.filter((r) => r.status === "Pending").length}
          </Badge>
        </button>

        <button
          onClick={() => handleTabChange("DEATH_CERTIFICATE")}
          className={`flex items-center justify-between p-3 rounded-lg border font-bold text-xs transition-all ${
            activeTab === "DEATH_CERTIFICATE"
              ? "bg-background text-red-600 dark:text-red-400 border-red-500 shadow-sm scale-[1.02]"
              : "bg-card/50 text-muted-foreground border-transparent hover:bg-card"
          }`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-red-500" />
            Demise Reports & Certificates
          </span>
          <Badge variant={activeTab === "DEATH_CERTIFICATE" ? "default" : "secondary"} className="text-[10px]">
            {demiseReports.length + deathCertList.length}
          </Badge>
        </button>
      </div>

      {/* DEMISE REPORTS SEPARATE TABLE */}
      {activeTab === "DEATH_CERTIFICATE" && (
        <Card className="border shadow-sm mb-6">
          <CardHeader className="bg-red-500/5 border-b pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-red-500" />
                  Demise Reports Table (Separate Collection / Record)
                </CardTitle>
                <CardDescription className="text-xs">
                  Demise records reported directly by family members to inform Jamaat Admin.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Total Reports: {demiseReports.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {demiseReports.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm italic">
                No demise reports recorded in separate table yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b">
                    <tr>
                      <th className="p-3">Reported Date</th>
                      <th className="p-3">House & Owner Name</th>
                      <th className="p-3">Door #</th>
                      <th className="p-3">Deceased Member</th>
                      <th className="p-3">Relation</th>
                      <th className="p-3">Date of Death</th>
                      <th className="p-3">Notes / Cause</th>
                      <th className="p-3">Document</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {demiseReports.map((report) => (
                      <tr key={report._id} className="hover:bg-muted/20">
                        <td className="p-3 font-medium whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-foreground">
                          {report.houseOwnerName}
                          <div className="text-[10px] text-muted-foreground font-normal">Form #{report.form_no}</div>
                        </td>
                        <td className="p-3 font-mono">{report.doorNumber}</td>
                        <td className="p-3 font-bold text-red-600 dark:text-red-400">{report.deceasedName}</td>
                        <td className="p-3">{report.relationToOwner}</td>
                        <td className="p-3 font-semibold text-foreground">{report.dateOfDeath}</td>
                        <td className="p-3 max-w-xs truncate text-muted-foreground">{report.causeOrNotes || 'N/A'}</td>
                        <td className="p-3">
                          {report.deathCertificateDoc ? (
                            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={() => openImageModal(report.deathCertificateDoc, `Death Certificate - ${report.deceasedName}`)}>
                              <Eye className="w-3 h-3" /> View Doc
                            </Button>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Optional / None</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={report.status === 'Approved' ? 'bg-emerald-600' : report.status === 'Rejected' ? 'bg-red-600' : 'bg-amber-500'}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {report.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" className="h-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5" onClick={() => handleProcessDemiseReport(report._id, 'APPROVE')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-6 text-[11px] px-2.5" onClick={() => handleProcessDemiseReport(report._id, 'REJECT')}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-medium">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground font-medium">Loading submissions...</span>
        </div>
      ) : currentTabList.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold">No Pending Requests in this Category</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are currently no submissions for this tab. Switch tabs above to review other notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel: Requests List for Active Tab */}
          <div className="space-y-3 lg:col-span-1 border-r pr-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Submissions ({currentTabList.length})
            </h3>
            {currentTabList.map((req) => {
              const isSelected = selectedRequest?._id === req._id;
              const mohallaName = typeof req.mohalla_id === "object" ? req.mohalla_id?.mohallaName : "Mohalla";

              if (activeTab === "MARRIAGE_AID") {
                return (
                  <div
                    key={req._id}
                    onClick={() => selectRequest(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 shadow-sm"
                        : "bg-card hover:bg-accent border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {req.memberName} & {req.spouseName}
                      </h4>
                      <Badge className={req.status === "Approved" ? "bg-emerald-600" : req.status === "Rejected" ? "bg-red-600" : "bg-amber-500"}>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                      Requested: ₹{req.requestedAmount?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Door #{req.doorNumber} • {mohallaName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={req._id}
                  onClick={() => selectRequest(req)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card hover:bg-accent border-border"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {req.houseOwnerName || "Household Member"}
                    </h4>
                    <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                      Door #{req.doorNumber}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {mohallaName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Panel: Detailed Review Card */}
          {selectedRequest && (
            <div className="lg:col-span-3 space-y-6">
              {/* IF ACTIVE TAB IS MARRIAGE FINANCIAL AID */}
              {activeTab === "MARRIAGE_AID" ? (
                <>
                  <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Coins className="h-5 w-5 text-amber-600" />
                            Financial Assistance for {selectedRequest.memberName}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            Household Owner: <span className="font-semibold text-foreground">{selectedRequest.houseOwnerName}</span> (Door #{selectedRequest.doorNumber}) •{" "}
                            Submitted {new Date(selectedRequest.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge className={selectedRequest.status === "Approved" ? "bg-emerald-600" : selectedRequest.status === "Rejected" ? "bg-red-600" : "bg-amber-500"}>
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2 border-b bg-muted/30">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Marriage Event & Aid Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Member Getting Married</span>
                        <span className="font-bold text-foreground text-sm">{selectedRequest.memberName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bride / Groom Name</span>
                        <span className="font-bold text-foreground text-sm">{selectedRequest.spouseName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Marriage Date</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedRequest.marriageDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Venue</span>
                        <span className="font-semibold text-foreground text-xs">{selectedRequest.marriageVenue || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Requested Amount</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-lg">₹{selectedRequest.requestedAmount?.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Approved Amount</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                          {selectedRequest.status === "Approved" ? `₹${selectedRequest.approvedAmount?.toLocaleString("en-IN")}` : "Pending / N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Applicant Full Name</span>
                        <span className="font-semibold text-foreground text-sm">{selectedRequest.applicantName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Applicant Mobile</span>
                        <span className="font-semibold text-foreground text-sm">📞 {selectedRequest.contactMobile}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2 border-b bg-muted/30">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Reason / Financial Condition Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                        "{selectedRequest.reason || "No description provided."}"
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2 border-b bg-muted/30">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Bank Account & Disbursement Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Account Holder Name</span>
                        <span className="font-semibold text-foreground text-xs">{selectedRequest.bankDetails?.holderName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bank Account Number</span>
                        <span className="font-bold text-foreground text-sm font-mono">{selectedRequest.bankDetails?.accountNo || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bank Name & Branch</span>
                        <span className="font-semibold text-foreground text-xs">{selectedRequest.bankDetails?.bankName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">IFSC Code</span>
                        <span className="font-bold text-foreground text-sm font-mono">{selectedRequest.bankDetails?.ifscCode || "N/A"}</span>
                      </div>
                      {selectedRequest.bankDetails?.upiId ? (
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">UPI ID</span>
                          <span className="font-bold text-primary text-xs font-mono">{selectedRequest.bankDetails.upiId}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2 border-b bg-muted/30">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Supporting Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold block">💌 Marriage Invitation Card</span>
                          <span className="text-[11px] text-muted-foreground">Attached Document</span>
                        </div>
                        {selectedRequest.invitationCardDoc ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-amber-600 text-white hover:bg-amber-700 border-none"
                            onClick={() => openImageModal(selectedRequest.invitationCardDoc, "Marriage Invitation Card")}
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No File</span>
                        )}
                      </div>

                      <div className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold block">📄 Income / BPL Proof</span>
                          <span className="text-[11px] text-muted-foreground">Attached Document</span>
                        </div>
                        {selectedRequest.incomeProofDoc ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90 border-none"
                            onClick={() => openImageModal(selectedRequest.incomeProofDoc, "Income Proof Document")}
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No File</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedRequest.status === "Rejected" && selectedRequest.rejectionReason && (
                    <div className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-500/10 space-y-1">
                      <h5 className="font-bold text-sm text-red-600 dark:text-red-400">❌ Rejection Reason</h5>
                      <p className="text-xs font-medium text-foreground">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  {selectedRequest.status === "Pending" && (
                    <div className="pt-4 border-t flex items-center justify-end gap-4 bg-card p-4 rounded-xl shadow-md">
                      <Button
                        size="lg"
                        variant="destructive"
                        className="font-bold px-6 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setRejectionReasonInput("");
                          setAidRejectDialogOpen(true);
                        }}
                        disabled={processing}
                      >
                        <X className="mr-2 h-5 w-5" /> Reject Application
                      </Button>
                      <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                        onClick={() => {
                          setApprovedAmountInput(String(selectedRequest.requestedAmount || 0));
                          setAidApproveDialogOpen(true);
                        }}
                        disabled={processing}
                      >
                        <Check className="mr-2 h-5 w-5" /> Approve Financial Aid
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* IF ACTIVE TAB IS PROFILE UPDATES, MARRIAGE REGISTRATION, OR DEATH CERTIFICATES */
                <>
                  <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            {selectedRequest.houseOwnerName}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            Door #{selectedRequest.doorNumber} •{" "}
                            {typeof selectedRequest.mohalla_id === "object"
                              ? selectedRequest.mohalla_id?.mohallaName
                              : "Mohalla"}{" "}
                            • Submitted {new Date(selectedRequest.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                          Pending Verification
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Top Sticky/Action Save Bar */}
                  <div className="flex items-center justify-between bg-card p-3.5 rounded-xl border shadow-sm">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Object.values(approvedFields).filter(Boolean).length} field(s) approved
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {Object.values(approvedFields).filter((v) => v === false).length} field(s) rejected
                      </span>
                    </div>
                    <Button
                      size="default"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-sm"
                      onClick={handleSaveDecisions}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save & Apply Selected Updates
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Side-by-Side Table Header */}
                  <div className="grid grid-cols-12 gap-4 bg-muted/60 p-3 rounded-lg font-bold text-sm text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-3">Field Name</div>
                    <div className="col-span-3 text-amber-700 dark:text-amber-400">Current (Old) Data</div>
                    <div className="col-span-4 text-emerald-700 dark:text-emerald-400">Requested (New) Data</div>
                    <div className="col-span-2 text-center">Action</div>
                  </div>

                  {/* Fields Rows */}
                  <div className="space-y-3">
                    {(() => {
                      const allFields = Object.keys(selectedRequest.newData || {});
                      const modifiedFieldsOnly = allFields.filter((field) => {
                        const oldVal = selectedRequest.oldData ? selectedRequest.oldData[field] : null;
                        const newVal = selectedRequest.newData[field];

                        if (field === "members") {
                          const cleanOld = Array.isArray(oldVal) ? oldVal.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest) : [];
                          const cleanNew = Array.isArray(newVal) ? newVal.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest) : [];
                          return JSON.stringify(cleanOld) !== JSON.stringify(cleanNew);
                        }

                        const normOld = oldVal !== null && oldVal !== undefined ? String(oldVal).trim() : "";
                        const normNew = newVal !== null && newVal !== undefined ? String(newVal).trim() : "";
                        return normOld !== normNew;
                      });

                      const displayList = modifiedFieldsOnly.length > 0 ? modifiedFieldsOnly : allFields;

                      return displayList.map((field) => {
                        const label = fieldLabels[field] || field;
                        const oldVal = selectedRequest.oldData ? selectedRequest.oldData[field] : null;
                        const newVal = editedData[field] !== undefined ? editedData[field] : selectedRequest.newData[field];
                        
                        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(selectedRequest.newData[field]);
                        const isApproved = approvedFields[field] === true;
                        const isRejected = approvedFields[field] === false;

                        if (field === "members") {
                          return (
                            <Card
                              key={field}
                              className={`border transition-colors ${
                                isChanged ? "border-amber-300 dark:border-amber-800/60" : "opacity-80"
                              }`}
                            >
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-base">{label}</span>
                                    {isChanged && (
                                      <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                        Members Modified
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isChanged ? (
                                      <>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={isApproved ? "default" : "outline"}
                                          className={`h-9 px-4 font-bold gap-1 rounded-lg transition-all ${
                                            isApproved
                                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                                              : "text-muted-foreground hover:text-emerald-600 hover:border-emerald-600"
                                          }`}
                                          onClick={() => toggleFieldApproval(field, true)}
                                        >
                                          <Check className="h-4 w-4" /> Approve Members
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={isRejected ? "destructive" : "outline"}
                                          className={`h-9 px-4 font-bold gap-1 rounded-lg transition-all ${
                                            isRejected
                                              ? "bg-red-600 hover:bg-red-700 text-white shadow"
                                              : "text-muted-foreground hover:text-red-600 hover:border-red-600"
                                          }`}
                                          onClick={() => toggleFieldApproval(field, false)}
                                        >
                                          <X className="h-4 w-4" /> Reject Members
                                        </Button>
                                      </>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        Unchanged
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {renderFamilyMembersDetailed()}
                              </CardContent>
                            </Card>
                          );
                        }

                        return (
                          <Card
                            key={field}
                            className={`border transition-colors ${
                              isChanged ? "border-amber-300 dark:border-amber-800/60" : "opacity-80"
                            }`}
                          >
                            <CardContent className="p-4 grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-3 font-semibold text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span>{label}</span>
                                {isChanged && (
                                  <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                    Changed
                                  </Badge>
                                )}
                              </div>

                              <div className="col-span-3 text-sm bg-muted/40 p-2.5 rounded-md border border-border/50">
                                {renderFieldValue(field, oldVal)}
                              </div>

                              <div className="col-span-4 text-sm bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                {renderFieldValue(
                                  field,
                                  newVal,
                                  !field.toLowerCase().includes("doc") && !field.toLowerCase().includes("photo"),
                                  (val) => handleEditChange(field, val)
                                )}
                              </div>

                              <div className="col-span-2 flex items-center justify-center gap-2">
                                {isChanged ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={isApproved ? "default" : "outline"}
                                      className={`h-9 w-9 p-0 rounded-full transition-all ${
                                        isApproved
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-110"
                                          : "text-muted-foreground hover:text-emerald-600 hover:border-emerald-600"
                                      }`}
                                      title="Approve field change"
                                      onClick={() => toggleFieldApproval(field, true)}
                                    >
                                      <Check className="h-5 w-5 stroke-[3]" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={isRejected ? "destructive" : "outline"}
                                      className={`h-9 w-9 p-0 rounded-full transition-all ${
                                        isRejected
                                          ? "bg-red-600 hover:bg-red-700 text-white shadow-md scale-110"
                                          : "text-muted-foreground hover:text-red-600 hover:border-red-600"
                                      }`}
                                      title="Reject field change"
                                      onClick={() => toggleFieldApproval(field, false)}
                                    >
                                      <X className="h-5 w-5 stroke-[3]" />
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                    Unchanged
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom Sticky Save Actions */}
                  <div className="pt-4 border-t flex items-center justify-between bg-card p-4 rounded-xl shadow-md">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Object.values(approvedFields).filter(Boolean).length} field(s) approved
                      </span>
                      {" • "}
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {Object.values(approvedFields).filter((v) => v === false).length} field(s) rejected
                      </span>
                    </div>
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                      onClick={handleSaveDecisions}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Save & Apply Selected Updates
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full Document & Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-black/5 rounded-lg border min-h-[400px]">
            {previewImage && (
              previewImage.startsWith("data:application/pdf") || previewImage.endsWith(".pdf") ? (
                <iframe
                  src={previewImage}
                  title={previewTitle}
                  className="w-full h-[75vh] rounded-lg border shadow-lg"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Document Full Preview"
                  className="max-h-[75vh] w-auto object-contain rounded-lg border shadow-xl"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Marriage Aid Approve Modal */}
      <Dialog open={aidApproveDialogOpen} onOpenChange={setAidApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" /> Approve Marriage Financial Aid
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Confirm approval for <span className="font-bold text-foreground">{selectedRequest?.memberName}</span>. Enter the final approved amount below:
            </p>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Approved Amount (₹)</label>
              <Input
                type="number"
                value={approvedAmountInput}
                onChange={(e) => setApprovedAmountInput(e.target.value)}
                className="text-base font-bold"
                placeholder="e.g. 25000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAidApproveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleApproveAidSubmit} disabled={processing}>
              {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marriage Aid Reject Modal */}
      <Dialog open={aidRejectDialogOpen} onOpenChange={setAidRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Reject Financial Aid Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Please enter the reason for rejecting <span className="font-bold text-foreground">{selectedRequest?.memberName}</span>'s application. This reason will be shown to the user in their mobile app:
            </p>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Rejection Reason *</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Supporting documents insufficient / Income threshold exceeded"
                rows={4}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAidRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="font-bold" onClick={handleRejectAidSubmit} disabled={processing}>
              {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />} Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
