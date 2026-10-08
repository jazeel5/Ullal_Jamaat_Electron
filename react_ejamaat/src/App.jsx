import React, { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Wifi, WifiOff, X, Loader2 } from "lucide-react";
import Login from "./Pages/Login";
import NavBar from "./Screen/Navbar/Navbar";
import Mohalla from "./Screen/Mohalla/Mohalla";
// import Dashboard from "./Screen/Home/Dashboard";
// import Family from "./Screen/Home/Family";
// import SingleMohalla from "./Screen/Mohalla/SingleMohalla";
// import SingleFamily from "./Screen/Family/SingleFamily";
// import Population from "./Screen/Population/Population";
// import ControlFamily from "./Screen/Family/ControleFamily";
import { useGlobalContext } from "./Screen/AuthContext";
import { Button } from "@/components/ui/button";
import SingleMohalla from "./Screen/Mohalla/SingleMohalla";
import SingleFamily from "./Screen/Family/SingleFamily";
import Family from "./Screen/Family/Family";
import ControlFamily from "./Screen/Family/ControlFamily";
import Population from "./Screen/Population/Population";
import Dashboard from "./Screen/Dashboard/Dashboard";
import UpdateRequestsReview from "./Screen/UpdateRequests/UpdateRequestsReview";
import AnnouncementComingSoon from "./Screen/Announcement/AnnouncementComingSoon";
import MarriageAidReview from "./Screen/MarriageAid/MarriageAidReview";
import { AppUpdatesProvider } from "./components/AppUpdates";

// Create a separate component that uses useLocation
function AppContent() {
  const location = useLocation(); // Now it's inside Router context
  const navigate = useNavigate();
  const {
    loading,
    setLoading,
    setIsLoggedIn,
    isOnline,
    handleRetry,
    showToast,
    toastMessage,
    setShowToast,
  } = useGlobalContext();

  const ipcRenderer = window.ipcRenderer;

  useEffect(() => {
    const checkLogin = async () => {
      let userLoggedIn = null;
      if (ipcRenderer) {
        userLoggedIn = await ipcRenderer.invoke("get-token");
      } else {
        userLoggedIn = localStorage.getItem("Token");
      }
      setIsLoggedIn(userLoggedIn);
      setLoading(false);

      if (!userLoggedIn) {
        navigate("/"); // Redirect to Login page
      } else if (location.pathname === "/") {
        navigate("/mohalla"); // Redirect to Mohalla if at root
      }
    };

    checkLogin();
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Show Navbar for all routes except Login */}
      {location.pathname !== "/" && <NavBar />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/mohalla" element={<Mohalla />} />

        {/* Commented Routes - Uncomment when ready */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/family" element={<Family />} />
        <Route path="/addfamily" element={<ControlFamily />} />
        <Route path="/addfamily/:family_id" element={<ControlFamily />} />
        <Route path="/singlemohalla/:mohalla_id" element={<SingleMohalla />} />
        <Route path="/singlefamily/:family_id" element={<SingleFamily />} />
        <Route path="/population" element={<Population />} />
        <Route path="/update-requests" element={<UpdateRequestsReview />} />
        <Route path="/announcements" element={<AnnouncementComingSoon />} />
        <Route path="/marriage-aid-requests" element={<MarriageAidReview />} />
        
        {/* 404 Route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all ${
              isOnline
                ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100"
                : "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100"
            }`}
          >
            {/* Icon */}
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}

            {/* Message */}
            <span className="text-sm font-medium">{toastMessage}</span>

            {/* Retry Button (only when offline) */}
            {!isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-7 text-xs"
              >
                Retry
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowToast(false)}
              className="h-7 w-7 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <AppUpdatesProvider>
        <AppContent />
      </AppUpdatesProvider>
    </HashRouter>
  );
}

export default App;
