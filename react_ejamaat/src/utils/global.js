const TableHeadStyles = {
  fontFamily: "Poppins",
  fontSize: 17,
  fontWeight: "medium",
  color: "white",
};
const darkThemeTextFieldSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "#1a1a1a", // darkCard background
    color: "rgb(229 231 235)", // text-gray-200
    fontFamily: "Poppins",
  },
  "& .MuiInputLabel-root": {
    color: "#676D75", // iconColor (grayish)
    transition: "color 0.3s ease",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgb(73 120 56)", // appColor green on focus
  },
  "& .MuiOutlinedInput-input": {
    color: "rgb(229 231 235)", // input text color
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgb(61, 65, 76)", // border default color
    transition: "border-color 0.3s ease",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgb(73 120 56)", // green border on focus
    boxShadow: "0 0 5px rgb(73 120 56, 0.6)", // subtle green glow on focus
  },

  // ✅ Disabled state styles
  "& .Mui-disabled": {
    backgroundColor: "#2a2a2a", // darker gray
    color: "#676D75", // iconColor (grayish)

    WebkitTextFillColor: "#7a7a7a", // fixes color override in Chrome
  },
  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
    borderColor: "#3a3a3a", // dimmed border
  },
};
const darkThemeMenuItemSx = {
  backgroundColor: "#1a1a1a",
  color: "rgb(229 231 235)",
  fontFamily: "Poppins",

  "&.Mui-selected": {
    backgroundColor: "rgb(73 120 56)",
    color: "#fff",
  },

  "&:hover": {
    backgroundColor: "rgb(61, 65, 76)",
    color: "rgb(73 120 56)",
  },

  "&.Mui-disabled": {
    color: "rgb(107 114 128)", // Tailwind text-gray-500
    backgroundColor: "#1a1a1a", // keep dark background
    cursor: "not-allowed",
    opacity: 0.5,
  },
};

const dummyUser = {
  form_no: "FORM12345",
  kariya_id: "KARIYA6789",
  mohalla_id: "MOH123",
  doorNumber: "25A",
  houseOwnerName: "Abdul Rahman",
  fatherOrHusbandName: "Mohammed Ibrahim",
  houseAddress: "123 Main Street, BC Road",
  mobileNumber: "9876543210",
  houseOwnership: "Owned",
  agreementExpDate: "2028-12-31",
  totalYearsOfResidence: "12",
  rationCard: "BPL",
  waterSupply: "Municipal",
  electricity: "Yes",
  washroom: "Attached",
  rationCardDoc: "ration_card_doc.pdf",
  members: [
    {
      fullName: "Abdul Rahman",
      gender: "Male",
      relationToOwner: "Family Head",
      religiousEducationLevel: "Madrasa - Intermediate",
      academicEducationLevel: "Graduate",
      educationSpecialization: "Commerce",
      dateOfBirth: "1985-06-15",
      sayyedOrMalabari: "Sayyed",
      religiousPrinciple: "Sunni",
      occupation: "Business",
      annualIncome: "350000",
      voterId: "KA1234567",
      voterListName: "Abdul Rahman",
      aadhaarCard: "1234-5678-9012",
      maritalStatus: "Married",
      disablity: "No",
      disablityStatus: "",
      aadhaarCardDoc: "aadhaar_abdul.pdf",
    },
  ],
};

export {
  TableHeadStyles,
  darkThemeTextFieldSx,
  darkThemeMenuItemSx,
  dummyUser,
};
