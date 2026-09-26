import React, { useState, useEffect, useMemo } from "react";
import { useGlobalContext } from "../AuthContext";
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Calendar,
  Pin,
  Image as ImageIcon,
  Tag,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "General Notice",
  "Mosque Program",
  "Event & Program",
  "Urgent Announcement",
  "Exam Dates",
  "Other",
];

export default function Announcement() {
  const globalContext = useGlobalContext();
  const contextKariyas = globalContext?.allkariyas;
  const contextMohallas = globalContext?.allmohalla;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  // Kariya & Mohalla Selection States
  const [kariyas, setKariyas] = useState([]);
  const [mohallas, setMohallas] = useState([]);
  const [targetKariyas, setTargetKariyas] = useState([]);
  const [targetMohallas, setTargetMohallas] = useState([]);
  const [expandedKariyas, setExpandedKariyas] = useState({});

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState("ACTIVE"); // "ACTIVE" | "HISTORY"

  const toDateString = (d) => {
    if (!d) return null;
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isExpired = (item) => {
    if (!item) return false;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const expStr = toDateString(item.expireDate);
    const evtStr = toDateString(item.eventDate);

    // If expireDate is explicitly set:
    // It is expired once the expiry date has arrived or passed (expStr <= todayStr)
    if (expStr) {
      if (expStr <= todayStr) return true;
      return false;
    }

    // If no expireDate, but eventDate is specified:
    // It is expired once the event date has passed (evtStr < todayStr)
    if (evtStr) {
      if (evtStr < todayStr) return true;
    }

    return false;
  };

  // Create / Edit Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General Notice");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [createdByName, setCreatedByName] = useState("Jamaat Committee");
  const [imageDocs, setImageDocs] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Detail View Modal State
  const [viewEntry, setViewEntry] = useState(null);
  const [activeViewImageIndex, setActiveViewImageIndex] = useState(0);

  const handleOpenView = (item) => {
    setActiveViewImageIndex(0);
    setViewEntry(item);
  };

  // Fetch Kariyas & Mohallas
  const fetchLocations = async () => {
    try {
      let fetchedK = Array.isArray(contextKariyas) && contextKariyas.length > 0 ? contextKariyas : [];
      let fetchedM = Array.isArray(contextMohallas) && contextMohallas.length > 0 ? contextMohallas : [];

      if (fetchedK.length === 0) {
        const resK = await fetch("http://localhost:5002/api/kariya/view").then((r) => r.json()).catch(() => null);
        if (resK && (resK.kariya || resK.data)) fetchedK = resK.kariya || resK.data || [];
      }
      if (fetchedM.length === 0) {
        const resM = await fetch("http://localhost:5002/api/mohalla/public-list").then((r) => r.json()).catch(() => null);
        if (resM && (resM.mohallas || resM.mohalla)) fetchedM = resM.mohallas || resM.mohalla || [];
        else {
          const resM2 = await fetch("http://localhost:5002/api/mohalla/view").then((r) => r.json()).catch(() => null);
          if (resM2 && (resM2.mohalla || resM2.data)) fetchedM = resM2.mohalla || resM2.data || [];
        }
      }

      setKariyas(fetchedK);
      setMohallas(fetchedM);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [contextKariyas, contextMohallas]);

  // Master Checkbox Toggle
  const handleMasterToggle = (checked) => {
    if (checked) {
      setTargetKariyas(kariyas.map((k) => k._id));
      setTargetMohallas(mohallas.map((m) => m._id));
    } else {
      setTargetKariyas([]);
      setTargetMohallas([]);
    }
  };

  // Toggle Entire Kariya + Child Mohallas
  const handleKariyaToggle = (kId, checked) => {
    const childMohallas = mohallas
      .filter((m) => (typeof m.kariya_id === "object" ? m.kariya_id?._id : m.kariya_id) === kId)
      .map((m) => m._id);

    if (checked) {
      setTargetKariyas((prev) => (prev.includes(kId) ? prev : [...prev, kId]));
      setTargetMohallas((prev) => Array.from(new Set([...prev, ...childMohallas])));
    } else {
      setTargetKariyas((prev) => prev.filter((id) => id !== kId));
      setTargetMohallas((prev) => prev.filter((id) => !childMohallas.includes(id)));
    }
  };

  // Toggle Individual Mohalla
  const handleMohallaToggle = (mId, kId, checked) => {
    if (checked) {
      setTargetMohallas((prev) => (prev.includes(mId) ? prev : [...prev, mId]));
      if (!targetKariyas.includes(kId)) {
        setTargetKariyas((prev) => [...prev, kId]);
      }
    } else {
      setTargetMohallas((prev) => prev.filter((id) => id !== mId));
    }
  };

  const handleToggleExpandKariya = (kId) => {
    setExpandedKariyas((prev) => ({
      ...prev,
      [kId]: !prev[kId],
    }));
  };

  // Helper to get auth token
  const getAuthHeaders = async () => {
    let token = null;
    if (window.ipcRenderer) {
      try {
        token = await window.ipcRenderer.invoke("get-token");
      } catch (e) {
        console.error("Error fetching token:", e);
      }
    }
    if (!token) token = localStorage.getItem("Token");

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["auth-token"] = token;
      headers["authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch Announcements from Backend
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("http://localhost:5002/api/announcement/get-all?includeExpired=true", { headers });
      const data = await res.json();
      if (data && data.success) {
        setAnnouncements(data.announcements || []);
      } else {
        setError(data.message || "Failed to load announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Unable to connect to server. Please ensure backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Open Dialog for Create (DEFAULT ALL SELECTED)
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setTitle("");
    setCategory("General Notice");
    setDescription("");
    setEventDate("");
    setExpireDate("");
    setIsPinned(false);
    setCreatedByName("Jamaat Committee");
    setImageDocs([]);
    setImagePreviews([]);
    setTargetKariyas(kariyas.map((k) => k._id));
    setTargetMohallas(mohallas.map((m) => m._id));
    setDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setTitle(item.title || "");
    setCategory(item.category || "General Notice");
    setDescription(item.description || "");
    setEventDate(item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 10) : "");
    setExpireDate(item.expireDate ? new Date(item.expireDate).toISOString().slice(0, 10) : "");
    setIsPinned(Boolean(item.isPinned));
    setCreatedByName(item.createdByName || "Jamaat Committee");
    setImageDocs(item.imageDocs || (item.imageDoc ? [item.imageDoc] : []));
    setImagePreviews(item.imageDocs || (item.imageDoc ? [item.imageDoc] : []));

    const itemKariyas = Array.isArray(item.targetKariyas) && item.targetKariyas.length > 0
      ? item.targetKariyas.map((k) => (typeof k === "object" ? k._id : k))
      : kariyas.map((k) => k._id);

    const itemMohallas = Array.isArray(item.targetMohallas) && item.targetMohallas.length > 0
      ? item.targetMohallas.map((m) => (typeof m === "object" ? m._id : m))
      : mohallas.map((m) => m._id);

    setTargetKariyas(itemKariyas);
    setTargetMohallas(itemMohallas);
    setDialogOpen(true);
  };

  // Image Upload Handler (Base64 conversion)
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result;
        setImageDocs((prev) => [...prev, base64Str]);
        setImagePreviews((prev) => [...prev, base64Str]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageDocs((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Save / Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title,
        category,
        description,
        eventDate: eventDate || null,
        expireDate: expireDate || null,
        isPinned,
        targetKariyas,
        targetMohallas,
        createdByName,
        imageDocs,
        imageDoc: imageDocs.length > 0 ? imageDocs[0] : "",
      };

      const url = isEditing
        ? `http://localhost:5002/api/announcement/update/${currentId}`
        : "http://localhost:5002/api/announcement/create";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.success) {
        setDialogOpen(false);
        fetchAnnouncements();
      } else {
        alert(data.message || "Failed to save announcement");
      }
    } catch (err) {
      console.error("Error submitting announcement:", err);
      alert("Server connection failed while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`http://localhost:5002/api/announcement/delete/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data && data.success) {
        fetchAnnouncements();
      } else {
        alert(data.message || "Failed to delete announcement.");
      }
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Connection failed while deleting.");
    }
  };

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const expired = isExpired(item);

      if (activeTab === "ACTIVE" && expired) return false;
      if (activeTab === "HISTORY" && !expired) return false;

      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(term);
        const matchesDesc = item.description?.toLowerCase().includes(term);
        const matchesCategory = item.category?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }
      return true;
    });
  }, [announcements, activeTab, selectedCategory, searchTerm]);

  // Priority Color Badge Helper
  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case "Urgent Announcement":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
      case "Mosque Program":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Event & Program":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "Exam Dates":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Announcements & Community Notices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish notices, event alerts, emergency news, and funeral updates to mobile users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="default" size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Total Published
              <Megaphone className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All announcements</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-all" onClick={() => setActiveTab("ACTIVE")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Active Notices
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {announcements.filter((a) => !isExpired(a)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently live on mobile</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm cursor-pointer hover:border-amber-500/50 transition-all" onClick={() => setActiveTab("HISTORY")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Expired History
              <Clock className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {announcements.filter((a) => isExpired(a)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Past / Archived notices</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Pinned Notices
              <Pin className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {announcements.filter((a) => a.isPinned && !isExpired(a)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Featured active notices</p>
          </CardContent>
        </Card>
      </div>

      {/* Active vs Expired History Tab Navigation */}
      <div className="flex items-center gap-3 border-b pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
            activeTab === "ACTIVE"
              ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
              : "bg-card text-muted-foreground border-border/60 hover:bg-accent"
          }`}
        >
          <Megaphone className="h-4 w-4 text-emerald-400" />
          Active Announcements
          <Badge variant={activeTab === "ACTIVE" ? "secondary" : "outline"} className="text-[10px] ml-1">
            {announcements.filter((a) => !isExpired(a)).length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
            activeTab === "HISTORY"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm scale-[1.02]"
              : "bg-card text-muted-foreground border-border/60 hover:bg-accent"
          }`}
        >
          <Clock className="h-4 w-4 text-amber-400" />
          Announcement History / Expired
          <Badge variant={activeTab === "HISTORY" ? "secondary" : "outline"} className="text-[10px] ml-1">
            {announcements.filter((a) => isExpired(a)).length}
          </Badge>
        </button>
      </div>

      {/* Filter Controls */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Category Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcement List / Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm">Loading announcements...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-sm font-medium text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
            Try Again
          </Button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="border-border/60 p-12 text-center text-muted-foreground space-y-3">
          <Megaphone className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-base font-semibold">
            {activeTab === "HISTORY" ? "No expired announcements in history" : "No active announcements found"}
          </p>
          <p className="text-xs">
            {activeTab === "HISTORY"
              ? "Notices with past expiration dates will be automatically archived here."
              : 'Click "New Announcement" above to publish a notice.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((item) => {
            const itemIsExpired = isExpired(item);
            return (
              <Card
                key={item._id}
                className={`border-border/60 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  itemIsExpired
                    ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 opacity-85"
                    : item.isPinned
                    ? "border-primary/50 bg-primary/5"
                    : ""
                }`}
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[11px] font-semibold ${getCategoryBadgeClass(item.category)}`}>
                      {item.category}
                    </Badge>

                    {itemIsExpired ? (
                      <Badge variant="destructive" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] gap-1">
                        <Clock className="h-3 w-3" />
                        Expired ({item.expireDate ? new Date(item.expireDate).toLocaleDateString() : 'Past'})
                      </Badge>
                    ) : item.isPinned ? (
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 text-[10px]">
                        <Pin className="h-3 w-3 fill-amber-500" />
                        Pinned
                      </Badge>
                    ) : null}
                  </div>

                  <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
                    {item.title}
                  </CardTitle>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    {item.eventDate && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        Event: {new Date(item.eventDate).toLocaleDateString()}
                      </span>
                    )}
                    {item.expireDate && !itemIsExpired && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        Expires: {new Date(item.expireDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                {/* Optional Attached Image Preview */}
                {(item.imageDoc || (item.imageDocs && item.imageDocs.length > 0)) && (() => {
                  const cardImages = Array.isArray(item.imageDocs) && item.imageDocs.length > 0 ? item.imageDocs : [item.imageDoc];
                  return (
                    <div
                      className="relative rounded-lg overflow-hidden border bg-muted/40 h-44 cursor-pointer group"
                      onClick={() => handleOpenView(item)}
                    >
                      <img
                        src={cardImages[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {cardImages.length > 1 && (
                        <Badge variant="secondary" className="absolute top-2 right-2 bg-black/75 text-white text-[10px] border-0">
                          📷 {cardImages.length} Photos
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Eye className="h-4 w-4" /> View Full Details
                      </div>
                    </div>
                  );
                })()}

                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                  {item.description}
                </p>
              </CardContent>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 border-t mt-3 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                  By: {item.createdByName || "Admin"}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenView(item)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Announcement"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => handleDelete(item._id)}
                    title="Delete Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          style={{ width: "80vw", maxWidth: "850px" }}
          className="sm:max-w-none max-w-none max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {isEditing ? "Edit Announcement" : "Publish New Announcement"}
            </DialogTitle>
            <DialogDescription>
              This announcement will be displayed on the mobile app for community members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Title *</label>
              <Input
                placeholder="e.g., General Body Meeting Notice / Janazah Announcement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Event / Program Date (Optional)</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground text-amber-600 dark:text-amber-400">Announcement Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="text-sm border-amber-300 dark:border-amber-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Publisher Name</label>
              <Input
                value={createdByName}
                onChange={(e) => setCreatedByName(e.target.value)}
                placeholder="e.g. Jamaat Admin"
                className="text-sm"
              />
            </div>

            {/* Kariya & Mohalla Selection Card */}
            <div className="space-y-2 border p-3 rounded-xl bg-muted/20">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> Target Kariyas & Mohallas (Checkbox Selection)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Select target Kariyas and skip specific Mohallas if needed. By default all are selected.
                  </p>
                </div>

                {/* Master Select All Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md text-primary hover:bg-primary/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={mohallas.length > 0 && targetMohallas.length === mohallas.length}
                    onChange={(e) => handleMasterToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Select All (Entire Jamaat)
                </label>
              </div>

              {/* Kariyas & Mohallas Tree */}
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 pt-1">
                {kariyas.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Loading Kariyas and Mohallas...</p>
                ) : (
                  kariyas.map((k) => {
                    const childMohallas = mohallas.filter(
                      (m) => (typeof m.kariya_id === "object" ? m.kariya_id?._id : m.kariya_id) === k._id
                    );
                    const isKSelected = targetKariyas.includes(k._id);
                    const isExpanded = expandedKariyas[k._id];
                    const selectedChildCount = childMohallas.filter((m) => targetMohallas.includes(m._id)).length;

                    return (
                      <div key={k._id} className="border rounded-lg bg-background p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isKSelected}
                              onChange={(e) => handleKariyaToggle(k._id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="font-bold text-xs text-foreground">
                              📍 {k.kariyaName}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                              {selectedChildCount}/{childMohallas.length} Mohallas
                            </Badge>
                          </label>

                          {childMohallas.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleToggleExpandKariya(k._id)}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              <span className="text-[11px]">{isExpanded ? "Hide Mohallas" : "View Mohallas"}</span>
                            </Button>
                          )}
                        </div>

                        {/* Child Mohallas Grid */}
                        {isExpanded && childMohallas.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t bg-muted/30 p-2 rounded-md">
                            {childMohallas.map((m) => {
                              const isMSelected = targetMohallas.includes(m._id);
                              return (
                                <label key={m._id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isMSelected}
                                    onChange={(e) => handleMohallaToggle(m._id, k._id, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span className={isMSelected ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                    {m.mohallaName}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pinnedCheck"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="pinnedCheck" className="text-xs font-medium cursor-pointer">
                📌 Pin to top of mobile app feed (Featured Notice)
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Announcement Content / Description *</label>
              <textarea
                rows={5}
                placeholder="Write full details, timings, location, and details of notice..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Image Attachment Upload */}
            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ImageIcon className="h-4 w-4 text-primary" /> Attach Banner / Photos (Optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
                className="text-xs"
              />

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {imagePreviews.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded border overflow-hidden">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update Announcement" : "Publish Announcement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        {viewEntry && (() => {
          const allImages = Array.isArray(viewEntry.imageDocs) && viewEntry.imageDocs.length > 0
            ? viewEntry.imageDocs
            : (viewEntry.imageDoc ? [viewEntry.imageDoc] : []);

          const createdDateStr = viewEntry.createdAt
            ? new Date(viewEntry.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }) + " • " + new Date(viewEntry.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recent Announcement";

          const targetMohallasCount = Array.isArray(viewEntry.targetMohallas) ? viewEntry.targetMohallas.length : 0;
          const isAllTarget = targetMohallasCount === 0 || (mohallas.length > 0 && targetMohallasCount === mohallas.length);
          const targetLocationLabel = isAllTarget ? "Entire Jamaat (All Mohallas)" : `${targetMohallasCount} Mohallas Targeted`;

          const entryIsExpired = isExpired(viewEntry);

          return (
            <DialogContent
              style={{ width: "90vw", maxWidth: "1150px" }}
              className="sm:max-w-none max-w-none max-h-[92vh] overflow-y-auto p-6 space-y-6"
            >
              <DialogHeader className="space-y-3 pb-3 border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-xs font-semibold ${getCategoryBadgeClass(viewEntry.category)}`}>
                    {viewEntry.category}
                  </Badge>

                  {viewEntry.isPinned && !entryIsExpired && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 text-xs">
                      📌 Pinned Notice
                    </Badge>
                  )}

                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {targetLocationLabel}
                  </Badge>

                  {entryIsExpired ? (
                    <Badge variant="destructive" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-xs gap-1">
                      <Clock className="h-3.5 w-3.5" /> ⚠️ Expired Announcement
                    </Badge>
                  ) : viewEntry.expireDate ? (
                    <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                      ⏳ Expires: {new Date(viewEntry.expireDate).toLocaleDateString()}
                    </Badge>
                  ) : null}
                </div>

                <DialogTitle className="text-xl md:text-2xl font-bold leading-snug">
                  {viewEntry.title}
                </DialogTitle>

                <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-4 pt-1">
                  <span>Published on <strong className="text-foreground">{createdDateStr}</strong></span>
                  <span>•</span>
                  <span>Publisher: <strong className="text-foreground">{viewEntry.createdByName || "Jamaat Admin"}</strong></span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Event Date Alert Card if present */}
                {viewEntry.eventDate && (
                  <div className="p-3.5 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Event / Program Date:
                    </span>
                    <span className="font-bold text-primary font-mono text-sm">
                      {new Date(viewEntry.eventDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {/* Multi-Image Interactive Gallery */}
                {allImages.length > 0 && (
                  <div className="space-y-3">
                    {/* Main Image Viewer */}
                    <div className="relative rounded-xl overflow-hidden border bg-black/60 h-[340px] md:h-[420px] flex items-center justify-center">
                      <img
                        src={allImages[activeViewImageIndex] || allImages[0]}
                        alt={`${viewEntry.title} photo ${activeViewImageIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />

                      {/* Photo Counter Badge */}
                      <Badge variant="secondary" className="absolute bottom-3 right-3 bg-black/80 text-white border-0 text-xs px-3 py-1 shadow-md">
                        📷 Photo {activeViewImageIndex + 1} of {allImages.length}
                      </Badge>

                      {/* Previous / Next Arrow Controls */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewImageIndex((prev) =>
                                prev === 0 ? allImages.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveViewImageIndex((prev) =>
                                prev === allImages.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg"
                            title="Next Photo"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Selector Strip if > 1 photo */}
                    {allImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveViewImageIndex(idx)}
                            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                              activeViewImageIndex === idx
                                ? "border-primary ring-2 ring-primary/40 scale-105"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Full Announcement Description Content */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                    Announcement Notice Details:
                  </span>
                  <div className="p-4 rounded-xl bg-muted/20 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {viewEntry.description}
                  </div>
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
