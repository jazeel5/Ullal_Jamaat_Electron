const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRETE = "Con-Jamaat";

const loginAdmin = async (data) => {
  // Ensure the database connection is established before querying
  if (mongoose.connection.readyState === 1) {
    try {
      const db = mongoose.connection.db; // Access the database directly
      const collection = db.collection("members"); // Specify the collection
      // Fetch the admin data based on the normalized contact number
      let contact = Number(data?.contact);
      const admin = await collection.findOne({ phone: contact });
      // If admin not found, return false and a message
      if (!admin) {
        console.log("Admin not found");
        return { success: false, message: "Incorrect contact or password" };
      }
      // Use bcrypt to compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(
        data?.password,
        admin.password
      );
      const authToken = jwt.sign(
        { id: admin._id, role: admin.role || "super_admin" },
        JWT_SECRETE
      );
      // If password is valid, return true, otherwise false with a message
      if (isPasswordValid) {
        return { success: true, message: "Login successful", token: authToken };
      } else {
        return { success: false, message: "Incorrect contact or password" };
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      return { success: false, message: "An error occurred while logging in" }; // Return false and an error message
    }
  } else {
    console.error("MongoDB connection is not ready yet.");
    return { success: false, message: "Database connection is not ready" }; // Return false if the connection is not ready
  }
};

const updateAdmin = async (id, data) => {
  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB connection is not ready.");
    return { success: false, message: "Database connection is not ready" };
  }

  try {
    const db = mongoose.connection.db;
    const collection = db.collection("members");

    const updateFields = {};
    if (data.name) updateFields.name = data.name;
    if (data.email) updateFields.email = data.email;
    if (data.phone || data.contactNumber) {
      updateFields.phone = Number(data.phone || data.contactNumber);
    }

    // If password is being updated
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.password = hashedPassword;
    }

    // Safely extract targetId if passed as object or string
    let targetId = id;
    if (targetId && typeof targetId === "object") {
      if (targetId._id) targetId = targetId._id;
      else if (targetId.id) targetId = targetId.id;
      else if (targetId.$oid) targetId = targetId.$oid;
      else if (targetId.buffer) {
        targetId = Buffer.from(targetId.buffer).toString("hex");
      } else if (typeof targetId.toString === "function") {
        const str = targetId.toString();
        if (str !== "[object Object]") targetId = str;
      }
    }

    let adminId = null;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId.toString())) {
      adminId = new mongoose.Types.ObjectId(targetId.toString());
    }

    // Build query: search by _id, or fallback to the administrator account
    let query = adminId ? { _id: adminId } : null;
    if (!query) {
      const defaultAdmin =
        (await collection.findOne({ role: "super_admin" })) ||
        (await collection.findOne({}));
      if (defaultAdmin) {
        query = { _id: defaultAdmin._id };
        adminId = defaultAdmin._id;
      } else {
        return { success: false, message: "Admin account not found in database" };
      }
    }

    await collection.updateOne(query, { $set: updateFields });

    const updatedAdmin = await collection.findOne(query);
    if (!updatedAdmin) {
      return { success: false, message: "Admin record could not be found after update" };
    }

    return {
      success: true,
      message: data.password ? "Password updated successfully!" : "Profile updated successfully!",
      admin: {
        ...updatedAdmin,
        _id: updatedAdmin._id ? updatedAdmin._id.toString() : updatedAdmin._id,
      },
    };
  } catch (error) {
    console.error("Error updating admin:", error);
    return { success: false, message: error?.message || "An error occurred while updating" };
  }
};

const fetchAdmin = async (token) => {
  // Wait until the database connection is ready
  // const waitForConnection = async () => {
  //   while (mongoose.connection.readyState !== 1) {
  //     console.log("Waiting for MongoDB connection...");
  //     await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 2 seconds before retrying
  //   }
  // };
  // // Ensure that the database connection is ready before proceeding
  // await waitForConnection();

  try {
    // Decode the JWT token to get the admin's ID
    let adminId = null;
    try {
      const decoded = jwt.verify(token, JWT_SECRETE);
      if (decoded && decoded.id) {
        adminId = decoded.id;
      }
    } catch (tokenErr) {
      console.warn("JWT verification warning in fetchAdmin:", tokenErr.message);
    }

    const db = mongoose.connection.db; // Access the database directly
    const collection = db.collection("members"); // Specify the collection

    let admin = null;
    if (adminId && mongoose.Types.ObjectId.isValid(adminId.toString())) {
      admin = await collection.findOne({
        _id: new mongoose.Types.ObjectId(adminId.toString()),
      });
    }

    // Fallback if not found by decoded ID
    if (!admin) {
      admin =
        (await collection.findOne({ role: "super_admin" })) ||
        (await collection.findOne({}));
    }

    if (!admin) {
      return { success: false, message: "Admin not found" }; // Return message if admin not found
    }

    return {
      success: true,
      admin: {
        ...admin,
        _id: admin._id ? admin._id.toString() : admin._id, // Convert ObjectId to string
      },
    }; // Return the fetched admin data
  } catch (err) {
    console.error("Error fetching data:", err);
    return { success: false, message: "Invalid token or error occurred" }; // Return error message for invalid token or other issues
  }
};



const fetchKariyas = async () => {
  try {
    const db = mongoose.connection.db;
    const kariyaCollection = db.collection("kariyas");

    const allkariya = await kariyaCollection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "kariya_id",
            as: "relatedFamilies",
          },
        },
        {
          $addFields: {
            _id: { $toString: "$_id" }, // Convert _id to string
            familyCount: { $size: "$relatedFamilies" },
            populationCount: {
              $sum: {
                $map: {
                  input: "$relatedFamilies",
                  as: "family",
                  in: { $size: { $ifNull: ["$$family.members", []] } },
                },
              },
            },
          },
        },
        {
          $project: {
            relatedFamilies: 0,
          },
        },
      ])
      .toArray();

    return {
      success: true,
      message: "Fetched successfully",
      allkariya,
    };
  } catch (error) {
    console.error("Error fetching kariyas:", error);
    return {
      success: false,
      message: "An error occurred while fetching",
    };
  }
};





const fetchAllFamily = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("users");

    const allFamily = await collection
      .aggregate([
        {
          // ✅ First, we DON'T convert _id yet - we need it as ObjectId for $lookup
          $unwind: { 
            path: "$members", 
            preserveNullAndEmptyArrays: true 
          },
        },
        {
          $group: {
            _id: "$_id", // Keep _id as ObjectId for now
            familyData: { $first: "$$ROOT" },
            members: { $push: "$members" },
            academicEducationCounts: {
              $push: "$members.academicEducationLevel",
            },
            religiousEducationCounts: {
              $push: "$members.religiousEducationLevel",
            },
            maritalStatusCounts: {
              $push: "$members.maritalStatus",
            },
            disablityCounts: { $push: "$members.disablity" },
          },
        },
        {
          $addFields: {
            "familyData.members": "$$REMOVE",
            academicEducationCounts: {
              $map: {
                input: { $setUnion: ["$academicEducationCounts", []] },
                as: "level",
                in: {
                  academicEducationLevel: "$$level",
                  count: {
                    $size: {
                      $filter: {
                        input: "$academicEducationCounts",
                        as: "item",
                        cond: { $eq: ["$$item", "$$level"] },
                      },
                    },
                  },
                },
              },
            },
            religiousEducationCounts: {
              $map: {
                input: { $setUnion: ["$religiousEducationCounts", []] },
                as: "level",
                in: {
                  religiousEducationLevel: "$$level",
                  count: {
                    $size: {
                      $filter: {
                        input: "$religiousEducationCounts",
                        as: "item",
                        cond: { $eq: ["$$item", "$$level"] },
                      },
                    },
                  },
                },
              },
            },
            maritalStatusCounts: {
              $map: {
                input: { $setUnion: ["$maritalStatusCounts", []] },
                as: "level",
                in: {
                  maritalStatus: "$$level",
                  count: {
                    $size: {
                      $filter: {
                        input: "$maritalStatusCounts",
                        as: "item",
                        cond: { $eq: ["$$item", "$$level"] },
                      },
                    },
                  },
                },
              },
            },
            disablityCounts: {
              $map: {
                input: { $setUnion: ["$disablityCounts", []] },
                as: "level",
                in: {
                  disablity: "$$level",
                  count: {
                    $size: {
                      $filter: {
                        input: "$disablityCounts",
                        as: "item",
                        cond: { $eq: ["$$item", "$$level"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          // ✅ LOOKUP with mohalla_id (still ObjectId)
          $lookup: {
            from: "mohallas",
            localField: "familyData.mohalla_id", // This is still ObjectId
            foreignField: "_id",
            as: "mohallaDetail",
          },
        },
        {
          // ✅ LOOKUP with kariya_id from mohallaDetail
          $lookup: {
            from: "kariyas",
            localField: "mohallaDetail.kariya_id",
            foreignField: "_id",
            as: "kariyaDetail",
          },
        },
        {
          // ✅ NOW convert IDs to strings AFTER all lookups
          $addFields: {
            // Convert the root _id to string
            _id: { $toString: "$_id" },
            // Convert familyData IDs to string
            "familyData._id": { $toString: "$familyData._id" },
            "familyData.mohalla_id": { $toString: "$familyData.mohalla_id" },
            "familyData.kariya_id": { $toString: "$familyData.kariya_id" },
            // Convert mohallaDetail IDs
            "mohallaDetail._id": {
              $map: {
                input: "$mohallaDetail",
                as: "mohalla",
                in: { $toString: "$$mohalla._id" },
              },
            },
            "mohallaDetail.kariya_id": {
              $map: {
                input: "$mohallaDetail",
                as: "mohalla",
                in: { $toString: "$$mohalla.kariya_id" },
              },
            },
            // Convert kariyaDetail IDs
            "kariyaDetail._id": {
              $map: {
                input: "$kariyaDetail",
                as: "kariya",
                in: { $toString: "$$kariya._id" },
              },
            },
            // Also convert member IDs
            "members._id": {
              $map: {
                input: "$members",
                as: "member",
                in: { $toString: "$$member._id" },
              },
            },
          },
        },
        {
          $project: {
            familyData: 1,
            members: 1,
            academicEducationCounts: 1,
            religiousEducationCounts: 1,
            maritalStatusCounts: 1,
            disablityCounts: 1,
            mohallaDetail: 1,
            kariyaDetail: 1,
          },
        },
      ])
      .toArray();

    // console.log("Fetched families:", allFamily);
    return { 
      success: true, 
      message: "Fetching successfully", 
      allFamily 
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { success: false, message: error.message };
  }
};

// const fetchAllFamily = async () => {
//   try {
//     const db = mongoose.connection.db; // Access the database directly
//     const collection = db.collection("users");
//     // Use aggregation to fetch all data and push academic and religious education counts for each family
//     const allFamily = await collection
//       .aggregate([
//         {
//           $addFields: {
//             // Convert _id to string and include all root fields automatically
//             _id: { $toString: "$_id" }, // Convert _id to string
//           },
//         },
//         {
//           $unwind: { path: "$members", preserveNullAndEmptyArrays: true }, // Unwind the members array
//         },
//         {
//           $group: {
//             _id: "$_id", // Group by family document _id
//             // Include all root data from the family document except the 'members' field
//             familyData: { $first: "$$ROOT" }, // $$ROOT refers to the entire document
//             members: { $push: "$members" }, // Rebuild the members array after unwind
//             academicEducationCounts: {
//               $push: "$members.academicEducationLevel",
//             },
//             religiousEducationCounts: {
//               $push: "$members.religiousEducationLevel",
//             },
//             maritalStatusCounts: {
//               $push: "$members.maritalStatus",
//             },
//             disablityCounts: { $push: "$members.disablity" },
//           },
//         },
//         {
//           $addFields: {
//             // Remove the 'members' field from the 'familyData' object
//             "familyData.members": "$$REMOVE",
//             academicEducationCounts: {
//               $map: {
//                 input: { $setUnion: ["$academicEducationCounts", []] }, // Get unique levels
//                 as: "level",
//                 in: {
//                   academicEducationLevel: "$$level",
//                   count: {
//                     $size: {
//                       $filter: {
//                         input: "$academicEducationCounts",
//                         as: "item",
//                         cond: { $eq: ["$$item", "$$level"] },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             religiousEducationCounts: {
//               $map: {
//                 input: { $setUnion: ["$religiousEducationCounts", []] }, // Get unique levels
//                 as: "level",
//                 in: {
//                   religiousEducationLevel: "$$level",
//                   count: {
//                     $size: {
//                       $filter: {
//                         input: "$religiousEducationCounts",
//                         as: "item",
//                         cond: { $eq: ["$$item", "$$level"] },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             maritalStatusCounts: {
//               $map: {
//                 input: { $setUnion: ["$maritalStatusCounts", []] }, // Get unique levels
//                 as: "level",
//                 in: {
//                   maritalStatus: "$$level",
//                   count: {
//                     $size: {
//                       $filter: {
//                         input: "$maritalStatusCounts",
//                         as: "item",
//                         cond: { $eq: ["$$item", "$$level"] },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             disablityCounts: {
//               $map: {
//                 input: { $setUnion: ["$disablityCounts", []] }, // Get unique levels
//                 as: "level",
//                 in: {
//                   disablity: "$$level",
//                   count: {
//                     $size: {
//                       $filter: {
//                         input: "$disablityCounts",
//                         as: "item",
//                         cond: { $eq: ["$$item", "$$level"] },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//         {
//           $lookup: {
//             from: "mohallas", // The collection we want to join with
//             localField: "familyData.mohalla_id", // The field in the family document
//             foreignField: "_id", // The field in the mohalla collection
//             as: "mohallaDetail", // The name of the field that will contain the joined documents
//           },
//         },
//         {
//           $lookup: {
//             from: "kariyas",
//             localField: "mohallaDetail.kariya_id",
//             foreignField: "_id",
//             as: "kariyaDetail",
//           },
//         },
//         {
//           $addFields: {
//             // Convert the mohalla_id to string
//             "familyData.mohalla_id": { $toString: "$familyData.mohalla_id" },
//             "familyData.kariya_id": { $toString: "$familyData.kariya_id" },
//           },
//         },
//         {
//           $project: {
//             familyData: 1, // Include the entire family data
//             members: 1, // Include the rebuilt 'members' array
//             academicEducationCounts: 1, // Include the academic education counts
//             religiousEducationCounts: 1, // Include the religious education counts
//             maritalStatusCounts: 1,
//             disablityCounts: 1, // Include the disablityCounts
//             mohallaDetail: 1, // Include the mohallaDetail
//             kariyaDetail: 1,
//           },
//         },
//       ])
//       .toArray(); // Convert to array for easier manipulation

//     return { success: true, message: "fetching successfully ", allFamily };
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return { success: false, message: "An error occurred" };
//   }
// };

const fetchMohalla = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("mohallas");
    const allmohalla = await collection
      .aggregate([
        {
          $lookup: {
            from: "users", // The collection to join with
            localField: "_id", // The field in the "mohallas" collection
            foreignField: "mohalla_id", // The field in the "users" collection
            as: "familyDetail", // The resulting array containing family members
          },
        },
        {
          $lookup: {
            from: "kariyas", // The collection to join with
            localField: "kariya_id", // The field in the "mohallas" collection
            foreignField: "_id", // The field in the "kariyas" collection
            as: "kariyaDetails", // The resulting array containing kariya details
          },
        },
        {
          $unwind: {
            path: "$kariyaDetails", // Unwind the kariyaDetails array into a single object
            preserveNullAndEmptyArrays: true, // Optional: Include documents even if no match is found
          },
        },
        {
          $addFields: {
            _id: { $toString: "$_id" }, // Convert _id to string
            "kariyaDetails._id": { $toString: "$kariyaDetails._id" }, // Convert nested kariyaDetails._id to string
            // Add the count of family members
            familyCount: { $size: "$familyDetail" }, // Count the total number of users
            // Add the count of members in all users combined
            totalMembersCount: {
              $sum: {
                $map: {
                  input: "$familyDetail", // For each family
                  as: "family", // Alias for the current family
                  in: { $size: "$$family.members" }, // Calculate the size of the "members" array in the family
                },
              },
            },
            // Convert all familyDetail _id to string
            familyDetail: {
              $map: {
                input: "$familyDetail",
                as: "family",
                in: {
                  $mergeObjects: [
                    "$$family",
                    { _id: { $toString: "$$family._id" } }, // Convert _id to string for each family
                  ],
                },
              },
            },
          },
        },
        {
          $facet: {
            waterSupplyCounts: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: "$familyDetail.waterSupply",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  waterSupply: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            HousesCount: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: "$familyDetail.houseOwnership",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  houseOwnership: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            washroomCount: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: "$familyDetail.washroom",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  washroom: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            electricityCount: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: "$familyDetail.electricity",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  electricity: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            rationCardCounts: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: "$familyDetail.rationCard",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  rationCard: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            maritalStatusCounts: [
              { $unwind: "$familyDetail" }, // Unwind familyDetail array
              { $unwind: "$familyDetail.members" }, // Unwind members array inside familyDetail
              {
                $group: {
                  _id: "$familyDetail.members.maritalStatus", // Group by maritalStatus
                  count: { $sum: 1 }, // Count occurrences
                },
              },
              {
                $project: {
                  maritalStatus: "$_id", // Rename _id to maritalStatus
                  count: 1,
                  _id: 0, // Exclude _id from the output
                },
              },
            ],
            generalEducationCount: [
              { $unwind: "$familyDetail" }, // Unwind familyDetail array
              { $unwind: "$familyDetail.members" }, // Unwind members array inside familyDetail
              {
                $group: {
                  _id: "$familyDetail.members.academicEducationLevel", // Group by maritalStatus
                  count: { $sum: 1 }, // Count occurrences
                },
              },
              {
                $project: {
                  academicEducationLevel: "$_id", // Rename _id to maritalStatus
                  count: 1,
                  _id: 0, // Exclude _id from the output
                },
              },
            ],
            religiousEducationCounts: [
              { $unwind: "$familyDetail" }, // Unwind familyDetail array
              { $unwind: "$familyDetail.members" }, // Unwind members array inside familyDetail
              {
                $group: {
                  _id: "$familyDetail.members.religiousEducationLevel", // Group by maritalStatus
                  count: { $sum: 1 }, // Count occurrences
                },
              },
              {
                $project: {
                  religiousEducationLevel: "$_id", // Rename _id to maritalStatus
                  count: 1,
                  _id: 0, // Exclude _id from the output
                },
              },
            ],
            disablityCounts: [
              { $unwind: "$familyDetail" }, // Unwind familyDetail array
              { $unwind: "$familyDetail.members" }, // Unwind members array inside familyDetail
              {
                $group: {
                  _id: "$familyDetail.members.disablity", // Group by maritalStatus
                  count: { $sum: 1 }, // Count occurrences
                },
              },
              {
                $project: {
                  disablity: "$_id", // Rename _id to maritalStatus
                  count: 1,
                  _id: 0, // Exclude _id from the output
                },
              },
            ],
            genderAgeGroupCounts: [
              // Combine all family members into a flat array
              {
                $addFields: {
                  allMembers: {
                    $reduce: {
                      input: "$familyDetail",
                      initialValue: [],
                      in: { $concatArrays: ["$$value", "$$this.members"] },
                    },
                  },
                },
              },

              // Calculate age for each member
              {
                $addFields: {
                  allMembersWithAge: {
                    $map: {
                      input: "$allMembers",
                      as: "member",
                      in: {
                        _id: "$$member._id",
                        gender: "$$member.gender",
                        dateOfBirth: "$$member.dateOfBirth",
                        age: {
                          $cond: {
                            if: {
                              $and: [
                                { $ne: ["$$member.dateOfBirth", ""] },
                                { $ne: ["$$member.dateOfBirth", null] },
                              ],
                            },
                            then: {
                              $dateDiff: {
                                startDate: { $toDate: "$$member.dateOfBirth" },
                                endDate: "$$NOW",
                                unit: "year",
                              },
                            },
                            else: null,
                          },
                        },
                      },
                    },
                  },
                },
              },

              // Add ageRange to each member
              {
                $addFields: {
                  allMembersWithAge: {
                    $map: {
                      input: "$allMembersWithAge",
                      as: "m",
                      in: {
                        _id: "$$m._id",
                        gender: "$$m.gender",
                        age: "$$m.age",
                        ageRange: {
                          $switch: {
                            branches: [
                              { case: { $lte: ["$$m.age", 15] }, then: "0-15" },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 16] },
                                    { $lte: ["$$m.age", 25] },
                                  ],
                                },
                                then: "16-25",
                              },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 26] },
                                    { $lte: ["$$m.age", 60] },
                                  ],
                                },
                                then: "26-60",
                              },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 61] },
                                    { $lte: ["$$m.age", 100] },
                                  ],
                                },
                                then: "61-100",
                              },
                              { case: { $gt: ["$$m.age", 100] }, then: "101+" },
                            ],
                            default: "Unknown",
                          },
                        },
                      },
                    },
                  },
                },
              },

              // Unwind to group by gender and ageRange
              { $unwind: "$allMembersWithAge" },

              // Group by gender and ageRange
              {
                $group: {
                  _id: {
                    gender: "$allMembersWithAge.gender",
                    ageRange: "$allMembersWithAge.ageRange",
                  },
                  count: { $sum: 1 },
                },
              },

              // Final project for clean output
              {
                $project: {
                  _id: 0,
                  gender: "$_id.gender",
                  ageRange: "$_id.ageRange",
                  count: 1,
                },
              },
            ],
            TotalCount: [
              { $unwind: "$familyDetail" },
              {
                $group: {
                  _id: null,
                  familyCount: { $sum: 1 },
                  totalMembersCount: {
                    $sum: {
                      $size: "$familyDetail.members",
                    },
                  },
                },
              },
              {
                $project: {
                  familyCount: 1,
                  totalMembersCount: 1,
                  _id: 0,
                },
              },
            ],
            mohallaData: [
              {
                $project: {
                  _id: 1,
                  mohallaName: 1,
                  kariyaDetails: 1,
                  familyCount: 1,
                  totalMembersCount: 1,
                  familyDetail: 1,

                  // For genderAgeGroupCounts:
                  // genderAgeGroupCounts: {
                  //   $let: {
                  //     vars: {
                  //       members: {
                  //         $reduce: {
                  //           input: "$familyDetail",
                  //           initialValue: [],
                  //           in: {
                  //             $concatArrays: ["$$value", "$$this.members"],
                  //           },
                  //         },
                  //       },
                  //     },
                  //     in: {
                  //       $map: {
                  //         input: {
                  //           $setUnion: [
                  //             {
                  //               $map: {
                  //                 input: "$$members",
                  //                 as: "member",
                  //                 in: {
                  //                   gender: "$$member.gender",
                  //                   ageRange: {
                  //                     $switch: {
                  //                       branches: [
                  //                         {
                  //                           case: {
                  //                             $lte: ["$$member.age", 12],
                  //                           },
                  //                           then: "0-12",
                  //                         },
                  //                         {
                  //                           case: {
                  //                             $and: [
                  //                               { $gt: ["$$member.age", 12] },
                  //                               { $lte: ["$$member.age", 40] },
                  //                             ],
                  //                           },
                  //                           then: "13-40",
                  //                         },
                  //                         {
                  //                           case: {
                  //                             $and: [
                  //                               { $gt: ["$$member.age", 40] },
                  //                               { $lte: ["$$member.age", 60] },
                  //                             ],
                  //                           },
                  //                           then: "41-60",
                  //                         },
                  //                         {
                  //                           case: { $gt: ["$$member.age", 60] },
                  //                           then: "60+",
                  //                         },
                  //                       ],
                  //                       default: "Unknown",
                  //                     },
                  //                   },
                  //                 },
                  //               },
                  //             },
                  //             [],
                  //           ],
                  //         },
                  //         as: "group",
                  //         in: {
                  //           gender: "$$group.gender",
                  //           ageRange: "$$group.ageRange",
                  //           count: {
                  //             $size: {
                  //               $filter: {
                  //                 input: "$$members",
                  //                 as: "m",
                  //                 cond: {
                  //                   $and: [
                  //                     { $eq: ["$$m.gender", "$$group.gender"] },
                  //                     {
                  //                       $eq: [
                  //                         {
                  //                           $switch: {
                  //                             branches: [
                  //                               {
                  //                                 case: {
                  //                                   $lte: ["$$m.age", 12],
                  //                                 },
                  //                                 then: "0-12",
                  //                               },
                  //                               {
                  //                                 case: {
                  //                                   $and: [
                  //                                     { $gt: ["$$m.age", 12] },
                  //                                     { $lte: ["$$m.age", 40] },
                  //                                   ],
                  //                                 },
                  //                                 then: "13-40",
                  //                               },
                  //                               {
                  //                                 case: {
                  //                                   $and: [
                  //                                     { $gt: ["$$m.age", 40] },
                  //                                     { $lte: ["$$m.age", 60] },
                  //                                   ],
                  //                                 },
                  //                                 then: "41-60",
                  //                               },
                  //                               {
                  //                                 case: {
                  //                                   $gt: ["$$m.age", 60],
                  //                                 },
                  //                                 then: "60+",
                  //                               },
                  //                             ],
                  //                             default: "Unknown",
                  //                           },
                  //                         },
                  //                         "$$group.ageRange",
                  //                       ],
                  //                     },
                  //                   ],
                  //                 },
                  //               },
                  //             },
                  //           },
                  //         },
                  //       },
                  //     },
                  //   },
                  // },
                },
              },
              {
                $addFields: {
                  disablityCounts: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $reduce: {
                              input: "$familyDetail.members",
                              initialValue: [],
                              in: {
                                $concatArrays: [
                                  "$$value",
                                  { $ifNull: ["$$this.disablity", []] },
                                ],
                              },
                            },
                          },
                          [],
                        ],
                      },
                      as: "disablity",
                      in: {
                        disablity: "$$disablity",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail.members",
                              as: "member",
                              cond: {
                                $in: [
                                  "$$disablity",
                                  { $ifNull: ["$$member.disablity", []] },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  maritalStatusCounts: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $reduce: {
                              input: "$familyDetail.members",
                              initialValue: [],
                              in: {
                                $concatArrays: [
                                  "$$value",
                                  { $ifNull: ["$$this.maritalStatus", []] },
                                ],
                              },
                            },
                          },
                          [],
                        ],
                      },
                      as: "maritalStatus",
                      in: {
                        maritalStatus: "$$maritalStatus",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail.members",
                              as: "member",
                              cond: {
                                $in: [
                                  "$$maritalStatus",
                                  { $ifNull: ["$$member.maritalStatus", []] },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  religiousEducationCounts: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $reduce: {
                              input: "$familyDetail.members",
                              initialValue: [],
                              in: {
                                $concatArrays: [
                                  "$$value",
                                  {
                                    $ifNull: [
                                      "$$this.religiousEducationLevel",
                                      [],
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                          [],
                        ],
                      },
                      as: "religiousEducationLevel",
                      in: {
                        religiousEducationLevel: "$$religiousEducationLevel",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail.members",
                              as: "member",
                              cond: {
                                $in: [
                                  "$$religiousEducationLevel",
                                  {
                                    $ifNull: [
                                      "$$member.religiousEducationLevel",
                                      [],
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  generalEducationCount: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $reduce: {
                              input: "$familyDetail.members",
                              initialValue: [],
                              in: {
                                $concatArrays: [
                                  "$$value",
                                  {
                                    $ifNull: [
                                      "$$this.academicEducationLevel",
                                      [],
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                          [],
                        ],
                      },
                      as: "academicEducationLevel",
                      in: {
                        academicEducationLevel: "$$academicEducationLevel",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail.members",
                              as: "member",
                              cond: {
                                $in: [
                                  "$$academicEducationLevel",
                                  {
                                    $ifNull: [
                                      "$$member.academicEducationLevel",
                                      [],
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                $addFields: {
                  rationCardCounts: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail", // Loop through the familyDetail array
                          initialValue: [],
                          in: {
                            $cond: {
                              if: { $in: ["$$this.rationCard", "$$value"] }, // Check if the card already exists in the accumulator
                              then: "$$value", // If yes, keep the accumulator unchanged
                              else: {
                                $concatArrays: [
                                  "$$value",
                                  ["$$this.rationCard"],
                                ],
                              }, // Otherwise, add the rationCard to the accumulator
                            },
                          },
                        },
                      },
                      as: "rationCard",
                      in: {
                        rationCard: "$$rationCard", // The ration card type (APL, BPL, etc.)
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail", // Filter the familyDetail array
                              as: "member",
                              cond: {
                                $eq: ["$$member.rationCard", "$$rationCard"],
                              }, // Match the current rationCard
                            },
                          },
                        },
                      },
                    },
                  },
                  HousesCount: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail", // Loop through the familyDetail array
                          initialValue: [],
                          in: {
                            $cond: {
                              if: { $in: ["$$this.houseOwnership", "$$value"] }, // Check if the card already exists in the accumulator
                              then: "$$value", // If yes, keep the accumulator unchanged
                              else: {
                                $concatArrays: [
                                  "$$value",
                                  ["$$this.houseOwnership"],
                                ],
                              },
                            },
                          },
                        },
                      },
                      as: "houseOwnership",
                      in: {
                        houseOwnership: "$$houseOwnership",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail", // Filter the familyDetail array
                              as: "member",
                              cond: {
                                $eq: [
                                  "$$member.houseOwnership",
                                  "$$houseOwnership",
                                ],
                              }, // Match the current rationCard
                            },
                          },
                        },
                      },
                    },
                  },
                  electricityCount: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail", // Loop through the familyDetail array
                          initialValue: [],
                          in: {
                            $cond: {
                              if: { $in: ["$$this.electricity", "$$value"] },
                              then: "$$value",
                              else: {
                                $concatArrays: [
                                  "$$value",
                                  ["$$this.electricity"],
                                ],
                              },
                            },
                          },
                        },
                      },
                      as: "electricity",
                      in: {
                        electricity: "$$electricity",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail", // Filter the familyDetail array
                              as: "member",
                              cond: {
                                $eq: ["$$member.electricity", "$$electricity"],
                              }, // Match the current rationCard
                            },
                          },
                        },
                      },
                    },
                  },
                  washroomCount: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail", // Loop through the familyDetail array
                          initialValue: [],
                          in: {
                            $cond: {
                              if: { $in: ["$$this.washroom", "$$value"] },
                              then: "$$value",
                              else: {
                                $concatArrays: ["$$value", ["$$this.washroom"]],
                              },
                            },
                          },
                        },
                      },
                      as: "washroom",
                      in: {
                        washroom: "$$washroom",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail", // Filter the familyDetail array
                              as: "member",
                              cond: {
                                $eq: ["$$member.washroom", "$$washroom"],
                              }, // Match the current washroomCount
                            },
                          },
                        },
                      },
                    },
                  },
                  waterSupplyCounts: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail", // Loop through the familyDetail array
                          initialValue: [],
                          in: {
                            $cond: {
                              if: { $in: ["$$this.waterSupply", "$$value"] },
                              then: "$$value",
                              else: {
                                $concatArrays: [
                                  "$$value",
                                  ["$$this.waterSupply"],
                                ],
                              },
                            },
                          },
                        },
                      },
                      as: "waterSupply",
                      in: {
                        waterSupply: "$$waterSupply",
                        count: {
                          $size: {
                            $filter: {
                              input: "$familyDetail", // Filter the familyDetail array
                              as: "member",
                              cond: {
                                $eq: ["$$member.waterSupply", "$$waterSupply"],
                              }, // Match the current waterSupplyCounts
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              // 👉 Add age, ageRange
              {
                $addFields: {
                  allMembersWithAge: {
                    $map: {
                      input: {
                        $reduce: {
                          input: "$familyDetail",
                          initialValue: [],
                          in: { $concatArrays: ["$$value", "$$this.members"] },
                        },
                      },
                      as: "member",
                      in: {
                        _id: "$$member._id",
                        gender: "$$member.gender",
                        dateOfBirth: "$$member.dateOfBirth",
                        age: {
                          $cond: {
                            if: {
                              $and: [
                                { $ne: ["$$member.dateOfBirth", ""] },
                                { $ne: ["$$member.dateOfBirth", null] },
                              ],
                            },
                            then: {
                              $dateDiff: {
                                startDate: { $toDate: "$$member.dateOfBirth" },
                                endDate: "$$NOW",
                                unit: "year",
                              },
                            },
                            else: null,
                          },
                        },
                      },
                    },
                  },
                },
              },

              // 👉 Add ageRange to each member
              {
                $addFields: {
                  allMembersWithAge: {
                    $map: {
                      input: "$allMembersWithAge",
                      as: "m",
                      in: {
                        _id: "$$m._id",
                        gender: "$$m.gender",
                        dateOfBirth: "$$m.dateOfBirth",
                        age: "$$m.age",
                        ageRange: {
                          $switch: {
                            branches: [
                              { case: { $lte: ["$$m.age", 15] }, then: "0-15" },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 16] },
                                    { $lte: ["$$m.age", 25] },
                                  ],
                                },
                                then: "16-25",
                              },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 26] },
                                    { $lte: ["$$m.age", 60] },
                                  ],
                                },
                                then: "26-60",
                              },
                              {
                                case: {
                                  $and: [
                                    { $gte: ["$$m.age", 61] },
                                    { $lte: ["$$m.age", 100] },
                                  ],
                                },
                                then: "61-100",
                              },
                              { case: { $gt: ["$$m.age", 100] }, then: "101+" },
                            ],
                            default: "Unknown",
                          },
                        },
                      },
                    },
                  },
                },
              },

              // 👉 Add genderAgeGroupCounts
              {
                $addFields: {
                  genderAgeGroupCounts: {
                    $map: {
                      input: {
                        $setUnion: [
                          {
                            $map: {
                              input: "$allMembersWithAge",
                              as: "member",
                              in: {
                                gender: "$$member.gender",
                                ageRange: "$$member.ageRange",
                              },
                            },
                          },
                          [],
                        ],
                      },
                      as: "group",
                      in: {
                        gender: "$$group.gender",
                        ageRange: "$$group.ageRange",
                        count: {
                          $size: {
                            $filter: {
                              input: "$allMembersWithAge",
                              as: "m",
                              cond: {
                                $and: [
                                  { $eq: ["$$m.gender", "$$group.gender"] },
                                  { $eq: ["$$m.ageRange", "$$group.ageRange"] },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            familyDetail: 0, // Exclude the familyDetail array from the output
            "kariyaDetails._id": 0, // Exclude kariya_id from kariyaDetails
            // genderAgeGroupCounts: 1,
          },
        },
      ])
      .toArray();

    let finalResult = allmohalla.length > 0 ? allmohalla[0] : null;
    return {
      success: true,
      message: "fetching successfully ",
      allmohalla: finalResult,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { success: false, message: "An error occurred" };
  }
};

const fetchAllMember = async () => {
  try {
    // Use aggregation to join collections and fetch specific fields
    const allpopulation = await mongoose.connection.db
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "mohallas", // The collection to join with
            localField: "mohalla_id", // Field from the 'users' collection to match with 'mohallas'
            foreignField: "_id", // Field in the 'mohallas' collection to match
            as: "mohallaDetail", // The resulting array containing mohalla details
          },
        },
        {
          $addFields: {
            // Convert _id to string and add necessary fields
            _id: { $toString: "$_id" },
          },
        },
        {
          $unwind: {
            path: "$members", // Unwind the 'members' array
            preserveNullAndEmptyArrays: true, // Include documents even if no members are found
          },
        },
        {
          $project: {
            member: "$members", // Include the current member details
            familyData: "$$ROOT", // Include all root data (the entire document)
          },
        },
        {
          $addFields: {
            "familyData.members": "$$REMOVE",
          },
        },
      ])
      .toArray();

    return {
      success: true,
      message: "fetching successfully ",
      allpopulation,
    };
  } catch (error) {
    // Log the error and return a failure message
    console.error("Error fetching family data:", error);
    return {
      success: false,
      message: "An error occurred while fetching family details",
    };
  }
};

module.exports = {
  fetchAdmin,
  loginAdmin,
  fetchKariyas,
  fetchMohalla,
  fetchAllFamily,
  fetchAllMember,
  updateAdmin,
};
