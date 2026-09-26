import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalContext } from "../AuthContext";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lucide Icons
import {
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Home,
} from "lucide-react";

export default function ControlFamily() {
  const {
    allkariyas,
    allfamily,
    allmohalla,
    isOnline,
    setAddedNew,
    population,
    setAllMohalla,
    setAllFamily,
    setPopulation,
  } = useGlobalContext();

  let nav = useNavigate();
  let { family_id } = useParams();

  const [userData, setUserData] = useState({
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
    members: [
      {
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
      },
    ],
  });

  const [kariya, setKariya] = useState(allkariyas || []);
  const [mohalla, setMohalla] = useState([]);
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [matchingFamily, setMatchingFamily] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ipcRenderer = window.ipcRenderer;

  // ✅ LOAD FAMILY DATA FOR EDITING
  useEffect(() => {
    if (!family_id) return;

    const found = allfamily?.find(
      (family) => family._id.toString() === family_id.toString()
    );

    setMatchingFamily(found);

    if (found) {
      const kariyaId = found?.familyData?.kariya_id;
      const mohallaId = found?.familyData?.mohalla_id;

      // Filter mohalla based on kariya_id
      const filteredMohalla = allmohalla?.mohallaData?.filter((item) => {
        const itemKariyaId = Array.isArray(item?.kariyaDetails?._id)
          ? item?.kariyaDetails?._id[0]
          : item?.kariyaDetails?._id;

        return itemKariyaId == kariyaId;
      });

      setMohalla(filteredMohalla);

      // Fix member _id if it's an array
      const fixedMembers =
        found?.members?.map((member) => ({
          ...member,
          _id: Array.isArray(member._id) ? member._id[0] : member._id,
        })) || [];

      let familyDetail = {
        ...(found?.familyData || {}),
        _id: found?.familyData?._id,
        kariya_id: kariyaId,
        mohalla_id: mohallaId,
        members: fixedMembers,
      };

      setUserData(familyDetail);
    }
  }, [family_id, allmohalla, allfamily]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobileNumber") {
      const regex = /^[0-9]{10}$/;
      if (!regex.test(value)) {
        setMobileNumberError("Please enter a valid 10-digit mobile number.");
      } else {
        setMobileNumberError("");
      }
    }

    setUserData({ ...userData, [name]: value });
  };

  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...userData.members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [name]: value,
    };
    setUserData({ ...userData, members: updatedMembers });
  };

  const handleMemberChangeAadhaarCard = (index, e) => {
    const fileInput = e.target;
    const file = e.target.files[0];

    if (file) {
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ];

      if (!validImageTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPG, JPEG, PNG or PDF).");
        fileInput.value = "";
        return;
      }

      const updatedMembers = [...userData.members];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [e.target.name]: file,
      };
      setUserData({ ...userData, members: updatedMembers });
    }
  };

  const addMember = () => {
    setUserData({
      ...userData,
      members: [
        ...userData.members,
        {
          fullName: "",
          gender: "",
          relationToOwner: "",
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
        },
      ],
    });
  };

  const removeMember = (index) => {
    const updatedMembers = userData.members.filter((_, i) => i !== index);
    setUserData({ ...userData, members: updatedMembers });
  };

  // ✅ ALL HELPER FUNCTIONS
  const mapUploadedFilesToData = (uploadedFileDetails, userData) => {
    const updatedUserData = {
      ...userData,
      members: [...userData.members],
    };

    uploadedFileDetails.forEach(({ identifier, url }) => {
      if (identifier === "rationCardDoc") {
        updatedUserData.rationCardDoc = url;
      } else if (identifier.startsWith("member_")) {
        const index = +identifier.split("_")[1];
        if (updatedUserData.members[index]) {
          updatedUserData.members[index].aadhaarCardDoc = url;
        }
      }
    });

    return updatedUserData;
  };

  const saveToFile = async (fileNames, data) => {
    try {
      for (let i = 0; i < fileNames.length; i++) {
        await ipcRenderer.invoke("save-json", {
          fileName: fileNames[i],
          data: data[i],
        });
      }
    } catch (err) {
      console.error("Error saving JSON:", err);
    }
  };

  function combineAndGroupCounts(existingCounts = [], newValue, key) {
    const combinedMap = new Map();

    existingCounts.forEach((item) => {
      const id = item[key];
      combinedMap.set(id, (combinedMap.get(id) || 0) + item.count);
    });

    const newValueKey = newValue[key];
    combinedMap.set(newValueKey, (combinedMap.get(newValueKey) || 0) + 1);

    return Array.from(combinedMap, ([keyValue, count]) => ({
      [key]: keyValue,
      count,
    }));
  }

  function combineAndGroup(existing = [], additional = [], key) {
    const combinedMap = new Map();

    existing.forEach((item) => {
      const identifier = item[key];
      combinedMap.set(
        identifier,
        (combinedMap.get(identifier) || 0) + item.count
      );
    });

    additional.forEach((item) => {
      const identifier = item[key];
      combinedMap.set(
        identifier,
        (combinedMap.get(identifier) || 0) + item.count
      );
    });

    return Array.from(combinedMap, ([keyValue, count]) => ({
      [key]: keyValue,
      count,
    }));
  }

  function combineAndGroupMultiKey(existing = [], additional = [], keys = []) {
    const combinedMap = new Map();

    function getIdentifier(item) {
      return keys.map((key) => item[key]).join("|");
    }

    existing.forEach((item) => {
      const id = getIdentifier(item);
      combinedMap.set(id, (combinedMap.get(id) || 0) + item.count);
    });

    additional.forEach((item) => {
      const id = getIdentifier(item);
      combinedMap.set(id, (combinedMap.get(id) || 0) + item.count);
    });

    return Array.from(combinedMap, ([id, count]) => {
      const keyValues = id.split("|");
      const obj = {};
      keys.forEach((key, i) => {
        obj[key] = keyValues[i];
      });
      obj.count = count;
      return obj;
    });
  }

  const updateCount = (array, fieldName, value) => {
    const existingItem = array.find((item) => item[fieldName] === value);
    if (existingItem) {
      existingItem.count += 1;
    } else {
      array.push({ [fieldName]: value, count: 1 });
    }
  };

  function updateCountMultiKey(arr, keys, obj) {
    const existingIndex = arr.findIndex((item) =>
      keys.every((key) => item[key] === obj[key])
    );

    if (existingIndex !== -1) {
      arr[existingIndex].count += 1;
    } else {
      arr.push({ ...obj, count: 1 });
    }
  }

  function getAgeRange(age) {
    if (age <= 15) return "0-15";
    if (age <= 25) return "16-25";
    if (age <= 60) return "26-60";
    return "61-100";
  }

  async function saveFileLocally(file, prefix = "doc") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        const arrayBuffer = reader.result;

        const result = await window.ipcRenderer.invoke("save-file-buffer", {
          fileName: `${prefix}_${Date.now()}_${file.name}`,
          buffer: arrayBuffer,
        });

        if (result.success) {
          resolve(result.savedPath);
        } else {
          reject(result.error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  const uploadFileToCloudinary = async (file, identifier) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ejamaat");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dqcbtodi4/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        url: data.secure_url,
        identifier,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // ✅ MAIN SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    setError("");

    try {
      if (!isOnline) {
        // OFFLINE MODE
        if (family_id) {
          // UPDATE FAMILY
          if (userData.rationCardDoc instanceof File) {
            try {
              const savedPath = await saveFileLocally(
                userData.rationCardDoc,
                "rationCardDoc"
              );
              userData.rationCardDoc = savedPath;
            } catch (err) {
              console.error("Failed to save Ration Card:", err);
            }
          }

          if (Array.isArray(userData.members)) {
            const updatedMembers = await Promise.all(
              userData.members.map(async (member, index) => {
                if (member.aadhaarCardDoc instanceof File) {
                  try {
                    const savedPath = await saveFileLocally(
                      member.aadhaarCardDoc,
                      `aadhaar_member_${index}`
                    );
                    return { ...member, aadhaarCardDoc: savedPath };
                  } catch (err) {
                    console.error(
                      `Failed to save Aadhaar for member ${index + 1}:`,
                      err
                    );
                    return member;
                  }
                }
                return member;
              })
            );
            userData.members = updatedMembers;
          }

          try {
            const uploadRes = await ipcRenderer.invoke("local-save-json", {
              fileName: "local-insert",
              data: userData,
            });

            if (uploadRes) {
              const mohallaDetail = allmohalla?.mohallaData?.find(
                (item) => item?._id == userData?.mohalla_id
              );
              const mohallaName = mohallaDetail?.mohallaName;
              const kariyaName = mohallaDetail?.kariyaDetails?.kariyaName;
              const kariya_id = mohallaDetail?.kariyaDetails?._id;

              const FullData = {
                ...userData,
                _id: uploadRes.updatedData[0]._id,
                mohallaDetail: [mohallaName],
              };

              const memberData = userData.members;

              const newPopulation = {
                _id: FullData?._id,
                member: memberData,
                familyData: { ...FullData, members: undefined },
              };

              let updatedPopulation = [...population].filter(
                (p) => p.familyData?._id !== family_id
              );
              updatedPopulation.push(newPopulation);

              let updatedFamily = [...allfamily].filter(
                (f) => f.familyData?._id !== family_id
              );

              const academicEducationCounts = [];
              const disablityCounts = [];
              const maritalStatusCounts = [];
              const religiousEducationCounts = [];
              const genderAgeGroupCounts = [];

              memberData.forEach((member) => {
                updateCount(
                  academicEducationCounts,
                  "academicEducationLevel",
                  member.academicEducationLevel || "Unknown"
                );
                updateCount(
                  disablityCounts,
                  "disablity",
                  member.disablity || ""
                );
                updateCount(
                  maritalStatusCounts,
                  "maritalStatus",
                  member.maritalStatus || "Unknown"
                );
                updateCount(
                  religiousEducationCounts,
                  "religiousEducationLevel",
                  member.religiousEducationLevel || "Unknown"
                );

                const gender = member.gender || "Unknown";
                const ageRange = getAgeRange(member.age || 0);
                updateCountMultiKey(
                  genderAgeGroupCounts,
                  ["gender", "ageRange"],
                  { gender, ageRange }
                );
              });

              const newFamily = {
                academicEducationCounts,
                disablityCounts,
                genderAgeGroupCounts,
                kariyaDetail: [{ kariyaName }],
                familyData: FullData,
                maritalStatusCounts,
                members: memberData,
                mohallaDetail: [{ mohallaName }],
                religiousEducationCounts,
                _id: FullData?._id,
              };

              updatedFamily.push(newFamily);

              const TotaldisablityCounts = combineAndGroup(
                disablityCounts,
                allmohalla?.disablityCounts,
                "disablity"
              );

              const TotalGenderAgeGroupCounts = combineAndGroupMultiKey(
                genderAgeGroupCounts,
                allmohalla?.genderAgeGroupCounts || [],
                ["gender", "ageRange"]
              );

              const TotalGeneralEducationCount = combineAndGroup(
                academicEducationCounts,
                allmohalla?.generalEducationCount,
                "academicEducationLevel"
              );

              const TotalReligiousEducationCount = combineAndGroup(
                religiousEducationCounts,
                allmohalla?.religiousEducationCounts,
                "religiousEducationLevel"
              );

              const TotalmaritalStatusCounts = combineAndGroup(
                maritalStatusCounts,
                allmohalla?.maritalStatusCounts,
                "maritalStatus"
              );

              const TotalHousesCount = combineAndGroupCounts(
                allmohalla?.HousesCount,
                { houseOwnership: FullData?.houseOwnership },
                "houseOwnership"
              );

              const TotalRationCardCount = combineAndGroupCounts(
                allmohalla?.rationCardCounts,
                { rationCard: FullData?.rationCard },
                "rationCard"
              );

              const TotalwaterSupplyCount = combineAndGroupCounts(
                allmohalla?.waterSupplyCounts,
                { waterSupply: FullData?.waterSupply },
                "waterSupply"
              );

              const TotalwashroomCount = combineAndGroupCounts(
                allmohalla?.washroomCount,
                { washroom: FullData?.washroom },
                "washroom"
              );

              const TotalElectricityCount = combineAndGroupCounts(
                allmohalla?.electricityCount,
                { electricity: FullData?.electricity },
                "electricity"
              );

              const TotalCount = allmohalla?.TotalCount[0] || {};
              const updateTotalCount = {
                familyCount: TotalCount?.familyCount || 0,
                totalMembersCount:
                  (TotalCount?.totalMembersCount || 0) +
                  (memberData?.length || 0) -
                  (userData?.members?.length || 0),
              };

              let AllMohalla = allmohalla?.mohallaData;
              const selectedMohalla = AllMohalla?.find(
                (m) => m?._id === FullData?.mohalla_id
              );

              const updatedSelectedMohalla = {
                ...selectedMohalla,
                HousesCount: combineAndGroupCounts(
                  selectedMohalla?.HousesCount,
                  { houseOwnership: FullData?.houseOwnership },
                  "houseOwnership"
                ),
                disablityCounts: combineAndGroup(
                  disablityCounts,
                  selectedMohalla?.disablityCounts,
                  "disablity"
                ),
                genderAgeGroupCounts: combineAndGroupMultiKey(
                  genderAgeGroupCounts,
                  selectedMohalla?.genderAgeGroupCounts,
                  ["gender", "ageRange"]
                ),
                electricityCount: combineAndGroupCounts(
                  selectedMohalla?.electricityCount,
                  { electricity: FullData?.electricity },
                  "electricity"
                ),
                familyCount: selectedMohalla?.familyCount,
                familyDetail: userData,
                generalEducationCount: combineAndGroup(
                  academicEducationCounts,
                  selectedMohalla?.generalEducationCount,
                  "academicEducationLevel"
                ),
                rationCardCounts: combineAndGroupCounts(
                  selectedMohalla?.rationCardCounts,
                  { rationCard: FullData?.rationCard },
                  "rationCard"
                ),
                religiousEducationCounts: combineAndGroup(
                  religiousEducationCounts,
                  selectedMohalla?.religiousEducationCounts,
                  "religiousEducationLevel"
                ),
                totalMembersCount:
                  (selectedMohalla?.totalMembersCount || 0) +
                  (memberData?.length || 0),
                washroomCount: combineAndGroupCounts(
                  selectedMohalla?.washroomCount,
                  { washroom: FullData?.washroom },
                  "washroom"
                ),
                waterSupplyCounts: combineAndGroupCounts(
                  selectedMohalla?.waterSupplyCounts,
                  { waterSupply: FullData?.waterSupply },
                  "waterSupply"
                ),
              };

              AllMohalla = AllMohalla.filter(
                (m) => m?._id !== FullData?.mohalla_id
              );
              AllMohalla.push(updatedSelectedMohalla);

              const updateMohalla = {
                HousesCount: TotalHousesCount,
                TotalCount: [updateTotalCount],
                disablityCounts: TotaldisablityCounts,
                genderAgeGroupCounts: TotalGenderAgeGroupCounts,
                electricityCount: TotalElectricityCount,
                generalEducationCount: TotalGeneralEducationCount,
                maritalStatusCounts: TotalmaritalStatusCounts,
                mohallaData: AllMohalla,
                rationCardCounts: TotalRationCardCount,
                religiousEducationCounts: TotalReligiousEducationCount,
                washroomCount: TotalwashroomCount,
                waterSupplyCounts: TotalwaterSupplyCount,
              };

              const updatedKariyas = allkariyas.map((item) => {
                if (item._id === kariya_id) {
                  const populationCount =
                    (item?.populationCount || 0) +
                    (memberData?.length || 0) -
                    (userData?.members?.length || 0);
                  return {
                    ...item,
                    populationCount: populationCount,
                  };
                }
                return item;
              });

              await setPopulation(updatedPopulation);
              await setAllFamily(updatedFamily);
              await setAllMohalla(updateMohalla);

              const requiredFiles = [
                "Population",
                "mohallaDetail",
                "familyDetail",
                "kariyaDetail",
              ];
              const data = [
                updatedPopulation,
                updateMohalla,
                updatedFamily,
                updatedKariyas,
              ];

              saveToFile(requiredFiles, data);
              setResponse("Family updated successfully!");
              setLoading(false);
              nav("/family");
            }
          } catch (error) {
            console.error("Error during update:", error);
            setError("Failed to update family. Please try again.");
            setLoading(false);
          }
        } else {
          // INSERT NEW FAMILY (OFFLINE)
          if (userData.rationCardDoc instanceof File) {
            try {
              const savedPath = await saveFileLocally(
                userData.rationCardDoc,
                "rationCardDoc"
              );
              userData.rationCardDoc = savedPath;
            } catch (err) {
              console.error("Failed to save Ration Card:", err);
            }
          }

          if (userData.members && Array.isArray(userData.members)) {
            const updatedMembers = await Promise.all(
              userData.members.map(async (member, index) => {
                if (member.aadhaarCardDoc instanceof File) {
                  try {
                    const savedPath = await saveFileLocally(
                      member.aadhaarCardDoc,
                      `aadhaar_member_${index}`
                    );
                    return { ...member, aadhaarCardDoc: savedPath };
                  } catch (err) {
                    console.error(
                      `Failed to save Aadhaar for member ${index + 1}:`,
                      err
                    );
                    return member;
                  }
                }
                return member;
              })
            );
            userData.members = updatedMembers;
          }

          try {
            const uploadRes = await ipcRenderer.invoke("local-save-json", {
              fileName: "local-insert",
              data: userData,
            });

            if (uploadRes) {
              let FullData = {
                ...userData,
                _id: uploadRes.updatedData[0]?._id,
              };
              delete FullData?.members;
              let memberData = userData.members;

              let newPopulation = {
                _id: FullData?._id,
                member: memberData,
                familyData: FullData,
              };

              let updatedPopulation = [...population];
              updatedPopulation.push(newPopulation);
              await setPopulation(updatedPopulation);

              let academicEducationCounts = [];
              let disablityCounts = [];
              let maritalStatusCounts = [];
              let religiousEducationCounts = [];
              const genderAgeGroupCounts = [];

              if (Array.isArray(memberData)) {
                memberData.forEach((member) => {
                  updateCount(
                    academicEducationCounts,
                    "academicEducationLevel",
                    member.academicEducationLevel || "Unknown"
                  );
                  updateCount(
                    disablityCounts,
                    "disablity",
                    member.disablity || ""
                  );
                  updateCount(
                    maritalStatusCounts,
                    "maritalStatus",
                    member.maritalStatus || "Unknown"
                  );
                  updateCount(
                    religiousEducationCounts,
                    "religiousEducationLevel",
                    member.religiousEducationLevel || "Unknown"
                  );

                  const gender = member.gender || "Unknown";
                  const ageRange = getAgeRange(member.age || 0);
                  updateCountMultiKey(
                    genderAgeGroupCounts,
                    ["gender", "ageRange"],
                    { gender, ageRange }
                  );
                });
              }

              let mohallaDetail = allmohalla?.mohallaData?.find(
                (item) => item?._id == FullData?.mohalla_id
              );

              let mohallaName = mohallaDetail?.mohallaName;
              let kariyaName = mohallaDetail?.kariyaDetails?.kariyaName;
              let kariya_id = mohallaDetail?.kariyaDetails?._id;

              let newFamily = {
                academicEducationCounts,
                disablityCounts,
                genderAgeGroupCounts,
                kariyaDetail: [{ kariyaName }],
                familyData: FullData,
                maritalStatusCounts,
                members: memberData,
                mohallaDetail: [{ mohallaName }],
                religiousEducationCounts,
                _id: FullData?._id,
              };

              let updatedFamily = [...allfamily];
              updatedFamily.push(newFamily);
              await setAllFamily(updatedFamily);

              const TotaldisablityCounts = combineAndGroup(
                disablityCounts || [],
                allmohalla?.disablityCounts || [],
                "disablity"
              );

              const TotalGenderAgeGroupCounts = combineAndGroupMultiKey(
                genderAgeGroupCounts || [],
                allmohalla?.genderAgeGroupCounts || [],
                ["gender", "ageRange"]
              );

              const TotalGeneralEducationCount = combineAndGroup(
                academicEducationCounts || [],
                allmohalla?.generalEducationCount || [],
                "academicEducationLevel"
              );

              const TotalReligiousEducationCount = combineAndGroup(
                religiousEducationCounts || [],
                allmohalla?.religiousEducationCounts || [],
                "religiousEducationLevel"
              );

              const TotalmaritalStatusCounts = combineAndGroup(
                maritalStatusCounts || [],
                allmohalla?.maritalStatusCounts || [],
                "maritalStatus"
              );

              const TotalHousesCount = combineAndGroupCounts(
                allmohalla?.HousesCount,
                { houseOwnership: FullData?.houseOwnership },
                "houseOwnership"
              );

              const TotalRationCardCount = combineAndGroupCounts(
                allmohalla?.rationCardCounts,
                { rationCard: FullData?.rationCard },
                "rationCard"
              );

              const TotalwaterSupplyCount = combineAndGroupCounts(
                allmohalla?.waterSupplyCounts,
                { waterSupply: FullData?.waterSupply },
                "waterSupply"
              );

              const TotalwashroomCount = combineAndGroupCounts(
                allmohalla?.washroomCount,
                { washroom: FullData?.washroom },
                "washroom"
              );

              const TotalElectricityCount = combineAndGroupCounts(
                allmohalla?.electricityCount,
                { electricity: FullData?.electricity },
                "electricity"
              );

              const TotalCount = allmohalla?.TotalCount[0] || {};
              const updateTotalCount = {
                familyCount: (TotalCount?.familyCount || 0) + 1,
                totalMembersCount:
                  (TotalCount?.totalMembersCount || 0) +
                  (memberData?.length || 0),
              };

              let AllMohalla = allmohalla?.mohallaData;
              let selectedMohalla = AllMohalla?.find(
                (mohalla) => mohalla?._id === FullData?.mohalla_id
              );

              const updatedSelectedMohalla = {
                ...selectedMohalla,
                HousesCount: combineAndGroupCounts(
                  selectedMohalla?.HousesCount,
                  { houseOwnership: FullData?.houseOwnership },
                  "houseOwnership"
                ),
                disablityCounts: combineAndGroup(
                  disablityCounts,
                  selectedMohalla?.disablityCounts,
                  "disablity"
                ),
                genderAgeGroupCounts: combineAndGroupMultiKey(
                  genderAgeGroupCounts,
                  selectedMohalla?.genderAgeGroupCounts || [],
                  ["gender", "ageRange"]
                ),
                electricityCount: combineAndGroupCounts(
                  selectedMohalla?.electricityCount,
                  { electricity: FullData?.electricity },
                  "electricity"
                ),
                familyCount: (selectedMohalla?.familyCount || 0) + 1,
                familyDetail: userData,
                generalEducationCount: combineAndGroup(
                  academicEducationCounts,
                  selectedMohalla?.generalEducationCount || [],
                  "academicEducationLevel"
                ),
                rationCardCounts: combineAndGroupCounts(
                  selectedMohalla?.rationCardCounts,
                  { rationCard: FullData?.rationCard },
                  "rationCard"
                ),
                religiousEducationCounts: combineAndGroup(
                  religiousEducationCounts,
                  selectedMohalla?.religiousEducationCounts || [],
                  "religiousEducationLevel"
                ),
                totalMembersCount:
                  (selectedMohalla?.totalMembersCount || 0) +
                  (memberData?.length || 0),
                washroomCount: combineAndGroupCounts(
                  selectedMohalla?.washroomCount,
                  { washroom: FullData?.washroom },
                  "washroom"
                ),
                waterSupplyCounts: combineAndGroupCounts(
                  selectedMohalla?.waterSupplyCounts,
                  { waterSupply: FullData?.waterSupply },
                  "waterSupply"
                ),
              };

              AllMohalla = AllMohalla?.filter(
                (mohalla) => mohalla?._id !== FullData?.mohalla_id
              );

              AllMohalla.push({ ...updatedSelectedMohalla });

              const updatedKariyas = allkariyas.map((item) => {
                if (item._id === kariya_id) {
                  const familyCount = (item?.familyCount || 0) + 1;
                  const populationCount =
                    (item?.populationCount || 0) + (memberData?.length || 0);
                  return {
                    ...item,
                    familyCount: familyCount,
                    populationCount: populationCount,
                  };
                }
                return item;
              });

              await setAllMohalla(AllMohalla);

              let updateMohalla = {
                HousesCount: TotalHousesCount,
                TotalCount: [updateTotalCount],
                disablityCounts: TotaldisablityCounts,
                genderAgeGroupCounts: TotalGenderAgeGroupCounts,
                electricityCount: TotalElectricityCount,
                generalEducationCount: TotalGeneralEducationCount,
                maritalStatusCounts: TotalmaritalStatusCounts,
                mohallaData: AllMohalla,
                rationCardCounts: TotalRationCardCount,
                religiousEducationCounts: TotalReligiousEducationCount,
                washroomCount: TotalwashroomCount,
                waterSupplyCounts: TotalwaterSupplyCount,
              };

              setAllMohalla(updateMohalla);

              const requiredFiles = [
                "Population",
                "mohallaDetail",
                "familyDetail",
                "kariyaDetail",
              ];
              const data = [
                updatedPopulation,
                updateMohalla,
                updatedFamily,
                updatedKariyas,
              ];

              saveToFile(requiredFiles, data);
              setResponse("Family added successfully!");
              setLoading(false);
              nav("/family");
            }
          } catch (error) {
            console.error("Error during insert:", error);
            setError("Failed to insert family. Please try again.");
            setLoading(false);
          }
        }
      } else {
        // ONLINE MODE
        if (family_id) {
          // UPDATE - ONLINE
          const fileUploadPromises = [];

          if (
            userData.rationCardDoc &&
            typeof userData.rationCardDoc !== "string"
          ) {
            fileUploadPromises.push(
              uploadFileToCloudinary(userData.rationCardDoc, "rationCardDoc")
            );
          }

          if (userData.members && Array.isArray(userData.members)) {
            userData.members.forEach((member, index) => {
              if (
                member.aadhaarCardDoc &&
                (typeof member.aadhaarCardDoc !== "string" ||
                  !member.aadhaarCardDoc.startsWith("http"))
              ) {
                fileUploadPromises.push(
                  uploadFileToCloudinary(
                    member.aadhaarCardDoc,
                    `member_${index}`
                  )
                );
              }
            });
          }

          try {
            const uploadedFileDetails = await Promise.all(fileUploadPromises);

            let fileIndex = 0;
            if (
              userData.rationCardDoc &&
              typeof userData.rationCardDoc !== "string"
            ) {
              userData.rationCardDoc = uploadedFileDetails[fileIndex]?.url;
              fileIndex++;
            }

            if (userData.members && Array.isArray(userData.members)) {
              userData.members = userData.members.map((member) => {
                if (
                  member.aadhaarCardDoc &&
                  (typeof member.aadhaarCardDoc !== "string" ||
                    !member.aadhaarCardDoc.startsWith("http"))
                ) {
                  member.aadhaarCardDoc = uploadedFileDetails[fileIndex]?.url;
                  fileIndex++;
                }
                return member;
              });
            }

            delete userData.member_id;

            const uploadRees = await ipcRenderer.invoke(
              "addorupdatefamily",
              userData
            );

            if (uploadRees.success) {
              setResponse("Family updated successfully!");
              await setAddedNew(true);
              setLoading(false);
              nav("/family");
            } else {
              setError("Failed to update family");
              setLoading(false);
            }
          } catch (error) {
            console.error("Failed to update family:", error);
            setError("Failed to update family. Please try again.");
            setLoading(false);
          }
        } else {
          // INSERT - ONLINE
          const fileUploadPromises = [];

          if (
            userData.rationCardDoc &&
            typeof userData.rationCardDoc !== "string"
          ) {
            fileUploadPromises.push(
              uploadFileToCloudinary(userData.rationCardDoc, "rationCardDoc")
            );
          }

          if (userData.members && Array.isArray(userData.members)) {
            userData.members.forEach((member, index) => {
              if (
                member.aadhaarCardDoc &&
                (typeof member.aadhaarCardDoc !== "string" ||
                  !member.aadhaarCardDoc.startsWith("http"))
              ) {
                fileUploadPromises.push(
                  uploadFileToCloudinary(
                    member.aadhaarCardDoc,
                    `member_${index}`
                  )
                );
              }
            });
          }

          try {
            const uploadedFileDetails = await Promise.all(fileUploadPromises);
            const updatedUserData = await mapUploadedFilesToData(
              uploadedFileDetails,
              userData
            );

            const uploadRees = await ipcRenderer.invoke(
              "addorupdatefamily",
              updatedUserData
            );

            if (uploadRees.success) {
              setResponse("Family added successfully!");
              await setAddedNew(true);
              setLoading(false);
              nav("/family");
            } else {
              setError("Failed to add family");
              setLoading(false);
            }
          } catch (error) {
            console.error("Failed to add family:", error);
            setError("Failed to add family. Please try again.");
            setLoading(false);
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleChangeRationCard = (e) => {
    const fileInput = e.target;
    const file = e.target.files[0];

    if (file) {
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ];

      if (!validImageTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPG, JPEG, PNG or PDF).");
        fileInput.value = "";
        return;
      }

      setUserData({ ...userData, rationCardDoc: file });
    }
  };

  // Sync kariya & mohalla state when context data loads
  useEffect(() => {
    if (allkariyas && allkariyas.length > 0) {
      setKariya(allkariyas);
    }
  }, [allkariyas]);

  useEffect(() => {
    if (!family_id && !userData.kariya_id && allmohalla?.mohallaData) {
      setMohalla(allmohalla.mohallaData);
    }
  }, [allmohalla, family_id, userData.kariya_id]);

  const handleChangeKariya = (value) => {
    if (family_id) return; // Prevent change when editing

    setUserData((prev) => ({ ...prev, kariya_id: value, mohalla_id: "" }));

    const filteredMohalla = allmohalla?.mohallaData?.filter((item) => {
      const kId = Array.isArray(item?.kariyaDetails?._id)
        ? item?.kariyaDetails?._id[0]
        : item?.kariyaDetails?._id || item?.kariyaDetails;
      return kId?.toString() === value?.toString();
    });

    setMohalla(filteredMohalla || []);
  };

  const handleChangeMohalla = (value) => {
    if (family_id) return; // Prevent change when editing

    let selected_mohalla = mohalla
      ?.filter((item) => item?._id?.toString() === value?.toString())
      .map((item) => item?.mohallaName);
    let selectedKariyaId = mohalla
      ?.filter((item) => item?._id?.toString() === value?.toString())
      .map((item) =>
        Array.isArray(item?.kariyaDetails?._id)
          ? item?.kariyaDetails?._id[0]
          : item?.kariyaDetails?._id || item?.kariyaDetails
      );

    let formNo = null;
    let existingFormNo = mohalla
      ?.find((item) => item?._id?.toString() === value?.toString())
      ?.familyDetail?.map((family) => family?.form_no);

    if (existingFormNo && existingFormNo.length > 0) {
      let lastFormNo = existingFormNo[existingFormNo.length - 1];
      let prefixMatch = lastFormNo?.match(/^[A-Za-z]+/);
      let numberMatch = lastFormNo?.match(/\d+$/);
      if (prefixMatch && numberMatch) {
        let prefix = prefixMatch[0];
        let number = parseInt(numberMatch[0], 10);
        let incrementedNumber = (number + 1).toString().padStart(3, "0");
        formNo = `${prefix}${incrementedNumber}`;
      }
    } else if (selected_mohalla?.[0]) {
      let prefix = selected_mohalla[0].toUpperCase().slice(0, 3);
      formNo = `${prefix}001`;
    }

    setUserData((prev) => ({
      ...prev,
      mohalla_id: value,
      kariya_id: selectedKariyaId?.[0] || prev.kariya_id,
      form_no: formNo || prev.form_no,
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-64px)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {family_id ? "Edit Family" : "Register Family"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Please fill in the details accurately to ensure proper record-keeping.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* House Owner's Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              House Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Kariya Name - DISABLED WHEN EDITING */}
              <div className="space-y-2">
                <Label htmlFor="kariya_id">Kariya Name</Label>
                <Select
                  value={userData.kariya_id || ""}
                  onValueChange={handleChangeKariya}
                  disabled={!!family_id}
                >
                  <SelectTrigger id="kariya_id" disabled={!!family_id}>
                    <SelectValue placeholder="Select Kariya" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {kariya?.map((item) => (
                      <SelectItem key={item?._id} value={item._id}>
                        {item.kariyaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {family_id && (
                  <p className="text-xs text-muted-foreground">
                    Cannot change Kariya during editing
                  </p>
                )}
              </div>

              {/* Mohalla Name - DISABLED WHEN EDITING */}
              <div className="space-y-2">
                <Label htmlFor="mohalla_id">Mohalla Name</Label>
                <Select
                  value={userData.mohalla_id || ""}
                  onValueChange={handleChangeMohalla}
                  disabled={!!family_id}
                >
                  <SelectTrigger id="mohalla_id" disabled={!!family_id}>
                    <SelectValue placeholder="Select Mohalla" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {mohalla?.map((item) => (
                      <SelectItem key={item?._id} value={item._id}>
                        {item.mohallaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {family_id && (
                  <p className="text-xs text-muted-foreground">
                    Cannot change Mohalla during editing
                  </p>
                )}
              </div>

              {/* Form Number */}
              <div className="space-y-2">
                <Label htmlFor="form_no">Form No (Auto Generated)</Label>
                <Input
                  id="form_no"
                  name="form_no"
                  value={userData.form_no}
                  disabled
                />
              </div>

              {/* Door Number */}
              <div className="space-y-2">
                <Label htmlFor="doorNumber">Door Number</Label>
                <Input
                  id="doorNumber"
                  name="doorNumber"
                  value={userData.doorNumber}
                  onChange={handleChange}
                />
              </div>

              {/* House Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="houseOwnerName">House Owner Name</Label>
                <Input
                  id="houseOwnerName"
                  name="houseOwnerName"
                  value={userData.houseOwnerName}
                  onChange={handleChange}
                />
              </div>

              {/* Father/Husband Name */}
              <div className="space-y-2">
                <Label htmlFor="fatherOrHusbandName">Father/Husband Name</Label>
                <Input
                  id="fatherOrHusbandName"
                  name="fatherOrHusbandName"
                  value={userData.fatherOrHusbandName}
                  onChange={handleChange}
                />
              </div>

              {/* House Address */}
              <div className="space-y-2">
                <Label htmlFor="houseAddress">House Address</Label>
                <Input
                  id="houseAddress"
                  name="houseAddress"
                  value={userData.houseAddress}
                  onChange={handleChange}
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="text"
                  maxLength={10}
                  value={userData.mobileNumber}
                  onChange={handleChange}
                />
                {mobileNumberError && (
                  <p className="text-destructive text-sm">{mobileNumberError}</p>
                )}
              </div>

              {/* House Ownership */}
              <div className="space-y-2">
                <Label htmlFor="houseOwnership">House Ownership</Label>
                <Select
                  value={userData.houseOwnership}
                  onValueChange={(value) =>
                    setUserData({ ...userData, houseOwnership: value })
                  }
                >
                  <SelectTrigger id="houseOwnership">
                    <SelectValue placeholder="Select Ownership" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
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

              {/* Agreement Exp Date */}
              {userData.houseOwnership === "Rented" && (
                <div className="space-y-2">
                  <Label htmlFor="agreementExpDate">Agreement Exp Date</Label>
                  <Input
                    id="agreementExpDate"
                    name="agreementExpDate"
                    type="date"
                    value={userData.agreementExpDate}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Total Years */}
              <div className="space-y-2">
                <Label htmlFor="totalYearsOfResidence">
                  Total Years of Residence
                </Label>
                <Input
                  id="totalYearsOfResidence"
                  name="totalYearsOfResidence"
                  type="number"
                  min="0"
                  value={userData.totalYearsOfResidence}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 0 || e.target.value === "") {
                      handleChange(e);
                    }
                  }}
                />
              </div>

              {/* Ration Card */}
              <div className="space-y-2">
                <Label htmlFor="rationCard">Ration Card</Label>
                <Select
                  value={userData.rationCard || ""}
                  onValueChange={(value) =>
                    setUserData({ ...userData, rationCard: value })
                  }
                >
                  <SelectTrigger id="rationCard">
                    <SelectValue placeholder="Select Ration Card" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="BPL">BPL</SelectItem>
                    <SelectItem value="APL">APL</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ration Card Doc */}
              <div className="space-y-2">
                <Label htmlFor="rationCardDoc">Ration Card Document</Label>
                <Input
                  id="rationCardDoc"
                  name="rationCardDoc"
                  type="file"
                  onChange={handleChangeRationCard}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </div>

              {/* Water Supply */}
              <div className="space-y-2">
                <Label htmlFor="waterSupply">Water Supply</Label>
                <Select
                  value={userData.waterSupply || ""}
                  onValueChange={(value) =>
                    setUserData({ ...userData, waterSupply: value })
                  }
                >
                  <SelectTrigger id="waterSupply">
                    <SelectValue placeholder="Select Water Supply" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="Own Well">Own Well</SelectItem>
                    <SelectItem value="Pipeline">Pipeline</SelectItem>
                    <SelectItem value="Public Well">Public Well</SelectItem>
                    <SelectItem value="Public Pipeline">
                      Public Pipeline
                    </SelectItem>
                    <SelectItem value="Borewell">Borewell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Electricity */}
              <div className="space-y-2">
                <Label htmlFor="electricity">Electricity</Label>
                <Select
                  value={userData.electricity || ""}
                  onValueChange={(value) =>
                    setUserData({ ...userData, electricity: value })
                  }
                >
                  <SelectTrigger id="electricity">
                    <SelectValue placeholder="Select Electricity" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Washroom */}
              <div className="space-y-2">
                <Label htmlFor="washroom">Washroom</Label>
                <Select
                  value={userData.washroom || ""}
                  onValueChange={(value) =>
                    setUserData({ ...userData, washroom: value })
                  }
                >
                  <SelectTrigger id="washroom">
                    <SelectValue placeholder="Select Washroom" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Shared">Shared</SelectItem>
                    <SelectItem value="Public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Member Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {userData.members.map((member, index) => {
              let firstIndex = index === 0;

              return (
                <div
                  key={index}
                  className={`pb-4 ${
                    index !== userData.members.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  {firstIndex && (
                    <div className="flex flex-row items-center gap-2 rounded-md p-4 mb-4 bg-primary/5 border border-primary/20">
                      <Users className="h-6 w-6 text-primary" />
                      <p className="text-primary font-medium text-base">
                        Details of the Family Head
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`fullName_${index}`}>Full Name</Label>
                      <Input
                        id={`fullName_${index}`}
                        name="fullName"
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor={`gender_${index}`}>Gender</Label>
                      <Select
                        value={member.gender || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "gender", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`gender_${index}`}>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Relation to Owner */}
                    <div className="space-y-2">
                      <Label htmlFor={`relationToOwner_${index}`}>
                        Relation to Owner
                      </Label>
                      <Select
                        value={member.relationToOwner || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "relationToOwner", value },
                          });
                        }}
                        disabled={firstIndex}
                      >
                        <SelectTrigger
                          id={`relationToOwner_${index}`}
                          disabled={firstIndex}
                        >
                          <SelectValue placeholder="Select Relation" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto">
                          {index === 0 && (
                            <SelectItem value="Family Head">Family Head</SelectItem>
                          )}
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Wife">Wife</SelectItem>
                          <SelectItem value="Husband">Husband</SelectItem>
                          <SelectItem value="Son">Son</SelectItem>
                          <SelectItem value="Daughter">Daughter</SelectItem>
                          <SelectItem value="Father_In_Law">Father In Law</SelectItem>
                          <SelectItem value="Mother_In_Law">Mother In Law</SelectItem>
                          <SelectItem value="Daughter_In_Law">Daughter In Law</SelectItem>
                          <SelectItem value="Son_In_Law">Son In Law</SelectItem>
                          <SelectItem value="Sister_In_Law">Sister In Law</SelectItem>
                          <SelectItem value="Brother_In_Law">Brother In Law</SelectItem>
                          <SelectItem value="Brother">Brother</SelectItem>
                          <SelectItem value="Sister">Sister</SelectItem>
                          <SelectItem value="Grandson">Grandson</SelectItem>
                          <SelectItem value="Granddaughter">Granddaughter</SelectItem>
                          <SelectItem value="Grandmother">Grandmother</SelectItem>
                          <SelectItem value="Grandfather">Grandfather</SelectItem>
                          <SelectItem value="Cousine Sister">Cousine Sister</SelectItem>
                          <SelectItem value="Cousine Brother">Cousine Brother</SelectItem>
                          <SelectItem value="Nephew">Nephew (Brother/Sister Son)</SelectItem>
                          <SelectItem value="Niece">Niece (Brother/Sister Daughter)</SelectItem>
                          <SelectItem value="Grandnephew">Grandnephew (Brother/Sister Grandson)</SelectItem>
                          <SelectItem value="Grandniece">Grandniece (Brother/Sister Granddaughter)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Religious Education */}
                    <div className="space-y-2">
                      <Label htmlFor={`religiousEducationLevel_${index}`}>
                        Religious Education
                      </Label>
                      <Select
                        value={member.religiousEducationLevel || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: {
                              name: "religiousEducationLevel",
                              value,
                            },
                          });
                        }}
                      >
                        <SelectTrigger id={`religiousEducationLevel_${index}`}>
                          <SelectValue placeholder="Select Education" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Below 5">Below 5</SelectItem>
                          <SelectItem value="Below 10">Below 10</SelectItem>
                          <SelectItem value="10 + 2">10 + 2</SelectItem>
                          <SelectItem value="Alim">Alim</SelectItem>
                          <SelectItem value="Ustad">Ustad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Academic Education */}
                    <div className="space-y-2">
                      <Label htmlFor={`academicEducationLevel_${index}`}>
                        Academic Education
                      </Label>
                      <Select
                        value={member.academicEducationLevel || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: {
                              name: "academicEducationLevel",
                              value,
                            },
                          });
                        }}
                      >
                        <SelectTrigger id={`academicEducationLevel_${index}`}>
                          <SelectValue placeholder="Select Education" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
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
                        <Label htmlFor={`educationSpecialization_${index}`}>
                          Specialization
                        </Label>
                        <Input
                          id={`educationSpecialization_${index}`}
                          name="educationSpecialization"
                          value={member.educationSpecialization}
                          onChange={(e) => handleMemberChange(index, e)}
                        />
                      </div>
                    )}

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor={`dateOfBirth_${index}`}>
                        Date of Birth
                      </Label>
                      <Input
                        id={`dateOfBirth_${index}`}
                        name="dateOfBirth"
                        type="date"
                        value={member.dateOfBirth}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Sayyed or Malabari */}
                    <div className="space-y-2">
                      <Label htmlFor={`sayyedOrMalabari_${index}`}>
                        Sayyed or Malabari
                      </Label>
                      <Select
                        value={member.sayyedOrMalabari || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "sayyedOrMalabari", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`sayyedOrMalabari_${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Sayyed">Sayyed</SelectItem>
                          <SelectItem value="Malabari">Malabari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Religious Principle */}
                    <div className="space-y-2">
                      <Label htmlFor={`religiousPrinciple_${index}`}>
                        Religious Principle
                      </Label>
                      <Input
                        id={`religiousPrinciple_${index}`}
                        name="religiousPrinciple"
                        value={member.religiousPrinciple}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Occupation */}
                    <div className="space-y-2">
                      <Label htmlFor={`occupation_${index}`}>Occupation</Label>
                      <Input
                        id={`occupation_${index}`}
                        name="occupation"
                        value={member.occupation}
                        onChange={(e) => handleMemberChange(index, e)}
                      />
                    </div>

                    {/* Annual Income */}
                    <div className="space-y-2">
                      <Label htmlFor={`annualIncome_${index}`}>
                        Annual Income
                      </Label>
                      <Input
                        id={`annualIncome_${index}`}
                        name="annualIncome"
                        type="number"
                        value={member.annualIncome}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (value >= 0 || e.target.value === "") {
                            handleMemberChange(index, e);
                          }
                        }}
                      />
                    </div>

                    {/* Voter ID */}
                    <div className="space-y-2">
                      <Label htmlFor={`voterId_${index}`}>Voter ID</Label>
                      <Select
                        value={member.voterId || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "voterId", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`voterId_${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Voter List Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`voterListName_${index}`}>
                        Voter List Name
                      </Label>
                      <Select
                        value={member.voterListName || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "voterListName", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`voterListName_${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aadhaar Card */}
                    <div className="space-y-2">
                      <Label htmlFor={`aadhaarCard_${index}`}>
                        Aadhaar Card
                      </Label>
                      <Select
                        value={member.aadhaarCard || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "aadhaarCard", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`aadhaarCard_${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Aadhaar Document */}
                    <div className="space-y-2">
                      <Label htmlFor={`aadhaarCardDoc_${index}`}>
                        Aadhaar Card Document
                      </Label>
                      <Input
                        id={`aadhaarCardDoc_${index}`}
                        name="aadhaarCardDoc"
                        type="file"
                        onChange={(e) =>
                          handleMemberChangeAadhaarCard(index, e)
                        }
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </div>

                    {/* Marital Status */}
                    <div className="space-y-2">
                      <Label htmlFor={`maritalStatus_${index}`}>
                        Marital Status
                      </Label>
                      <Select
                        value={member.maritalStatus || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "maritalStatus", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`maritalStatus_${index}`}>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Unmarried">Unmarried</SelectItem>
                          {member.gender === "Male" ? (
                            <SelectItem value="Widower">Widower</SelectItem>
                          ) : member.gender === "Female" ? (
                            <SelectItem value="Widow">Widow</SelectItem>
                          ) : (
                            <>
                              <SelectItem value="Widow">Widow</SelectItem>
                              <SelectItem value="Widower">Widower</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disability */}
                    <div className="space-y-2">
                      <Label htmlFor={`disablity_${index}`}>Disability</Label>
                      <Select
                        value={member.disablity || ""}
                        onValueChange={(value) => {
                          handleMemberChange(index, {
                            target: { name: "disablity", value },
                          });
                        }}
                      >
                        <SelectTrigger id={`disablity_${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Disability Status */}
                    {member?.disablity === "Yes" && (
                      <div className="space-y-2">
                        <Label htmlFor={`disablityStatus_${index}`}>
                          Disability Status
                        </Label>
                        <Input
                          id={`disablityStatus_${index}`}
                          name="disablityStatus"
                          value={member.disablityStatus}
                          onChange={(e) => handleMemberChange(index, e)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Add/Remove Buttons */}
                  <div className="flex justify-end gap-2 mt-4">
                    {userData.members.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeMember(index)}
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                    {userData.members.length - 1 === index && (
                      <Button type="button" onClick={addMember} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alerts */}
        {response && (
          <Alert className="border-primary bg-primary/5">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              {response}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-lg font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : family_id ? (
            "Update Family"
          ) : (
            "Register Family"
          )}
        </Button>
      </form>
    </div>
  );
}
