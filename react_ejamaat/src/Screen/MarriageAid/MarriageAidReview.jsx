import React, { useState, useEffect } from "react";
import { useGlobalContext } from "../AuthContext";
import {
  Coins,
  Check,
  X,
  RefreshCw,
  User,
  Home,
  Phone,
  FileText,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Building,
  CreditCard,
  Calendar,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function MarriageAidReview() {
  const globalContext = useGlobalContext();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | Pending | Approved | Rejected

  // Document preview modal state
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("Document Preview");

  // Approval Modal State
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvedAmountInput, setApprovedAmountInput] = useState("");

  // Rejection Modal State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/marriage-aid/all-requests");
      const data = await res.json();
      if (data && data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch marriage aid requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectRequest = (req) => {
    setSelectedRequest(req);
  };

  const openImageModal = (url, title = "Document Preview") => {
    if (!url) return;
    setPreviewImage(url);
    setPreviewTitle(title);
  };

  const openApproveModal = () => {
    if (!selectedRequest) return;
    setApprovedAmountInput(String(selectedRequest.requestedAmount || 0));
    setApproveDialogOpen(true);
  };

  const openRejectModal = () => {
    if (!selectedRequest) return;
    setRejectionReasonInput("");
    setRejectDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    const amount = Number(approvedAmountInput);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid approved amount.");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:5002/api/marriage-aid/process/${selectedRequest._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Approved",
            approvedAmount: amount,
          }),
        }
      );

      const data = await res.json();
      if (data && data.success) {
        alert(`Marriage financial aid request approved for ₹${amount.toLocaleString("en-IN")}!`);
        setApproveDialogOpen(false);
        fetchRequests();
      } else {
        alert(data.message || "Failed to approve request.");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Network error processing approval.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;
    if (!rejectionReasonInput.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost:5002/api/marriage-aid/process/${selectedRequest._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Rejected",
            rejectionReason: rejectionReasonInput.trim(),
          }),
        }
      );

      const data = await res.json();
      if (data && data.success) {
        alert("Marriage financial aid request rejected.");
        setRejectDialogOpen(false);
        fetchRequests();
      } else {
        alert(data.message || "Failed to reject request.");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Network error processing rejection.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  // Auto-sync selectedRequest with current tab filter
  useEffect(() => {
    if (selectedRequest) {
      const stillExists = filteredRequests.some((r) => r._id === selectedRequest._id);
      if (!stillExists) {
        setSelectedRequest(filteredRequests.length > 0 ? filteredRequests[0] : null);
      }
    } else if (filteredRequests.length > 0) {
      setSelectedRequest(filteredRequests[0]);
    }
  }, [filterStatus, requests]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">🟢 Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold">🔴 Rejected</Badge>;
      case "Pending":
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold">⏳ Pending Review</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-600" />
            Marriage Financial Assistance Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and disburse financial support applications for marriages submitted by family members.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted p-1 rounded-lg border text-xs">
            {["ALL", "Pending", "Approved", "Rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${filterStatus === st ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground font-medium">Loading marriage financial aid applications...</span>
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold">No Marriage Aid Requests Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are currently no marriage financial assistance submissions from mobile app users.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left List Panel */}
          <div className="space-y-3 lg:col-span-1 border-r pr-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Submissions ({filteredRequests.length})
            </h3>
            {filteredRequests.map((req) => {
              const isSelected = selectedRequest?._id === req._id;
              const mohallaName = typeof req.mohalla_id === "object" ? req.mohalla_id?.mohallaName : "Mohalla";
              return (
                <div
                  key={req._id}
                  onClick={() => selectRequest(req)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                      ? "bg-amber-500/10 border-amber-500 shadow-sm"
                      : "bg-card hover:bg-accent border-border"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {req.memberName} & {req.spouseName}
                    </h4>
                    {renderStatusBadge(req.status)}
                  </div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    Requested: ₹{req.requestedAmount?.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Door #{req.doorNumber} • {mohallaName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Main Detail Panel */}
          {selectedRequest ? (
            <div className="lg:col-span-3 space-y-6">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Coins className="h-5 w-5 text-amber-600" />
                        Application for {selectedRequest.memberName}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        Household Owner: <span className="font-semibold text-foreground">{selectedRequest.houseOwnerName}</span> (Door #{selectedRequest.doorNumber}) •{" "}
                        Submitted {new Date(selectedRequest.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div>{renderStatusBadge(selectedRequest.status)}</div>
                  </div>
                </CardHeader>
              </Card>

              {/* 1. Marriage Event & Financial Request Summary */}
              <Card className="border">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    1. Marriage Details & Assistance Amount
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Member Getting Married</span>
                    <span className="font-bold text-foreground text-sm">{selectedRequest.memberName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bride / Groom (Spouse) Name</span>
                    <span className="font-bold text-foreground text-sm">{selectedRequest.spouseName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Marriage Date</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedRequest.marriageDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Marriage Venue / Location</span>
                    <span className="font-semibold text-foreground text-xs">{selectedRequest.marriageVenue || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Requested Amount</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 text-lg">₹{selectedRequest.requestedAmount?.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Approved Amount</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                      {selectedRequest.status === "Approved" ? `₹${selectedRequest.approvedAmount?.toLocaleString("en-IN")}` : "Pending / N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Applicant Full Name</span>
                    <span className="font-semibold text-foreground text-sm">{selectedRequest.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Applicant Mobile</span>
                    <span className="font-semibold text-foreground text-sm">📞 {selectedRequest.contactMobile}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Need Description */}
              <Card className="border">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Financial Need / Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    "{selectedRequest.reason || "No description provided."}"
                  </p>
                </CardContent>
              </Card>

              {/* 2. Bank Details */}
              <Card className="border">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    2. Bank Account & Disbursement Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Account Holder Name</span>
                    <span className="font-semibold text-foreground text-xs">{selectedRequest.bankDetails?.holderName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bank Account Number</span>
                    <span className="font-bold text-foreground text-sm font-mono">{selectedRequest.bankDetails?.accountNo || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Bank Name & Branch</span>
                    <span className="font-semibold text-foreground text-xs">{selectedRequest.bankDetails?.bankName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">IFSC Code</span>
                    <span className="font-bold text-foreground text-sm font-mono">{selectedRequest.bankDetails?.ifscCode || "N/A"}</span>
                  </div>
                  {selectedRequest.bankDetails?.upiId ? (
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">UPI ID</span>
                      <span className="font-bold text-primary text-xs font-mono">{selectedRequest.bankDetails.upiId}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* 3. Verification Documents */}
              <Card className="border">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    3. Supporting Documents (Invitation Card & Income Proof)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Invitation Card */}
                  <div className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block">💌 Marriage Invitation Card</span>
                      <span className="text-[11px] text-muted-foreground">Attached Document</span>
                    </div>
                    {selectedRequest.invitationCardDoc ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-amber-600 text-white hover:bg-amber-700 border-none"
                        onClick={() => openImageModal(selectedRequest.invitationCardDoc, "Marriage Invitation Card")}
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Document
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No File Uploaded</span>
                    )}
                  </div>

                  {/* Income Proof */}
                  <div className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block">📄 Income / BPL Proof</span>
                      <span className="text-[11px] text-muted-foreground">Attached Document</span>
                    </div>
                    {selectedRequest.incomeProofDoc ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90 border-none"
                        onClick={() => openImageModal(selectedRequest.incomeProofDoc, "Income Proof Document")}
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Document
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No File Uploaded</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rejection Note if Rejected */}
              {selectedRequest.status === "Rejected" && selectedRequest.rejectionReason && (
                <div className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-500/10 space-y-1">
                  <h5 className="font-bold text-sm text-red-600 dark:text-red-400">❌ Rejection Reason</h5>
                  <p className="text-xs font-medium text-foreground">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Actions Footer Bar */}
              {selectedRequest.status === "Pending" && (
                <div className="pt-4 border-t flex items-center justify-end gap-4 bg-card p-4 rounded-xl shadow-md">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="font-bold px-6 bg-red-600 hover:bg-red-700 text-white"
                    onClick={openRejectModal}
                    disabled={processing}
                  >
                    <X className="mr-2 h-5 w-5" /> Reject Application
                  </Button>
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                    onClick={openApproveModal}
                    disabled={processing}
                  >
                    <Check className="mr-2 h-5 w-5" /> Approve Financial Aid
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-3 flex items-center justify-center p-12 border border-dashed rounded-xl bg-card text-center">
              <div className="space-y-2">
                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-semibold text-foreground">No {filterStatus} Applications</h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no marriage financial aid submissions under the "{filterStatus}" filter status.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document & Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-black/5 rounded-lg border min-h-[400px]">
            {previewImage && (
              previewImage.startsWith("data:application/pdf") || previewImage.endsWith(".pdf") ? (
                <iframe
                  src={previewImage}
                  title={previewTitle}
                  className="w-full h-[75vh] rounded-lg border shadow-lg"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Document Full Preview"
                  className="max-h-[75vh] w-auto object-contain rounded-lg border shadow-xl"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog Modal */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" /> Approve Marriage Financial Aid
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Confirm approval for <span className="font-bold text-foreground">{selectedRequest?.memberName}</span>. Enter the final approved amount below:
            </p>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Approved Amount (₹)</label>
              <Input
                type="number"
                value={approvedAmountInput}
                onChange={(e) => setApprovedAmountInput(e.target.value)}
                className="text-base font-bold"
                placeholder="e.g. 25000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleApproveSubmit} disabled={processing}>
              {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog Modal */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Reject Financial Aid Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Please enter the reason for rejecting <span className="font-bold text-foreground">{selectedRequest?.memberName}</span>'s application. This reason will be shown to the user in their mobile app:
            </p>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Rejection Reason *</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Supporting documents insufficient / Income threshold exceeded"
                rows={4}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="font-bold" onClick={handleRejectSubmit} disabled={processing}>
              {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />} Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
