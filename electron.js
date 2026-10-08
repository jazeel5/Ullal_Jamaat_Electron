const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  dialog,
  screen,
} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const https = require("https");

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

log.transports.file.level = "info";
autoUpdater.logger = log;
autoUpdater.autoDownload = false; // Ask user before downloading
autoUpdater.autoInstallOnAppQuit = true;

let progressWindow = null;
let win = null;
let mainWindow = null;

const connectDB = require("./server/db");

const {
  fetchAdmin,
  loginAdmin,
  fetchFamily,
  fetchKariyas,
  fetchMohalla,
  fetchAllFamily,
  fetchAllMember,
  updateAdmin,
} = require("./server/getData");
const mongoose = require("mongoose");
const {
  SyncLocalDataToDatabase,
  AddOrUpdateFamily,
} = require("./server/pushData");

// For automatic reloading during development
try {
  require("electron-reloader")(module);
} catch (error) {
  console.error("Electron reloader not initialized:", error);
}

// Connect to MongoDB
connectDB();

// electron Store to Store Token
const ElectronStore = require("electron-store");
const Store = ElectronStore.default || ElectronStore;
const store = new Store(); // ✅ Safe way

// const isDev = require("electron-is-dev");
const isDev = process.env.NODE_ENV === "development";

// Initialize reloader ONLY in dev mode and only ONCE
if (isDev) {
  try {
    require("electron-reloader")(module, {
      ignore: ["node_modules", "src"],
    });
    console.log("Electron reloader initialized");
  } catch (err) {
    console.log("Electron reloader failed:", err.message);
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    title: "E-Jamaat",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      enableRemoteModule: false,
      sandbox: false,
    },
  });
  mainWindow = win;

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "react_ejamaat/dist/index.html"));
    // Disable Ctrl+R reload
    win.webContents.on("before-input-event", (event, input) => {
      if (input.key.toLowerCase() === "r" && (input.control || input.meta)) {
        event.preventDefault();
      }
    });
  }

  // ✅ Check for updates once window is ready (in production)
  win.webContents.once("did-finish-load", () => {
    if (!isDev) {
      log.info("Checking for updates...");
      autoUpdater.checkForUpdates().catch((err) => {
        log.error("Failed to check for updates:", err.message);
      });
    } else {
      log.info("Development mode: skipping autoUpdater check.");
    }
  });
}

// 🟢 Create progress window for update download
function createProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.focus();
    return;
  }

  progressWindow = new BrowserWindow({
    width: 440,
    height: 220,
    title: "Downloading Update",
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    center: true,
    frame: false,
    modal: true,
    parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : null,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        color: #1f2937;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 24px;
        border: 1px solid #e5e7eb;
        user-select: none;
      }
      h3 { font-size: 16px; font-weight: 600; color: #166534; margin-bottom: 6px; }
      p { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
      .progress-container {
        width: 100%;
        height: 10px;
        background: #e5e7eb;
        border-radius: 9999px;
        overflow: hidden;
      }
      .progress-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #16a34a, #22c55e);
        border-radius: 9999px;
        transition: width 0.2s ease;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: 10px;
        font-size: 12px;
        color: #4b5563;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <h3>Downloading E-Jamaat Update</h3>
    <p>Please wait while the update is being downloaded...</p>
    <div class="progress-container">
      <div id="bar" class="progress-bar"></div>
    </div>
    <div class="status-row">
      <span id="details">0 MB / 0 MB</span>
      <span id="percent">0%</span>
    </div>
  </body>
</html>`;

  progressWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent));
}

// 🔄 Auto Updater Events
autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update_available", info);
  }

  dialog
    .showMessageBox(mainWindow && !mainWindow.isDestroyed() ? mainWindow : null, {
      type: "info",
      title: "Update Available",
      message: `A new version (v${info.version}) is available.`,
      detail: "Would you like to download and install this update now?",
      buttons: ["Download & Update", "Later"],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        createProgressWindow();
        autoUpdater.downloadUpdate().catch((err) => {
          log.error("Failed to start update download:", err);
          if (progressWindow && !progressWindow.isDestroyed()) {
            progressWindow.close();
          }
        });
      }
    });
});

autoUpdater.on("update-not-available", (info) => {
  log.info("App is up to date:", info ? info.version : "latest");
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update_not_available", info);
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  const percent = Math.round(progressObj.percent);
  const transferredMB = (progressObj.transferred / 1024 / 1024).toFixed(1);
  const totalMB = (progressObj.total / 1024 / 1024).toFixed(1);
  log.info(`Download progress: ${percent}% (${transferredMB} MB / ${totalMB} MB)`);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("download_progress", progressObj);
  }

  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.webContents
      .executeJavaScript(`
        const bar = document.getElementById('bar');
        const percent = document.getElementById('percent');
        const details = document.getElementById('details');
        if (bar) bar.style.width = '${percent}%';
        if (percent) percent.innerText = '${percent}%';
        if (details) details.innerText = '${transferredMB} MB / ${totalMB} MB';
      `)
      .catch(() => {});
  }
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info.version);
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.close();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update_downloaded", info);
  }

  dialog
    .showMessageBox(mainWindow && !mainWindow.isDestroyed() ? mainWindow : null, {
      type: "question",
      title: "Update Downloaded",
      message: `Version v${info.version} has been downloaded successfully.`,
      detail: "The application needs to restart to apply the update. Restart now?",
      buttons: ["Restart & Install", "Later"],
      defaultId: 0,
      cancelId: 1,
    })
    .then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
});

autoUpdater.on("error", (err) => {
  log.error("Auto updater error:", err);
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.close();
  }
});

// IPC handlers for manual updates from renderer
ipcMain.on("check_for_updates", () => {
  if (!isDev) {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error("Manual update check failed:", err.message);
    });
  } else {
    log.info("Manual update check ignored in dev mode.");
  }
});

ipcMain.on("quit_and_install", () => {
  autoUpdater.quitAndInstall(false, true);
});

// 🟢 App Ready
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("dbconnection", async () => {
  const connection = mongoose.connection;
  // Return immediately if already connected
  if (connection.readyState === 1) {
    return { success: true, message: "MongoDB is already connected" };
  }
  // Use async/await to wait for the connection event
  try {
    await new Promise((resolve, reject) => {
      connection.once("connected", resolve);
      connection.once("error", reject);
    });

    return { success: true, message: "MongoDB is connected" };
  } catch (err) {
    return {
      success: false,
      message: "Error connecting to MongoDB",
      error: err.message,
    };
  }
});

ipcMain.handle("loginAdmin", async (event, data) => {
  try {
    // Pass the data to the loginAdmin function
    const logindata = await loginAdmin(data); // Assuming data contains contact and password
    return logindata; // Return the result to renderer process
  } catch (error) {
    console.error("Error loading data:", error);
    throw error; // Propagate the error to the renderer process
  }
});

ipcMain.handle("getAdmin", async (event, token) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let adminData = await fetchAdmin(token);
      if (adminData?.success && adminData?.admin) {
        store.set("cached_admin", adminData.admin);
      }
      return adminData;
    } else {
      const cachedAdmin = store.get("cached_admin");
      if (cachedAdmin) {
        return { success: true, admin: cachedAdmin, fromCache: true };
      }
      return { success: false, message: "Offline: No cached admin profile" };
    }
  } catch (error) {
    const cachedAdmin = store.get("cached_admin");
    if (cachedAdmin) {
      return { success: true, admin: cachedAdmin, fromCache: true };
    }
    console.error("Error loading admin:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("updateAdmin", async (event, { id, data }) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const result = await updateAdmin(id, data);
      if (result.success && result.admin) {
        store.set("cached_admin", result.admin);
      }
      return result;
    } else {
      // Offline mode: update electron-store and queue for sync
      const currentAdmin = store.get("cached_admin") || {};
      const updatedAdmin = {
        ...currentAdmin,
        name: data.name || currentAdmin.name,
        email: data.email || currentAdmin.email,
        phone: data.phone || data.contactNumber || currentAdmin.phone,
      };
      store.set("cached_admin", updatedAdmin);

      const pendingPath = path.join(app.getPath("userData"), "pending-admin-update.json");
      fs.writeFileSync(
        pendingPath,
        JSON.stringify({ id, data, updatedAt: new Date() }, null, 2),
        "utf-8"
      );

      return {
        success: true,
        message: "Profile updated locally (offline). Will sync when online.",
        admin: updatedAdmin,
        offline: true,
      };
    }
  } catch (error) {
    console.error("Error updating admin:", error);
    return { success: false, message: error.message };
  }
});
ipcMain.handle("getfamily", async () => {
  try {
    let familyData = await fetchFamily();
    return familyData;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});
ipcMain.handle("getkariyas", async () => {
  try {
    let allkariya = await fetchKariyas();
    return allkariya;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});

ipcMain.handle("getmohallas", async () => {
  try {
    let allmohalla = await fetchMohalla();
    return allmohalla;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});

ipcMain.handle("getallfamily", async () => {
  try {
    let allfamily = await fetchAllFamily();
    return allfamily;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});
ipcMain.handle("getallmember", async () => {
  try {
    let allmember = await fetchAllMember();
    return allmember;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});

ipcMain.handle("addorupdatefamily", async (event, userData) => {
  try {
    let uploadedRes = await AddOrUpdateFamily(userData);
    return uploadedRes;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});

ipcMain.on("sendNotification", (event, data) => {
  // console.log("Hello world");
  // new Notification({ title: "Notification", body: "Hellooo" }).show();
});

const validFileNames = [
  "familyDetail",
  "kariyaDetail",
  "mohallaDetail",
  "Population",
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
function showNotification(title, body) {
  new Notification({ title, body }).show();
}

async function downloadDocs(docsArray, limit = Infinity) {
  // const desktopDir = path.join(os.homedir(), "Desktop");
  // const saveFolder = path.join(desktopDir, "JamaatDoc");
  const userDataPath = path.join(app.getPath("userData"));
  const saveFolder = path.join(userDataPath, "JamaatDoc");

  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder, { recursive: true });
  }
  showNotification("Document Sync", "Download started...");
  for (const { url } of docsArray) {
  // for (const { url } of docsArray.slice(0, 2)) {
    try {
      const relativePath = new URL(url).pathname.split("/upload/")[1];
      if (!relativePath) continue;
      const sanitizedFileName = relativePath.replace(/\//g, "_");
      const fullLocalPath = path.join(saveFolder, sanitizedFileName);

      // Check if file exists already
      if (fs.existsSync(fullLocalPath)) {
        continue; // Skip to next file
      }

      await new Promise((resolve) => {
        const file = fs.createWriteStream(fullLocalPath);
        https
          .get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve();
            });
          })
          .on("error", () => {
            fs.unlink(fullLocalPath, () => {});
            resolve();
          });
      });

      await delay(500);
    } catch (e) {
      console.error(e.message);
    }
  }

  showNotification("Document Sync", "Documents synced successfully!");
  console.log("Sync done ..........");
}

function handleFamilyDetail(parsedData) {
  if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
    console.error("❌ No valid data provided to handleFamilyDetail");
    return;
  }

  // Collect all docs in one array
  const allDocs = [];

  parsedData.forEach((family) => {
    const aadhaarDocs = (family.members ?? [])
      .map((member) => member?.aadhaarCardDoc)
      .filter((url) => typeof url === "string" && url.trim().length > 0);

    aadhaarDocs.forEach((url) => allDocs.push({ type: "Aadhaar Card", url }));

    const rationCardDoc = family.familyData?.rationCardDoc;
    if (
      rationCardDoc &&
      typeof rationCardDoc === "string" &&
      rationCardDoc.trim().length > 0
    ) {
      allDocs.push({ type: "Ration Card", url: rationCardDoc });
    }
  });
  // console.log("All collected docs:", allDocs);
  // Next step: download these docs to desktop/JamaatDoc folder
  downloadDocs(allDocs);
}

ipcMain.on("check-file-exists-sync", (event, fullPath) => {
  try {
    event.returnValue = fs.existsSync(fullPath);
  } catch {
    event.returnValue = false;
  }
});

ipcMain.handle("get-app-folder", () => {
  // Build path to Desktop/JamaatDoc folder dynamically
  // const desktopPath = path.join(os.homedir(), "Desktop", "JamaatDoc");
  // return desktopPath; // return string to renderer
  // const appPath = path.join(os.homedir(), "Desktop", "JamaatDoc");
  // return appPath; // return string to renderer

  const appPath = path.join(app.getPath("userData"), "JamaatDoc");
  return appPath;
});

ipcMain.handle("get-json", async (event, { fileName }) => {
  try {
    // Check if the provided fileName is valid
    if (!validFileNames.includes(fileName)) {
      throw new Error(`Invalid file name requested: ${fileName}`);
    }
    const filePath = path.join(app.getPath("userData"), `${fileName}.json`);
    // const filePath = path.join(app.getPath("desktop"), `${fileName}.json`);
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      let parsedData = await JSON.parse(fileData);
      if (fileName === "familyDetail") {
        handleFamilyDetail(parsedData); // ⬅️ Call the internal logic directly
      }
      return { success: true, parsedData }; // Return the JSON data if the file exists
    } else {
      return { success: false, message: `File not found: ${fileName}.json` }; // Return the JSON data if the file exists
    }
  } catch (err) {
    console.error("Error reading JSON file:", err);
    throw err; // Return error to the renderer
  }
});

ipcMain.handle("save-json", async (event, { fileName, data }) => {
  try {
    // const filePath = path.join(app.getPath("desktop"), `${fileName}.json`);
    const filePath = path.join(app.getPath("userData"), `${fileName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return filePath; // Return the file path to the renderer
  } catch (err) {
    console.error("Error saving JSON:", err);
    throw err; // Rethrow error to be handled by the renderer
  }
});

ipcMain.handle("check-local-file", async (event, fileNames) => {
  try {
    // Loop through the file names and check if each file exists
    const result = fileNames.map((fileName) => {
      // const filePath = path.join(app.getPath("desktop"), fileName);
      const filePath = path.join(app.getPath("userData"), fileName);

      return {
        fileName,
        filePath,
        exists: fs.existsSync(filePath),
      };
    });

    // Return the result
    return {
      success: true,
      files: result,
    };
  } catch (error) {
    console.error("Error checking local file existence:", error);
    return {
      success: false,
      message: error.message,
    };
  }
});

ipcMain.handle("local-save-json", async (event, { fileName, data }) => {
  try {
    // Create a new ObjectId if _id doesn't exist
    let createNewId = new mongoose.Types.ObjectId();
    let createNewIdString = createNewId.toString();

    // Add _id only if not present
    if (typeof data === "object" && !Array.isArray(data)) {
      data._id = data._id || createNewIdString;
    }

    if (!Array.isArray(data)) {
      data = [data]; // wrap in array
    }

    // const filePath = path.join(app.getPath("desktop"), `${fileName}.json`);
    const filePath = path.join(app.getPath("userData"), `${fileName}.json`);
    let existingData = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = JSON.parse(fileContent);
    }

    // Remove existing items with the same _id
    const newIds = data.map((item) => item._id);
    existingData = existingData.filter((item) => !newIds.includes(item._id));

    // Add the new data
    const updatedData = [...existingData, ...data];

    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), "utf-8");

    return { success: true, updatedData, filePath };
  } catch (err) {
    console.error("Error saving JSON:", err);
    throw err;
  }
});

// New API to check for local JSON and upload data to the database if available
ipcMain.handle("sync-local-data", async (event) => {
  try {
    const uploadRes = await SyncLocalDataToDatabase();
    return {
      success: true,
      message: "Data synced to the database successfully.",
      result: uploadRes,
    };
  } catch (error) {
    console.error("Error syncing local data:", error);
    return { success: false, message: error.message }; // Return the error message
  }
});

ipcMain.handle("get-data", async () => {
  const filePath = path.join(app.getPath("userData"), "data.json");
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } else {
      console.log("No data file found.");
      return null;
    }
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
});

ipcMain.handle(
  "save-local-image",
  async (event, { originalPath, newFileName }) => {
    try {
      if (!originalPath) {
        throw new Error("Original path is missing");
      }

      const destFolder = path.join(__dirname, "Local_Image");
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
      }

      const destPath = path.join(destFolder, newFileName);
      fs.copyFileSync(originalPath, destPath);

      return { success: true, savedPath: destPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("save-file-buffer", async (event, { fileName, buffer }) => {
  try {
    // const desktopDir = path.join(os.homedir(), "Desktop");
    // const destFolder = path.join(desktopDir, "Local_Images");
    const userDataPath = app.getPath("userData");
    const destFolder = path.join(userDataPath, "Local_Images");

    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const destPath = path.join(destFolder, fileName);

    // Convert ArrayBuffer to Buffer for Node.js write
    const nodeBuffer = Buffer.from(buffer);

    fs.writeFileSync(destPath, nodeBuffer);

    return { success: true, savedPath: destPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save token
ipcMain.handle("store-token", (event, token) => {
  store.set("token", token);
  return true;
});

// Get token
ipcMain.handle("get-token", () => {
  return store.get("token");
});
// Clear token
ipcMain.handle("clear-token", () => {
  return store.clear("token");
});

// Add these handlers after your existing ipcMain handlers

// Function to delete all data files (JSON files only)
ipcMain.handle("delete-all-data", async () => {
  try {
    const userDataPath = app.getPath("userData");
    const dataFiles = [
      "familyDetail.json",
      "kariyaDetail.json",
      "mohallaDetail.json",
      "Population.json",
      "local-insert.json",
      "data.json",
    ];

    const deletedFiles = [];
    const errors = [];

    for (const fileName of dataFiles) {
      const filePath = path.join(userDataPath, fileName);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles.push(fileName);
          // console.log(`✅ Deleted: ${fileName}`);
        }
      } catch (err) {
        errors.push({ fileName, error: err.message });
        console.error(`❌ Error deleting ${fileName}:`, err.message);
      }
    }

    // Also clear electron-store token
    try {
      store.clear();
      console.log("✅ Cleared electron-store");
    } catch (err) {
      console.error("❌ Error clearing store:", err);
    }

    return {
      success: errors.length === 0,
      deletedFiles,
      errors,
      message:
        errors.length === 0
          ? "All data files deleted successfully"
          : "Some files could not be deleted",
    };
  } catch (error) {
    console.error("Error deleting data files:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete data files",
    };
  }
});

// Function to delete all images (JamaatDoc and Local_Images folders)
ipcMain.handle("delete-all-images", async () => {
  try {
    const userDataPath = app.getPath("userData");
    const imageFolders = [
      { name: "JamaatDoc", path: path.join(userDataPath, "JamaatDoc") },
      { name: "Local_Images", path: path.join(userDataPath, "Local_Images") },
    ];

    const deletedFolders = [];
    const errors = [];
    let totalFilesDeleted = 0;

    for (const folder of imageFolders) {
      try {
        if (fs.existsSync(folder.path)) {
          // Count files before deletion
          const files = fs.readdirSync(folder.path);
          const fileCount = files.length;

          // Delete all files inside the folder but keep the folder
          files.forEach((file) => {
            const filePath = path.join(folder.path, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              // Recursively delete subdirectories
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              // Delete individual files
              fs.unlinkSync(filePath);
            }
          });

          totalFilesDeleted += fileCount;
          deletedFolders.push({
            folder: folder.name,
            filesDeleted: fileCount,
          });
          // console.log(`✅ Deleted ${fileCount} files from ${folder.name}`);
        } else {
          // console.log(`⚠️ Folder not found: ${folder.name}`);
        }
      } catch (err) {
        errors.push({ folder: folder.name, error: err.message });
        console.error(
          `❌ Error deleting images from ${folder.name}:`,
          err.message
        );
      }
    }

    showNotification(
      "Images Deleted",
      `Deleted ${totalFilesDeleted} files from image folders`
    );

    return {
      success: errors.length === 0,
      deletedFolders,
      totalFilesDeleted,
      errors,
      message:
        errors.length === 0
          ? `Successfully deleted ${totalFilesDeleted} image files`
          : "Some image files could not be deleted",
    };
  } catch (error) {
    console.error("Error deleting image files:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete image files",
    };
  }
});

// Optional: Combined function to delete everything (data + images)
ipcMain.handle("delete-all-app-data", async () => {
  try {
    const dataResult = await ipcMain.emit("delete-all-data");
    const imagesResult = await ipcMain.emit("delete-all-images");

    return {
      success: true,
      dataResult,
      imagesResult,
      message: "All application data and images deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting all app data:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete application data",
    };
  }
});

// Function to get storage statistics
ipcMain.handle("get-storage-stats", async () => {
  try {
    const userDataPath = app.getPath("userData");

    const stats = {
      dataFiles: [],
      imageFolders: [],
      totalSize: 0,
    };

    // Check data files
    const dataFiles = [
      "familyDetail.json",
      "kariyaDetail.json",
      "mohallaDetail.json",
      "Population.json",
      "local-insert.json",
    ];

    for (const fileName of dataFiles) {
      const filePath = path.join(userDataPath, fileName);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        stats.dataFiles.push({
          name: fileName,
          size: stat.size,
          sizeKB: (stat.size / 1024).toFixed(2),
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
        });
        stats.totalSize += stat.size;
      }
    }

    // Check image folders
    const folders = ["JamaatDoc", "Local_Images"];
    for (const folderName of folders) {
      const folderPath = path.join(userDataPath, folderName);
      if (fs.existsSync(folderPath)) {
        let folderSize = 0;
        let fileCount = 0;

        const calculateFolderSize = (dirPath) => {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              calculateFolderSize(filePath);
            } else {
              folderSize += stat.size;
              fileCount++;
            }
          });
        };

        calculateFolderSize(folderPath);
        stats.imageFolders.push({
          name: folderName,
          fileCount,
          size: folderSize,
          sizeKB: (folderSize / 1024).toFixed(2),
          sizeMB: (folderSize / (1024 * 1024)).toFixed(2),
        });
        stats.totalSize += folderSize;
      }
    }

    stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

    return { success: true, stats };
  } catch (error) {
    console.error("Error getting storage stats:", error);
    return { success: false, error: error.message };
  }
});
