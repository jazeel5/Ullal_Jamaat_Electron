import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useGlobalContext } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============ Initial Member Template ============
const INITIAL_MEMBER = {
  fullName: "",
  gender: "",
  relationToOwner: "Family Head",
  religiousEducationLevel: "",
  academicEducationLevel: "",
  educationSpecialization: "",
  dateOfBirth: "",
  sayyedOrMalabari: "",
  religiousPrinciple: "",
  occupation: "",
  annualIncome: "",
  voterId: "",
  voterListName: "",
  aadhaarCard: "",
  maritalStatus: "",
  disablity: "",
  disablityStatus: "",
  aadhaarCardDoc: "",
};

const INITIAL_FAMILY_DATA = {
  form_no: "",
  kariya_id: "",
  mohalla_id: "",
  doorNumber: "",
  houseOwnerName: "",
  fatherOrHusbandName: "",
  houseAddress: "",
  mobileNumber: "",
  houseOwnership: "",
  agreementExpDate: "",
  totalYearsOfResidence: "",
  rationCard: "",
  waterSupply: "",
  electricity: "",
  washroom: "",
  rationCardDoc: "",
  members: [{ ...INITIAL_MEMBER }],
};

// ============ Helper Functions ============

const validateMobileNumber = (number) => /^[0-9]{10}$/.test(number);

const getAgeRange = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// ============ Main Component ============
export default function ControlFamily() {
  const { family_id } = useParams();
  const navigate = useNavigate();
  const {
    allkariyas,
    allfamily,
    allmohalla,
    isOnline,
    setAllFamily,
    setAllMohalla,
    setPopulation,
  } = useGlobalContext();

  const ipcRenderer = window.ipcRenderer;

  // State management
  const [userData, setUserData] = useState(INITIAL_FAMILY_DATA);
  const [kariya, setKariya] = useState(allkariyas || []);
  const [mohalla, setMohalla] = useState([]);
  const [allMohallaData, setAllMohallaData] = useState(
    allmohalla?.mohallaData || []
  );
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("house");

  // Load family data if editing
  useEffect(() => {
    if (!family_id) return;

    const matchingFamily = allfamily?.find(
      (family) => family._id.toString() === family_id.toString()
    );

    if (matchingFamily) {
      const filteredMohalla = allMohallaData?.filter(
        (item) =>
          item?.kariyaDetails?._id === matchingFamily?.familyData?.kariya_id
      );
      setMohalla(filteredMohalla);

      const familyDetail = {
        ...(matchingFamily?.familyData || INITIAL_FAMILY_DATA),
        members: matchingFamily?.members || [{ ...INITIAL_MEMBER }],
      };
      setUserData(familyDetail);
    }
  }, [family_id, allfamily, allMohallaData]);

  // Handle basic input change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "mobileNumber") {
      if (!validateMobileNumber(value) && value.length === 10) {
        setMobileNumberError("Please enter a valid 10-digit number");
      } else {
        setMobileNumberError("");
      }
    }

    setUserData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle member input change
  const handleMemberChange = useCallback((index, e) => {
    const { name, value } = e.target;

    setUserData((prev) => {
      const updatedMembers = [...prev.members];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [name]: value,
      };
      return { ...prev, members: updatedMembers };
    });
  }, []);

  // Handle file uploads
  const handleFileChange = useCallback((e, index = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload JPG, PNG, or PDF only");
      e.target.value = "";
      return;
    }

    setUserData((prev) => {
      if (index !== null) {
        // Member Aadhaar
        const updatedMembers = [...prev.members];
        updatedMembers[index].aadhaarCardDoc = file;
        return { ...prev, members: updatedMembers };
      } else {
        // Ration card
        return { ...prev, rationCardDoc: file };
      }
    });
  }, []);

  // Handle Kariya change
  const handleKariyaChange = useCallback(
    (value) => {
      setUserData((prev) => ({
        ...prev,
        kariya_id: value,
        mohalla_id: "",
        form_no: "",
      }));

      const filteredMohalla = allMohallaData?.filter(
        (item) => item?.kariyaDetails?._id === value
      );
      setMohalla(filteredMohalla);
    },
    [allMohallaData]
  );

  // Handle Mohalla change and generate form number
  const handleMohallaChange = useCallback(
    (value) => {
      const selectedMohalla = mohalla?.find((item) => item?._id === value);
      if (!selectedMohalla) return;

      let formNo = "";
      const existingFormNos =
        selectedMohalla?.familyDetail?.map((f) => f?.form_no) || [];

      if (existingFormNos.length > 0) {
        const lastFormNo = existingFormNos[existingFormNos.length - 1];
        const prefix = lastFormNo?.match(/^[A-Za-z]+/)?.[0] || "AAA";
        const number = parseInt(lastFormNo?.match(/\d+$/)?.[0] || "0", 10);
        formNo = `${prefix}${(number + 1).toString().padStart(3, "0")}`;
      } else {
        const prefix =
          selectedMohalla?.mohallaName?.toUpperCase().slice(0, 3) || "AAA";
        formNo = `${prefix}001`;
      }

      setUserData((prev) => ({
        ...prev,
        mohalla_id: value,
        form_no: formNo,
      }));
    },
    [mohalla]
  );

  // Add member
  const addMember = useCallback(() => {
    setUserData((prev) => ({
      ...prev,
      members: [...prev.members, { ...INITIAL_MEMBER, relationToOwner: "" }],
    }));
  }, []);

  // Remove member - must have at least one
  const removeMember = useCallback((index) => {
    setUserData((prev) => {
      if (prev.members.length === 1) {
        alert("At least one member is required");
        return prev;
      }
      return {
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Save file locally
  const saveFileLocally = useCallback((file, prefix) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await ipcRenderer.invoke("save-file-buffer", {
          fileName: `${prefix}_${Date.now()}_${file.name}`,
          buffer: reader.result,
        });
        result.success ? resolve(result.savedPath) : reject(result.error);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setResponse("");
      setError("");

      try {
        let updatedUserData = { ...userData };

        // Save files locally
        if (userData.rationCardDoc instanceof File) {
          const savedPath = await saveFileLocally(
            userData.rationCardDoc,
            "rationCardDoc"
          );
          updatedUserData.rationCardDoc = savedPath;
        }

        const updatedMembers = await Promise.all(
          userData.members.map(async (member, index) => {
            if (member.aadhaarCardDoc instanceof File) {
              const savedPath = await saveFileLocally(
                member.aadhaarCardDoc,
                `aadhaar_member_${index}`
              );
              return { ...member, aadhaarCardDoc: savedPath };
            }
            return member;
          })
        );
        updatedUserData.members = updatedMembers;

        // Save to file
        const uploadRes = await ipcRenderer.invoke("local-save-json", {
          fileName: "local-insert",
          data: updatedUserData,
        });

        if (uploadRes) {
          setResponse("Family saved successfully!");
          setTimeout(() => navigate("/family"), 1500);
        } else {
          setError("Failed to save family data");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to save family data");
      } finally {
        setLoading(false);
      }
    },
    [userData, saveFileLocally, navigate]
  );

  // Memoized computed values
  const isEditMode = useMemo(() => !!family_id, [family_id]);
  const pageTitle = isEditMode ? "Edit Family" : "Add New Family";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/family")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Fill in all details accurately for proper record-keeping
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="house">House Details</TabsTrigger>
              <TabsTrigger value="members">
                Family Members ({userData.members.length})
              </TabsTrigger>
            </TabsList>

            {/* ========== House Details Tab ========== */}
            <TabsContent value="house" className="space-y-6">
              {/* Location Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kariya Name *</label>
                    <Select
                      value={userData.kariya_id}
                      onValueChange={handleKariyaChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Kariya" />
                      </SelectTrigger>
                      <SelectContent>
                        {kariya?.map((k) => (
                          <SelectItem key={k._id} value={k._id}>
                            {k.kariyaName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Mohalla Name *
                    </label>
                    <Select
                      value={userData.mohalla_id}
                      onValueChange={handleMohallaChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mohalla" />
                      </SelectTrigger>
                      <SelectContent>
                        {mohalla?.map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.mohallaName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Form No</label>
                    <Input
                      value={userData.form_no}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Owner Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Owner Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Door Number *</label>
                    <Input
                      name="doorNumber"
                      value={userData.doorNumber}
                      onChange={handleChange}
                      placeholder="e.g., 101"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      House Owner Name *
                    </label>
                    <Input
                      name="houseOwnerName"
                      value={userData.houseOwnerName}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Father/Husband Name *
                    </label>
                    <Input
                      name="fatherOrHusbandName"
                      value={userData.fatherOrHusbandName}
                      onChange={handleChange}
                      placeholder="Father or Husband name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Mobile Number *
                      {mobileNumberError && (
                        <span className="text-red-500 ml-1">Error</span>
                      )}
                    </label>
                    <Input
                      name="mobileNumber"
                      value={userData.mobileNumber}
                      onChange={handleChange}
                      maxLength="10"
                      placeholder="10-digit number"
                      required
                      className={mobileNumberError ? "border-red-500" : ""}
                    />
                    {mobileNumberError && (
                      <p className="text-xs text-red-500">
                        {mobileNumberError}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">
                      House Address *
                    </label>
                    <Input
                      name="houseAddress"
                      value={userData.houseAddress}
                      onChange={handleChange}
                      placeholder="Complete address"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* House Facilities Card */}
              <Card>
                <CardHeader>
                  <CardTitle>House Facilities</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      House Ownership *
                    </label>
                    <Select
                      value={userData.houseOwnership}
                      onValueChange={(value) =>
                        setUserData((prev) => ({
                          ...prev,
                          houseOwnership: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                        <SelectItem value="Leased">Leased</SelectItem>
                        <SelectItem value="Free Stay">Free Stay</SelectItem>
                        <SelectItem value="Family Property">
                          Family Property
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {userData.houseOwnership === "Rented" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Agreement Exp Date
                      </label>
                      <Input
                        name="agreementExpDate"
                        type="date"
                        value={userData.agreementExpDate}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Years of Residence
                    </label>
                    <Input
                      name="totalYearsOfResidence"
                      type="number"
                      min="0"
                      value={userData.totalYearsOfResidence}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Water Supply *
                    </label>
                    <Select
                      value={userData.waterSupply}
                      onValueChange={(value) =>
                        setUserData((prev) => ({
                          ...prev,
                          waterSupply: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Own Well">Own Well</SelectItem>
                        <SelectItem value="Pipeline">Pipeline</SelectItem>
                        <SelectItem value="Public Well">Public Well</SelectItem>
                        <SelectItem value="Borewell">Borewell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Electricity *</label>
                    <Select
                      value={userData.electricity}
                      onValueChange={(value) =>
                        setUserData((prev) => ({
                          ...prev,
                          electricity: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Washroom *</label>
                    <Select
                      value={userData.washroom}
                      onValueChange={(value) =>
                        setUserData((prev) => ({
                          ...prev,
                          washroom: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Shared">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ration Card *</label>
                    <Select
                      value={userData.rationCard}
                      onValueChange={(value) =>
                        setUserData((prev) => ({
                          ...prev,
                          rationCard: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="BPL">BPL</SelectItem>
                        <SelectItem value="APL">APL</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Ration Card Document
                    </label>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== Members Tab ========== */}
            <TabsContent value="members" className="space-y-6">
              {userData.members.map((member, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-base">
                      {index === 0 ? "Family Head" : `Member ${index + 1}`}
                    </CardTitle>
                    {userData.members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        name="fullName"
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(index, e)}
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gender *</label>
                      <Select
                        value={member.gender}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "gender",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Relation to Owner */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Relation to Owner *
                      </label>
                      <Select
                        value={member.relationToOwner}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "relationToOwner",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                        disabled={index === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {index === 0 && (
                            <SelectItem value="Family Head">
                              Family Head
                            </SelectItem>
                          )}
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Wife">Wife</SelectItem>
                          <SelectItem value="Husband">Husband</SelectItem>
                          <SelectItem value="Son">Son</SelectItem>
                          <SelectItem value="Daughter">Daughter</SelectItem>
                          <SelectItem value="Grandmother">
                            Grandmother
                          </SelectItem>
                          <SelectItem value="Grandfather">
                            Grandfather
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Date of Birth
                      </label>
                      <Input
                        name="dateOfBirth"
                        type="date"
                        value={member.dateOfBirth}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Religious Education Level */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Religious Education *
                      </label>
                      <Select
                        value={member.religiousEducationLevel}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "religiousEducationLevel",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Below 5">Below 5</SelectItem>
                          <SelectItem value="Below 10">Below 10</SelectItem>
                          <SelectItem value="10 + 2">10 + 2</SelectItem>
                          <SelectItem value="Alim">Alim</SelectItem>
                          <SelectItem value="Ustad">Ustad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Academic Education Level */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Academic Education *
                      </label>
                      <Select
                        value={member.academicEducationLevel}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "academicEducationLevel",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primary School">
                            Primary School
                          </SelectItem>
                          <SelectItem value="Secondary School">
                            Secondary School
                          </SelectItem>
                          <SelectItem value="PUC">PUC</SelectItem>
                          <SelectItem value="Bachelor's Degree">
                            Bachelor's Degree
                          </SelectItem>
                          <SelectItem value="Master's Degree">
                            Master's Degree
                          </SelectItem>
                          <SelectItem value="Doctorate (PhD)">
                            Doctorate (PhD)
                          </SelectItem>
                          <SelectItem value="No Formal Education">
                            No Formal Education
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Education Specialization */}
                    {member.academicEducationLevel !==
                      "No Formal Education" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Specialization
                        </label>
                        <Input
                          name="educationSpecialization"
                          value={member.educationSpecialization}
                          onChange={(e) => handleMemberChange(index, e)}
                        />
                      </div>
                    )}

                    {/* Sayyed or Malabari */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Sayyed or Malabari *
                      </label>
                      <Select
                        value={member.sayyedOrMalabari}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "sayyedOrMalabari",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sayyed">Sayyed</SelectItem>
                          <SelectItem value="Malabari">Malabari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Religious Principle */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Religious Principle
                      </label>
                      <Input
                        name="religiousPrinciple"
                        value={member.religiousPrinciple}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Occupation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Occupation</label>
                      <Input
                        name="occupation"
                        value={member.occupation}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Annual Income */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Annual Income
                      </label>
                      <Input
                        name="annualIncome"
                        type="number"
                        min="0"
                        value={member.annualIncome}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Marital Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Marital Status *
                      </label>
                      <Select
                        value={member.maritalStatus}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "maritalStatus",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Unmarried">Unmarried</SelectItem>
                          {member.gender === "Male" && (
                            <SelectItem value="Widower">Widower</SelectItem>
                          )}
                          {member.gender === "Female" && (
                            <SelectItem value="Widow">Widow</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Voter ID */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Voter ID *</label>
                      <Select
                        value={member.voterId}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "voterId",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Voter List Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Voter List Name *
                      </label>
                      <Select
                        value={member.voterListName}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "voterListName",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aadhaar Card */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Aadhaar Card *
                      </label>
                      <Select
                        value={member.aadhaarCard}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "aadhaarCard",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aadhaar Document */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Aadhaar Document
                      </label>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, index)}
                      />
                    </div>

                    {/* Disability */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Disability *
                      </label>
                      <Select
                        value={member.disablity}
                        onValueChange={(value) => {
                          const changeEvent = {
                            target: {
                              name: "disablity",
                              value: value,
                            },
                          };
                          handleMemberChange(index, changeEvent);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disability Status */}
                    {member.disablity === "Yes" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Disability Status
                        </label>
                        <Input
                          name="disablityStatus"
                          value={member.disablityStatus}
                          onChange={(e) => handleMemberChange(index, e)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add Member Button */}
              <Button
                type="button"
                onClick={addMember}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Member
              </Button>
            </TabsContent>
          </Tabs>

          {/* Alerts */}
          {response && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {response}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Family"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
