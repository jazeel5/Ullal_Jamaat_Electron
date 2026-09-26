import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Create the context
export const AuthContext = createContext();
// Create a provider component
export const AuthProvider = ({ children }) => {
  //Main State
  const [allfamily, setAllFamily] = useState(null);
  const [allkariyas, setAllKariyas] = useState(null);
  const [allmohalla, setAllMohalla] = useState(null);
  const [population, setPopulation] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to track login check
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const [folderPath, setfolderPath] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toastMessage, setShowToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    function updateOnlineStatus() {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        // Show offline toast immediately
        setShowToastMessage("No Internet Connection");
        setShowToast(true);
      } else {
        // Show connected toast, then hide after 2 seconds
        setShowToastMessage("Connected to Network");
        setShowToast(true);

        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      }
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Call once to initialize
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);
  const loadAdminDetail = async () => {
    if (window.ipcRenderer) {
      try {
        // Get desktop folder path dynamically here
        const appFolder = await window.ipcRenderer.invoke("get-app-folder");
        if (appFolder) setfolderPath(appFolder);
        const token = await window.ipcRenderer.invoke("get-token");
        const response = await window.ipcRenderer.invoke("getAdmin", token);
        let adminDetail = response?.admin;
        if (adminDetail) {
          localStorage.setItem("admin", JSON.stringify(adminDetail));
          setAdmin(adminDetail);
        }
      } catch (error) {
        console.error("Error invoking get-data:", error);
      }
    } else {
      const stored = localStorage.getItem("admin");
      if (stored) {
        try { setAdmin(JSON.parse(stored)); } catch (e) {}
      }
    }
  };

  const saveToFile = async (fileName, data) => {
    if (!window.ipcRenderer) return;
    try {
      const savedRes = await window.ipcRenderer.invoke("save-json", {
        fileName,
        data,
      });
    } catch (err) {
      console.error("Error saving JSON:", err);
    }
  };
  const [isLoadingFamily, setIsLoadingFamily] = useState(true);
  const [isLoadingKariyas, setIsLoadingKariyas] = useState(true);
  const [isLoadingMohalla, setIsLoadingMohalla] = useState(true);
  const [isLoadingPopulation, setIsLoadingPopulation] = useState(true);
  const [syncing, setSyncing] = useState(true);
  const [addedNew, setAddedNew] = useState(false);
  const [isFileExist, setIsFileExist] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [retry, setRetry] = useState(0);

  const checkDBConnection = async () => {
    if (!window.ipcRenderer) return { success: true, message: "Browser mode" };
    try {
      const connectionStatus = await window.ipcRenderer.invoke("dbconnection");
      return connectionStatus;
    } catch (error) {
      console.error("Error checking connection:", error);
      return { success: false, message: "Error occurred" };
    }
  };
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      const connectionResponse = await checkDBConnection();
      setDbConnected(connectionResponse?.success ?? true);
    };
    fetchConnectionStatus();
  }, []);

  useEffect(() => {
    loadAdminDetail();
    setIsLoading(false);
  }, [isLoggedIn, dbConnected]);

  const [mohallaDetail, setMohallaDetail] = useState(allmohalla || {});

  // Generic function to load data
  const loadData = async (
    key,
    apiMethod,
    setState,
    setLoadingState,
    fromLocal = true
  ) => {
    if (typeof setLoadingState === "function") setLoadingState(true);
    try {
      let data = null;
      if (!window.ipcRenderer) {
        // Fallback for browser mode: fetch from local backend HTTP server if needed
        try {
          const apiEndpointMap = {
            getallfamily: "/api/user/families",
            getkariyas: "/api/user/kariyas",
            getmohallas: "/api/user/mohallas",
            getallmember: "/api/user/members",
          };
          const endpoint = apiEndpointMap[apiMethod];
          if (endpoint) {
            const res = await fetch(`http://localhost:5002${endpoint}`).then((r) => r.json()).catch(() => null);
            data = res?.data || res?.families || res?.mohallas || res?.kariyas || res?.members || null;
          }
        } catch (e) {
          data = null;
        }
      } else {
        data =
          !isFileExist && fromLocal
            ? await loadStoredData(key)
            : await window.ipcRenderer.invoke(apiMethod).then((response) => {
                if (response?.success) {
                  saveToFile(key, response[Object.keys(response)[2]]);
                  return response[Object.keys(response)[2]];
                }
                return null;
              });
      }
      setState(data);
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
    } finally {
      if (typeof setLoadingState === "function") setLoadingState(false);
    }
  };

  const SyncData = async (fromhomepage) => {
    if (!isOnline) {
      setSyncing(false);
      return;
    }
    if (!window.ipcRenderer) {
      setSyncing(true);
      await loadFreshData();
      setSyncing(false);
      return;
    }

    try {
      if (fromhomepage) {
        setSyncing(true);
        try {
          await loadFreshData();
        } catch (error) {
          console.error("Error loading fresh data:", error);
        } finally {
          setSyncing(false);
        }
        return;
      }

      const uploadRes = await window.ipcRenderer.invoke("sync-local-data");
      if (uploadRes?.success) {
        await loadFreshData();
      }
    } catch (error) {
      console.error("Error during sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const loadFreshData = async () => {
    const keys = [
      { key: "familyDetail", apiMethod: "getallfamily", setter: setAllFamily },
      { key: "kariyaDetail", apiMethod: "getkariyas", setter: setAllKariyas },
      { key: "mohallaDetail", apiMethod: "getmohallas", setter: setAllMohalla },
      { key: "Population", apiMethod: "getallmember", setter: setPopulation },
    ];
    for (const { key, apiMethod, setter } of keys) {
      await loadData(key, apiMethod, setter, () => {}, false);
    }
  };

  const checkLocalFiles = async (fileNames) => {
    if (!window.ipcRenderer) return [];
    try {
      const response = await window.ipcRenderer.invoke("check-local-file", fileNames);
      if (response?.success) {
        const files = response.files.map((file) => ({
          fileName: file.fileName,
          exists: file.exists,
          filePath: file.filePath,
        }));
        return files;
      }
      return [];
    } catch (error) {
      console.error("Error checking files:", error);
      return [];
    }
  };

  // Function to load one file locally or from server if missing locally
  const loadFile = async (fileName, apiEndpoint, setData, setLoading) => {
    const files = await checkLocalFiles([fileName + ".json"]);
    const fileExists = files.some(
      (file) => file.fileName === fileName + ".json" && file.exists
    );
    if (fileExists) {
      const localData = await loadStoredData(fileName);
      setData(localData);
    } else {
      await loadData(fileName, apiEndpoint, setData, setLoading);
    }
  };
  // Load all files locally without network calls (for offline)
  const loadAllLocalData = async () => {
    const localFamilyDetail = await loadStoredData("familyDetail");
    setAllFamily(localFamilyDetail);
    const localKariyaDetail = await loadStoredData("kariyaDetail");
    setAllKariyas(localKariyaDetail);
    const localMohallaDetail = await loadStoredData("mohallaDetail");
    setAllMohalla(localMohallaDetail);
    const localPopulation = await loadStoredData("Population");
    setPopulation(localPopulation);
  };
  useEffect(() => {
    const initializeSync = async () => {
      if (isOnline && dbConnected && isLoggedIn) {
        if (addedNew) {
          console.log("New data added, fetching fresh data...");
          setSyncing(true);
          await loadFreshData();
          setSyncing(false);

          return;
        }
        const filesExist = await checkLocalFiles(["local-insert.json"]);
        if (
          filesExist.some(
            (file) => file.fileName === "local-insert.json" && file.exists
          )
        ) {
          console.log("local-insert.json found, starting sync...");
          setSyncing(true);
          await SyncData();
        } else {
          const requiredFiles = [
            {
              fileName: "familyDetail",
              api: "getallfamily",
              setter: setAllFamily,
              loadingSetter: setIsLoadingFamily,
            },
            {
              fileName: "kariyaDetail",
              api: "getkariyas",
              setter: setAllKariyas,
              loadingSetter: setIsLoadingKariyas,
            },
            {
              fileName: "mohallaDetail",
              api: "getmohallas",
              setter: setAllMohalla,
              loadingSetter: setIsLoadingMohalla,
            },
            {
              fileName: "Population",
              api: "getallmember",
              setter: setPopulation,
              loadingSetter: setIsLoadingPopulation,
            },
          ];

          const files = await checkLocalFiles(
            requiredFiles.map((f) => f.fileName + ".json")
          );

          // If any required file exists locally, load individually with fallback to server
          if (files.some((file) => file.exists)) {
            for (const f of requiredFiles) {
              await loadFile(f.fileName, f.api, f.setter, f.loadingSetter);
            }
          } else {
            setSyncing(true);
            console.log("Files missing locally, fetching fresh data...");
            await loadFreshData();
            setSyncing(false);
          }
        }
      } else {
        if (!isOnline) {
          // Offline or DB disconnected → load all from local storage directly
          console.log("Offline or DB disconnected, loading from local only...");
          await loadAllLocalData();
        }
      }
    };
    initializeSync();
  }, [isOnline, dbConnected, isFileExist, addedNew, retry, isLoggedIn]);

  useEffect(() => {
    // Handle the syncing state based on file existence
    if (!isFileExist) {
      setSyncing(false); // No sync needed if files don't exist
    }
  }, [isFileExist]);

  // Function to load data from local storage
  const loadStoredData = async (fileName) => {
    if (!window.ipcRenderer) {
      const local = localStorage.getItem(fileName);
      try { return local ? JSON.parse(local) : null; } catch (e) { return null; }
    }
    try {
      const storedData = await window.ipcRenderer.invoke("get-json", { fileName });
      let ResStatus = storedData?.success;
      let ResData = storedData?.parsedData;
      if (ResStatus) {
        return ResData || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error loading JSON:", error);
      return null;
    }
  };

  const handleRetry = () => {
    setRetry((prev) => prev + 1);
  };

  const deleteAllData = async () => {
    if (!window.ipcRenderer) {
      setAllFamily(null);
      setAllKariyas(null);
      setAllMohalla(null);
      setPopulation(null);
      setAdmin(null);
      setIsLoggedIn(false);
      localStorage.clear();
      return { success: true };
    }
    try {
      const result = await window.ipcRenderer.invoke("delete-all-data");
      if (result.success) {
        setAllFamily(null);
        setAllKariyas(null);
        setAllMohalla(null);
        setPopulation(null);
        setAdmin(null);
        setIsLoggedIn(false);
        localStorage.clear();
        setShowToastMessage("All data deleted successfully");
        setShowToast(true);
      }
      return result;
    } catch (error) {
      console.error("Error deleting all data:", error);
      setShowToastMessage("Error deleting data");
      setShowToast(true);
      return { success: false, error: error.message };
    }
  };

  const deleteAllImages = async () => {
    if (!window.ipcRenderer) return { success: true };
    try {
      const result = await window.ipcRenderer.invoke("delete-all-images");
      if (result.success) {
        setShowToastMessage(`Deleted ${result.totalFilesDeleted} image files`);
        setShowToast(true);
      }
      return result;
    } catch (error) {
      console.error("Error deleting images:", error);
      setShowToastMessage("Error deleting images");
      setShowToast(true);
      return { success: false, error: error.message };
    }
  };

  const getStorageStats = async () => {
    if (!window.ipcRenderer) return { success: true, stats: { totalSize: 0, dataFiles: [], imageFolders: [] } };
    try {
      const result = await window.ipcRenderer.invoke("get-storage-stats");
      return result;
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isOnline,
        admin,
        setAdmin,
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn,
        // Main State
        allfamily,
        setAllFamily,
        allkariyas,
        allmohalla,
        setAllMohalla,
        population,
        setPopulation,
        mohallaDetail,
        setMohallaDetail,
        isLoading,
        syncing,
        setAddedNew,
        folderPath,
        getSanitizedLocalFilePathSync,
        // TableStyles,
        handleRetry,
        showToast,
        setShowToast,
        toastMessage,
        SyncData,
        loadFreshData,
        deleteAllData,
        deleteAllImages,
        getStorageStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useGlobalContext = () => useContext(AuthContext);

export const getSanitizedLocalFilePathSync = (url, localFolder) => {
  try {
    if (!url) return null;
    if (!window.ipcRenderer) return url;

    // Check if already a local path (starts with "/Users" or "C:\\" or similar)
    if (
      url.startsWith("/") ||
      url.startsWith("C:\\") ||
      url.startsWith("file://")
    ) {
      const localPath = url.startsWith("file://")
        ? url.replace("file://", "")
        : url;

      const exists = window.ipcRenderer.sendSync(
        "check-file-exists-sync",
        localPath
      );

      return exists ? `file://${localPath}` : null;
    }

    // Cloudinary-style URL handling
    if (!localFolder) return url;

    const relativePath = new URL(url).pathname.split("/upload/")[1];
    if (!relativePath) return url;

    const sanitizedFileName = relativePath.replace(/\//g, "_");
    const fullLocalPath = `${localFolder}/${sanitizedFileName}`;

    const fileExists = window.ipcRenderer.sendSync(
      "check-file-exists-sync",
      fullLocalPath
    );

    return fileExists ? `file://${fullLocalPath}` : url;
  } catch (err) {
    console.error("Invalid path or URL:", err);
    return null;
  }
};
