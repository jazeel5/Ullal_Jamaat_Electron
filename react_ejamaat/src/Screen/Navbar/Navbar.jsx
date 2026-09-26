import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  Users,
  UserCircle,
  RefreshCw,
  Settings,
  Moon,
  Sun,
  LogOut,
  HardDrive,
  Images,
  Trash2,
  Database,
  Loader2,
  BarChart3,
  AlertCircle,
  FileJson,
  Folder,
  File,
  Bell,
  Megaphone,
  Coins,
} from "lucide-react";
import { useGlobalContext } from "../AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import UserSettingsDrawer from "./UserSettingsDrawer";
import { useTheme } from "../ThemeProvider";
import Logo from "../Logo/Logo";

// Storage Stats Dialog Component
function StorageStatsDialog({ open, onOpenChange, storageStats, isLoading }) {
  if (!storageStats && !isLoading) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to remove .json extension from filename
  const getFileNameWithoutExtension = (filename) => {
    return filename.replace(/\.json$/i, "");
  };

  const stats = storageStats?.stats;
  const totalSize = stats?.totalSize || 0;

  // Calculate file stats
  const totalDataFiles = stats?.dataFiles?.length || 0;
  const totalImageFiles =
    stats?.imageFolders?.reduce((sum, folder) => sum + folder.fileCount, 0) ||
    0;
  const totalAllFiles = totalDataFiles + totalImageFiles;

  // Calculate image folder sizes
  const imageSize =
    stats?.imageFolders?.reduce((sum, folder) => sum + folder.size, 0) || 0;
  const dataSize =
    stats?.dataFiles?.reduce((sum, file) => sum + file.size, 0) || 0;

  // Get warning threshold (e.g., 500MB)
  const warningThreshold = 500 * 1024 * 1024;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Statistics
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of local storage usage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : storageStats ? (
            <>
              {/* Total Storage Card */}
              <Card className="border-border/40 bg-gradient-to-br from-primary/5 to-primary/0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    Total Storage Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    {formatBytes(totalSize)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats?.totalSizeMB} MB ({stats?.totalSizeKB} KB)
                  </p>

                  {/* Storage Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Data Files
                      </p>
                      <p className="font-semibold">{formatBytes(dataSize)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.dataFiles?.length} files
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Images
                      </p>
                      <p className="font-semibold">{formatBytes(imageSize)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalImageFiles} files
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Data Files and Image Folders */}
              <Tabs defaultValue="dataFiles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dataFiles" className="gap-2">
                    <FileJson className="h-4 w-4" />
                    <span className="hidden sm:inline">Data Files</span>
                  </TabsTrigger>
                  <TabsTrigger value="imageFolders" className="gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="hidden sm:inline">Image Folders</span>
                  </TabsTrigger>
                </TabsList>

                {/* Data Files Tab */}
                <TabsContent value="dataFiles" className="space-y-3">
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-500" />
                        Data Files ({stats?.dataFiles?.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stats?.dataFiles && stats.dataFiles.length > 0 ? (
                        stats.dataFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {getFileNameWithoutExtension(file.name)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.sizeMB} MB
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-semibold">
                                {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No data files found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Image Folders Tab */}
                <TabsContent value="imageFolders" className="space-y-3">
                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Folder className="h-4 w-4 text-amber-500" />
                        Image Folders ({stats?.imageFolders?.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats?.imageFolders && stats.imageFolders.length > 0 ? (
                        stats.imageFolders.map((folder, index) => (
                          <div
                            key={index}
                            className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            {/* Folder Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-amber-500" />
                                <p className="font-medium text-sm">
                                  {folder.name}
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {formatBytes(folder.size)}
                              </p>
                            </div>

                            {/* Folder Stats */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-background/50 p-2 rounded">
                                <p className="text-muted-foreground">Files</p>
                                <p className="font-semibold">
                                  {folder.fileCount}
                                </p>
                              </div>
                              <div className="bg-background/50 p-2 rounded">
                                <p className="text-muted-foreground">Size</p>
                                <p className="font-semibold">
                                  {folder.sizeMB} MB
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {totalSize > 0 && (
                              <div className="mt-2">
                                <Progress
                                  value={(folder.size / totalSize) * 100}
                                  className="h-1.5"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {((folder.size / totalSize) * 100).toFixed(1)}
                                  % of total
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No image folders found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Storage Warning */}
              {totalSize > warningThreshold && (
                <div className="flex gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Storage usage is over 500 MB. Consider deleting old images
                    to free up space.
                  </p>
                </div>
              )}

              {/* Summary Stats */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Files</span>
                    <span className="font-semibold">{totalAllFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Data Files</span>
                    <span className="font-semibold">{totalDataFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Image Files</span>
                    <span className="font-semibold">{totalImageFiles}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
                    <span>Total Storage</span>
                    <span className="text-primary">
                      {stats?.totalSizeMB} MB
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Unable to load storage stats
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NavBar() {
  const { theme, toggleTheme } = useTheme();
  const {
    syncing,
    loading,
    SyncData,
    admin,
    deleteAllData,
    deleteAllImages,
    getStorageStats,
    isOnline,
  } = useGlobalContext();

  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storageStatsOpen, setStorageStatsOpen] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [pendingUpdateCount, setPendingUpdateCount] = useState(0);
  const [pendingAidCount, setPendingAidCount] = useState(0);

  useEffect(() => {
    let intervalId;
    const fetchCount = async () => {
      try {
        const res = await fetch("http://localhost:5002/api/user/update-requests/count");
        const data = await res.json();
        if (data && data.success) {
          setPendingUpdateCount(data.count || 0);
        }

        const aidRes = await fetch("http://localhost:5002/api/marriage-aid/pending-count");
        const aidData = await aidRes.json();
        if (aidData && aidData.success) {
          setPendingAidCount(aidData.count || 0);
        }
      } catch (e) {
        // Silently ignore if server offline
      }
    };

    fetchCount();
    intervalId = setInterval(fetchCount, 8000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline]);

  const handleNavigate = async (route) => {
    if (route === "logout") {
      await window.ipcRenderer?.invoke("clear-token");
      navigate("/");
    } else {
      navigate(`/${route}`);
    }
  };

  const navButtons = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      path: "/mohalla",
      label: "Mohalla",
      icon: Building2,
    },
    {
      path: "/family",
      label: "Families",
      icon: Users,
    },
    {
      path: "/population",
      label: "Members",
      icon: UserCircle,
    },
    {
      path: "/announcements",
      label: "Announcements",
      icon: Megaphone,
    },
    {
      path: "/marriage-aid-requests",
      label: "Marriage Aid",
      icon: Coins,
      badge: pendingAidCount,
    },
  ];

  const handleDeleteData = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all data? This cannot be undone."
      )
    ) {
      await deleteAllData();
    }
  };

  const handleDeleteImages = async () => {
    if (window.confirm("Are you sure you want to delete all images?")) {
      await deleteAllImages();
    }
  };

  const handleViewStorage = async () => {
    setStorageStatsOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center justify-between px-4 w-full">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Logo />
            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {navButtons.map((btn) => {
                const Icon = btn.icon;
                const isActive = location.pathname === btn.path;

                return (
                  <Button
                    key={btn.path}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleNavigate(btn.path.slice(1))}
                    className={cn("gap-1.5 whitespace-nowrap px-3 text-xs md:text-sm relative", isActive && "shadow-sm")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{btn.label}</span>
                    {btn.badge > 0 && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow">
                        {btn.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Sync Status/Button */}
            {isOnline && (
              <>
                {syncing ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => SyncData(true)}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Sync</span>
                  </Button>
                )}
              </>
            )}

            {/* Notification Bell for Update Requests */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/update-requests")}
              className="relative"
              title="Profile Update Requests Notification"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {pendingUpdateCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow animate-pulse">
                  {pendingUpdateCount}
                </span>
              )}
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>

                {isOnline && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleViewStorage}>
                      <HardDrive className="mr-2 h-4 w-4" />
                      <span>Storage Stats</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteImages}>
                      <Images className="mr-2 h-4 w-4" />
                      <span>Delete Images</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeleteData}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete All Data</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleNavigate("logout")}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Avatar - Opens Drawer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={admin?.avatar} alt={admin?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(admin?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </nav>

      {/* User Settings Drawer */}
      {drawerOpen && (
        <UserSettingsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          admin={admin}
        />
      )}

      {/* Storage Stats Dialog */}
      <StorageStatsDialog
        open={storageStatsOpen}
        onOpenChange={setStorageStatsOpen}
        storageStats={storageStats}
        isLoading={isLoadingStats}
      />
    </>
  );
}
