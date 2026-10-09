import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalContext } from "../AuthContext";

function UserSettingsDrawer({ open, onClose, admin }) {
  const { setAdmin } = useGlobalContext();
  const ipcRenderer = window.ipcRenderer;

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [profileData, setProfileData] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
  });

  // Keep state synced with admin prop
  useEffect(() => {
    if (admin) {
      setProfileData({
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
      });
    }
  }, [admin]);

  // Password reset state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle profile field changes
  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setProfileError("");
    setProfileSuccess("");
  };

  // Handle password field changes
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }

    setSaving(true);
    setProfileError("");
    setProfileSuccess("");

    const targetAdminId =
      typeof admin?._id === "string"
        ? admin._id
        : admin?._id?.toString?.() || admin?.id || "";

    try {
      if (ipcRenderer) {
        const response = await ipcRenderer.invoke("updateAdmin", {
          id: targetAdminId,
          data: {
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
          },
        });

        if (response?.success) {
          setProfileSuccess(response.message || "Profile updated successfully!");
          if (response.admin && setAdmin) {
            setAdmin(response.admin);
            localStorage.setItem("admin", JSON.stringify(response.admin));
          } else if (setAdmin) {
            const updated = { ...admin, ...profileData };
            setAdmin(updated);
            localStorage.setItem("admin", JSON.stringify(updated));
          }
          setEditMode(false);
        } else {
          setProfileError(response?.message || "Failed to update profile");
        }
      } else {
        setProfileError("Desktop communication service unavailable");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setProfileError(err?.message || "Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Cancel profile edit
  const handleCancelEdit = () => {
    setProfileData({
      name: admin?.name || "",
      email: admin?.email || "",
      phone: admin?.phone || "",
    });
    setEditMode(false);
    setProfileError("");
    setProfileSuccess("");
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!passwordData.newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    const targetAdminId =
      typeof admin?._id === "string"
        ? admin._id
        : admin?._id?.toString?.() || admin?.id || "";

    try {
      if (ipcRenderer) {
        const response = await ipcRenderer.invoke("updateAdmin", {
          id: targetAdminId,
          data: {
            password: passwordData.newPassword,
          },
        });

        if (response?.success) {
          setPasswordSuccess(response.message || "Password updated successfully!");
          if (response.admin && setAdmin) {
            setAdmin(response.admin);
            localStorage.setItem("admin", JSON.stringify(response.admin));
          }
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          setPasswordError(response?.message || "Failed to update password");
        }
      } else {
        setPasswordError("Desktop communication service unavailable");
      }
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordError(err?.message || "Error updating password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto z-50 flex flex-col justify-between"
      >
        <div>
          <SheetHeader className="relative pb-2">
            <SheetTitle>Account Settings</SheetTitle>
            <SheetDescription>
              Manage your profile details and account security
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Profile Avatar Section */}
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={admin?.avatar} alt={admin?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {profileData.name || "User"}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Administrator
                </p>
              </div>
            </div>

            {/* Tabs for Profile & Password */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                {profileSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          handleProfileChange("name", e.target.value)
                        }
                        disabled={!editMode || saving}
                        placeholder="Enter your full name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                        disabled={!editMode || saving}
                        placeholder="Enter your email"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        disabled={!editMode || saving}
                        placeholder="Enter your phone number"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {editMode ? (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 gap-2"
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="space-y-4 mt-4">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Must be at least 6 characters long
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {passwordError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                {/* Reset Password Button */}
                <div className="pt-2">
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    onClick={handleResetPassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="pt-4 border-t mt-4">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default UserSettingsDrawer;
