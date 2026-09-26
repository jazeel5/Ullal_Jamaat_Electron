const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const JWT_SECRETE = "Con-Jamaat";
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // load .env variables

const { app } = require("electron");

// const AddOrUpdateFamily = async (data) => {
//   try {
//     console.log(data, "data");

//     // Check MongoDB connection
//     if (mongoose.connection.readyState !== 1) {
//       return { success: false, message: "Database connection is not ready" };
//     }

//     console.log("Validating _id, kariya_id, and mohalla_id...");

//     // ✅ STEP 1: Save the original _id for update check
//     const originalId = data._id;
//     let objectId = null;
//     let isUpdate = false;

//     // ✅ STEP 2: Check if this is an update or insert
//     // An update is ONLY when we have a valid ObjectId that EXISTS in MongoDB
//     if (originalId && mongoose.isValidObjectId(originalId)) {
//       objectId = new mongoose.Types.ObjectId(originalId);
//       console.log("Valid _id format:", originalId);
//     } else if (originalId) {
//       return { success: false, message: "Invalid _id format provided" };
//     }

//     // ✅ STEP 3: Validate and convert kariya_id
//     if (data.kariya_id && mongoose.isValidObjectId(data.kariya_id)) {
//       console.log("Valid kariya_id:", data.kariya_id);
//       data.kariya_id = new mongoose.Types.ObjectId(data.kariya_id);
//     } else if (data.kariya_id) {
//       return { success: false, message: "Invalid kariya_id provided" };
//     }

//     // ✅ STEP 4: Validate and convert mohalla_id
//     if (data.mohalla_id && mongoose.isValidObjectId(data.mohalla_id)) {
//       console.log("Valid mohalla_id:", data.mohalla_id);
//       data.mohalla_id = new mongoose.Types.ObjectId(data.mohalla_id);
//     } else if (data.mohalla_id) {
//       return { success: false, message: "Invalid mohalla_id provided" };
//     }

//     // ✅ STEP 5: Validate members and assign ObjectIds
//     if (data.members && Array.isArray(data.members)) {
//       data.members = data.members.map((member) => {
//         const memberId =
//           member._id && mongoose.isValidObjectId(member._id)
//             ? new mongoose.Types.ObjectId(member._id)
//             : new mongoose.Types.ObjectId();

//         return {
//           ...member,
//           _id: memberId,
//         };
//       });
//     }

//     // ✅ STEP 6: Access MongoDB collection
//     const collection = mongoose.connection.collection("users");

//     // ✅ STEP 7: Check if document actually exists in MongoDB
//     if (objectId) {
//       console.log("Checking if document exists with _id:", objectId);

//       const existingDocument = await collection.findOne({
//         _id: objectId,
//       });

//       if (existingDocument) {
//         console.log("✅ Found existing document, proceeding with UPDATE");
//         isUpdate = true;
//       } else {
//         console.log(
//           "⚠️ Document NOT found in MongoDB with _id:",
//           objectId.toString()
//         );
//         console.log("This appears to be a NEW insert, not an update");
//         isUpdate = false;
//         objectId = null; // Reset for insert
//       }
//     }

//     // ✅ STEP 8: Handle UPDATE
//     if (isUpdate && objectId) {
//       console.log("UPDATING document with _id:", objectId);

//       // Create update data WITHOUT _id
//       const updateData = { ...data };
//       delete updateData._id;

//       console.log("Update data keys:", Object.keys(updateData));

//       // Update document
//       const result = await collection.findOneAndUpdate(
//         { _id: objectId },
//         { $set: updateData },
//         { returnDocument: "after" }
//       );

//       console.log("✅ Update successful");

//       if (result && result.value) {
//         return {
//           success: true,
//           message: "Updated successfully",
//           updatedData: result.value,
//           updatedId: result.value._id.toString(),
//         };
//       } else {
//         return {
//           success: true,
//           message: "Updated successfully",
//           updatedData: result,
//           updatedId: objectId.toString(),
//         };
//       }
//     }
//     // ✅ STEP 9: Handle INSERT
//     else {
//       console.log("INSERTING new document");

//       // Remove _id if it exists (let MongoDB generate a new one)
//       const insertData = { ...data };
//       delete insertData._id;

//       console.log("Insert data keys:", Object.keys(insertData));

//       const result = await collection.insertOne(insertData);

//       if (result && result.insertedId) {
//         console.log("✅ Insert successful with _id:", result.insertedId);

//         // Fetch the newly inserted document
//         const newDocument = await collection.findOne({
//           _id: result.insertedId,
//         });

//         if (newDocument) {
//           return {
//             success: true,
//             message: "Inserted successfully",
//             updatedData: newDocument,
//             insertedId: result.insertedId.toString(),
//           };
//         } else {
//           return {
//             success: true,
//             message: "Inserted successfully",
//             insertedId: result.insertedId.toString(),
//           };
//         }
//       } else {
//         console.error("❌ Insert failed");
//         return {
//           success: false,
//           message: "Failed to insert document",
//         };
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error in AddOrUpdateFamily:", error);
//     return {
//       success: false,
//       message: error.message,
//       error: error.toString(),
//     };
//   }
// };

const AddOrUpdateFamily = async (data) => {
  try {
    // console.log(data, "data");

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return { success: false, message: "Database connection is not ready" };
    }

    // Validate and convert IDs
    console.log("Validating _id, kariya_id, and mohalla_id...");

    // Validate and convert kariya_id
    if (data.kariya_id && mongoose.isValidObjectId(data.kariya_id)) {
      // console.log("Valid kariya_id:", data.kariya_id);
      data.kariya_id = new mongoose.Types.ObjectId(data.kariya_id);
    } else if (data.kariya_id) {
      return { success: false, message: "Invalid kariya_id provided" };
    }

    // Validate and convert mohalla_id
    if (data.mohalla_id && mongoose.isValidObjectId(data.mohalla_id)) {
      // console.log("Valid mohalla_id:", data.mohalla_id);
      data.mohalla_id = new mongoose.Types.ObjectId(data.mohalla_id);
    } else if (data.mohalla_id) {
      return { success: false, message: "Invalid mohalla_id provided" };
    }

    // Validate _id if it's being used for update
    let objectId = null;
    if (data._id && mongoose.isValidObjectId(data._id)) {
      // console.log("Valid _id:", data._id);
      objectId = new mongoose.Types.ObjectId(data._id);
    } else if (data._id) {
      return { success: false, message: "Invalid _id provided" };
    }

    // Validate members and assign ObjectIds
    if (data.members && Array.isArray(data.members)) {
      data.members = data.members.map((member) => {
        const memberId =
          member._id && mongoose.isValidObjectId(member._id)
            ? new mongoose.Types.ObjectId(member._id)
            : new mongoose.Types.ObjectId();
        return {
          ...member,
          _id: memberId,
        };
      });
    }

    // Access MongoDB collection
    const collection = mongoose.connection.collection("users");

    // If _id exists, update the document
    if (objectId) {
      console.log("Attempting to update with _id:", objectId);

      // First check if document exists
      const existingDocument = await collection.findOne({
        _id: objectId,
      });

      if (!existingDocument) {
        console.error("Document not found with _id:", objectId);
        return {
          success: false,
          message: "No document found with the given _id",
          _id: objectId.toString(),
        };
      }

      // ✅ Create a copy of data WITHOUT _id for updating
      const updateData = { ...data };
      delete updateData._id; // Remove _id from update

      // console.log("Update data (without _id):", updateData);

      // ✅ FIX: Use correct options syntax
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        {
          returnDocument: "after", // ✅ This is the correct property name
          new: true, // ✅ Also add this for compatibility
        }
      );

      // console.log("FindOneAndUpdate result:", result);

      // ✅ Check result.value OR result (depending on driver version)
      const updatedDoc = result.value || result;

      if (updatedDoc) {
        // console.log("Document updated successfully:", updatedDoc._id);
        return {
          success: true,
          message: "Updated successfully",
          result: updatedDoc,
          updatedId: updatedDoc._id.toString(),
        };
      } else {
        console.error("Update failed - no document returned");
        console.error("Full result object:", result);
        return {
          success: false,
          message: "Failed to update document",
          result: result,
        };
      }
    } else {
      // If no _id is provided, insert a new document
      console.log("Inserting new document");

      const insertData = { ...data };
      delete insertData._id;

      const result = await collection.insertOne(insertData);

      if (result.insertedId) {
        // Fetch the newly inserted document
        const newDocument = await collection.findOne({
          _id: result.insertedId,
        });

        // console.log(
        //   "Document inserted successfully with _id:",
        //   result.insertedId
        // );
        return {
          success: true,
          message: "Inserted successfully",
          result: newDocument,
          insertedId: result.insertedId.toString(),
        };
      } else {
        return {
          success: false,
          message: "Failed to insert document",
        };
      }
    }
  } catch (error) {
    console.error("Error in AddOrUpdateFamily:", error);
    return {
      success: false,
      message: error.message,
      error: error.toString(),
      data: data?._id,
    };
  }
};

// const AddOrUpdateFamily = async (data) => {
//   try {
//     console.log(data, "data");

//     // Check MongoDB connection
//     if (mongoose.connection.readyState !== 1) {
//       return { success: false, message: "Database connection is not ready" };
//     }
//     // Validate and convert IDs
//     console.log("Validating _id, kariya_id, and mohalla_id...");
//     // Validate and convert kariya_id
//     if (data.kariya_id && mongoose.isValidObjectId(data.kariya_id)) {
//       console.log("Valid kariya_id:", data.kariya_id);
//       data.kariya_id = new mongoose.Types.ObjectId(data.kariya_id);
//     } else if (data.kariya_id) {
//       return { success: false, message: "Invalid kariya_id provided" };
//     }
//     // Validate and convert mohalla_id
//     if (data.mohalla_id && mongoose.isValidObjectId(data.mohalla_id)) {
//       console.log("Valid mohalla_id:", data.mohalla_id);
//       data.mohalla_id = new mongoose.Types.ObjectId(data.mohalla_id);
//     } else if (data.mohalla_id) {
//       return { success: false, message: "Invalid mohalla_id provided" };
//     }
//     // Validate _id if it's being used for update
//     if (data._id && mongoose.isValidObjectId(data._id)) {
//       console.log("Valid _id:", data._id);
//       data._id = new mongoose.Types.ObjectId(data._id); // Only convert if _id is valid
//     } else if (data._id) {
//       return { success: false, message: "Invalid _id provided" };
//     }
//     // Validate members and assign ObjectIds
//     if (data.members && Array.isArray(data.members)) {
//       data.members = data.members.map((member) => {
//         // Check if the member._id exists and is a valid ObjectId
//         const memberId =
//           member._id && mongoose.isValidObjectId(member._id)
//             ? new mongoose.Types.ObjectId(member._id) // Use existing valid ObjectId
//             : new mongoose.Types.ObjectId(); // Create a new ObjectId if invalid
//         return {
//           ...member,
//           _id: memberId, // Assign the validated or newly created ObjectId
//         };
//       });
//     }
//     // Access MongoDB collection
//     const collection = mongoose.connection.collection("users");
//     // If _id exists, find the document first to ensure it's there before update
//     if (data._id) {
//       const existingDocument = await collection.findOne({
//         _id: new mongoose.Types.ObjectId(data?._id),
//       });
//       // Debug: Check what is returned from the find query
//       if (!existingDocument) {
//         return {
//           success: false,
//           message: "No document found with the given _id",
//         };
//       }
//       // Proceed to update the existing document
//       const result = await collection.findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(data?._id) },
//         { $set: data }
//       );

//       if (result) {
//         return {
//           success: true,
//           message: "Updated successfully",
//           result: result, // Return updated document
//         };
//       } else {
//         return {
//           success: false,
//           message: "No document found with the given _id after update",
//         };
//       }
//     } else {
//       // If no _id is provided, insert a new document
//       const result = await collection.insertOne(data);
//       return { success: true, result, message: "Inserted successfully" };
//     }
//   } catch (error) {
//     return { success: false, message: error.message, data: data?._id };
//   }
// };

// const SyncLocalDataToDatabase = async () => {
//   try {
//     // Define the file path for the local JSON file
//     const filePath = path.join(app.getPath("desktop"), "local-insert.json");
//     // Check if the local file exists
//     if (fs.existsSync(filePath)) {
//       const fileContent = fs.readFileSync(filePath, "utf-8");
//       const localData = JSON.parse(fileContent); // Parse the local data

//       // Check if there is data to sync
//       if (localData) {
//         // Adjust the local data before insertion
//         const data = localData;
//         // Convert `kariya_id` and `mohalla_id` to ObjectId for MongoDB
//         if (data.kariya_id) {
//           data.kariya_id = new mongoose.Types.ObjectId(data.kariya_id);
//         }
//         if (data.mohalla_id) {
//           data.mohalla_id = new mongoose.Types.ObjectId(data.mohalla_id);
//         }
//         // Assign ObjectId to each member if they don't have an `_id`
//         if (data.members && Array.isArray(data.members)) {
//           data.members = data.members.map((member) => ({
//             ...member,
//             _id: member._id
//               ? new mongoose.Types.ObjectId(member._id)
//               : new mongoose.Types.ObjectId(),
//           }));
//         }
//         // Insert the family data into the MongoDB collection
//         const collection = mongoose.connection.collection("users");
//         const result = await collection.insertMany(data); // Using insertOne for a single document
//         // After data is successfully uploaded, delete the local file
//         await fs.unlinkSync(filePath); // Delete the local file
//         // Return success after data is uploaded to the database
//         return {
//           success: true,
//           message: "Data synced to the database successfully.",
//           result,
//         };
//       } else {
//         return {
//           success: true,
//           message: "No data found in the local file to sync.",
//         };
//       }
//     } else {
//       return { success: true, message: "Local data file does not exist." };
//     }
//   } catch (error) {
//     console.error("Error syncing local data:", error);
//     return { success: false, message: error.message };
//   }
// };

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload a single image
const uploadToCloudinary = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;

    const res = await cloudinary.uploader.upload(filePath, {
      folder: "family-docs",
    });
    return res.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

const processLocalData = async (localData) => {
  // Upload ration card doc
  if (localData.rationCardDoc) {
    const uploaded = await uploadToCloudinary(localData.rationCardDoc);
    if (uploaded) {
      fs.unlinkSync(localData.rationCardDoc); // Delete after upload
      localData.rationCardDoc = uploaded;
    }
  }

  // Upload Aadhaar card docs for members
  if (Array.isArray(localData.members)) {
    localData.members = await Promise.all(
      localData.members.map(async (member) => {
        if (member.aadhaarCardDoc) {
          const uploaded = await uploadToCloudinary(member.aadhaarCardDoc);
          if (uploaded) {
            fs.unlinkSync(member.aadhaarCardDoc); // Delete after upload
            member.aadhaarCardDoc = uploaded;
          }
        }

        return {
          ...member,
          _id: member._id
            ? new mongoose.Types.ObjectId(member._id)
            : new mongoose.Types.ObjectId(),
        };
      })
    );
  }

  // Convert string IDs to ObjectId
  if (localData.kariya_id) {
    localData.kariya_id = new mongoose.Types.ObjectId(localData.kariya_id);
  }
  if (localData.mohalla_id) {
    localData.mohalla_id = new mongoose.Types.ObjectId(localData.mohalla_id);
  }

  return localData;
};

const deleteLocalResources = (jsonFilePath, localImageFolderPath) => {
  if (fs.existsSync(jsonFilePath)) {
    fs.unlinkSync(jsonFilePath);
  }

  if (fs.existsSync(localImageFolderPath)) {
    fs.rmSync(localImageFolderPath, { recursive: true, force: true });
  }
};

const { updateAdmin } = require("./getData");

const SyncLocalDataToDatabase = async () => {
  try {
    const pendingAdminPath = path.join(
      app.getPath("userData"),
      "pending-admin-update.json"
    );
    if (fs.existsSync(pendingAdminPath)) {
      try {
        const pendingContent = fs.readFileSync(pendingAdminPath, "utf-8");
        const pendingData = JSON.parse(pendingContent);
        if (pendingData?.id && pendingData?.data) {
          await updateAdmin(pendingData.id, pendingData.data);
        }
        fs.unlinkSync(pendingAdminPath);
      } catch (adminSyncErr) {
        console.error("Error syncing pending admin profile update:", adminSyncErr);
      }
    }

    const jsonFilePath = path.join(
      app.getPath("userData"),
      "local-insert.json"
    );
    const localImageFolderPath = path.join(
      app.getPath("desktop"),
      "Local_Images"
    );

    if (!fs.existsSync(jsonFilePath)) {
      return { success: true, message: "Local data file does not exist." };
    }

    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const localDataArray = JSON.parse(fileContent); // Should be an array

    const processedData = await Promise.all(
      localDataArray.map((data) => processLocalData(data))
    );

    const collection = mongoose.connection.collection("users");
    const result = await collection.insertMany(processedData);

    // Cleanup
    deleteLocalResources(jsonFilePath, localImageFolderPath);

    return {
      success: true,
      message: "Data synced to the database successfully.",
      result,
    };
  } catch (error) {
    console.error("Error syncing local data:", error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  AddOrUpdateFamily,
  SyncLocalDataToDatabase,
};
