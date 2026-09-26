import React, { useState, useEffect, useMemo } from "react";
import { useGlobalContext } from "../AuthContext";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  User,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  X,
  CreditCard,
  Building,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GeneralStatement() {
  const { isOnline } = useGlobalContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawMonthlyDues, setRawMonthlyDues] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, INCOME, EXPENSE, DUES
  const [filterMode, setFilterMode] = useState("ALL"); // ALL, Cash, Online, Bank Transfer, UPI, Cheque
  const [dateRange, setDateRange] = useState("ALL"); // ALL, TODAY, THIS_MONTH, THIS_YEAR, CUSTOM
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal State
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = null;
      if (window.ipcRenderer) {
        try {
          token = await window.ipcRenderer.invoke("get-token");
        } catch (e) {
          console.error("Error fetching IPC token:", e);
        }
      }
      if (!token) {
        token = localStorage.getItem("Token");
      }

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["auth-token"] = token;
        headers["authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:5002/api/ledger/general-statement", {
        headers,
      });
      const data = await res.json();
      if (data && data.success) {
        setRawMonthlyDues(data.monthlyDues || []);
        setRawTransactions(data.transactions || []);
      } else {
        setError(data.message || "Failed to load general statement");
      }
    } catch (err) {
      console.error("Error fetching general statement:", err);
      setError("Unable to connect to server. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  // Process & Merge Data into Unified Ledger Timeline
  const processedLedger = useMemo(() => {
    const items = [];

    // Process Transactions
    rawTransactions.forEach((tx) => {
      const isIncome = tx.type === "INCOME" || tx.type === "CREDIT";
      const amt = Number(tx.amountReceived || tx.amount || tx.credit || tx.debit || 0);

      const creditAmt = isIncome ? amt : 0;
      const debitAmt = !isIncome ? amt : 0;

      const dateObj = tx.paymentDate ? new Date(tx.paymentDate) : new Date(tx.createdAt || Date.now());

      items.push({
        id: `tx_${tx._id}`,
        rawId: tx._id,
        date: dateObj,
        dateStr: dateObj.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        timeStr: dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        refNo: tx.receiptNo || `TX-${tx._id.slice(-6)}`,
        partyName: tx.user_id?.houseOwnerName || tx.staff_id?.name || "Jamaat Member / General",
        doorNo: tx.user_id?.doorNumber || "N/A",
        formNo: tx.user_id?.form_no || "N/A",
        phone: tx.user_id?.mobileNumber || tx.staff_id?.phone || "N/A",
        type: isIncome ? "INCOME" : "EXPENSE",
        typeLabel: isIncome ? "Receipt / Credit" : "Expense / Debit",
        category: tx.category_id?.name || tx.categoryName || (isIncome ? "Subscription Dues" : "Expense"),
        particulars: tx.particulars || tx.notes || (isIncome ? "Collection Receipt" : "Jamaat Expense"),
        mode: tx.paymentMode || "Cash",
        credit: creditAmt,
        debit: debitAmt,
        collectedBy: tx.collectedBy?.name || tx.collectedBy?.fullName || "Admin",
        raw: tx,
      });
    });

    // Process Monthly Dues Billed
    rawMonthlyDues.forEach((due) => {
      const dueAmt = Number(due.amountDue || due.monthlyRate || 0);
      if (dueAmt > 0) {
        const [year, month] = (due.month || "").split("-");
        const dateObj = year && month ? new Date(Number(year), Number(month) - 1, 1) : new Date();

        items.push({
          id: `due_${due._id}`,
          rawId: due._id,
          date: dateObj,
          dateStr: dateObj.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
          }),
          timeStr: "Monthly Assessment",
          refNo: `DUE-${due.month}`,
          partyName: due.user_id?.houseOwnerName || "Household Owner",
          doorNo: due.user_id?.doorNumber || "N/A",
          formNo: due.user_id?.form_no || "N/A",
          phone: due.user_id?.mobileNumber || "N/A",
          type: "DUES",
          typeLabel: "Monthly Due Billed",
          category: "Monthly Assessment",
          particulars: `Monthly Jamaat Subscription for ${due.month}`,
          mode: "System Billed",
          credit: 0,
          debit: dueAmt,
          collectedBy: "Automated Ledger",
          raw: due,
        });
      }
    });

    // Sort chronologically ascending to calculate accurate running balance
    items.sort((a, b) => a.date - b.date);

    let runningBal = 0;
    const itemsWithBalance = items.map((item) => {
      runningBal = runningBal + item.credit - item.debit;
      return {
        ...item,
        runningBalance: runningBal,
      };
    });

    // Return in reverse chronological order (newest first) for display
    return itemsWithBalance.reverse();
  }, [rawTransactions, rawMonthlyDues]);

  // Filtered List
  const filteredLedger = useMemo(() => {
    return processedLedger.filter((item) => {
      // Type Filter
      if (filterType !== "ALL" && item.type !== filterType) {
        return false;
      }

      // Mode Filter
      if (filterMode !== "ALL" && item.mode !== filterMode) {
        return false;
      }

      // Date Range Filter
      if (dateRange === "TODAY") {
        const todayStr = new Date().toDateString();
        if (item.date.toDateString() !== todayStr) return false;
      } else if (dateRange === "THIS_MONTH") {
        const now = new Date();
        if (
          item.date.getMonth() !== now.getMonth() ||
          item.date.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      } else if (dateRange === "THIS_YEAR") {
        const now = new Date();
        if (item.date.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === "CUSTOM") {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (item.date < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (item.date > end) return false;
        }
      }

      // Search Filter
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchesParty = item.partyName.toLowerCase().includes(term);
        const matchesDoor = item.doorNo.toLowerCase().includes(term);
        const matchesForm = item.formNo.toLowerCase().includes(term);
        const matchesRef = item.refNo.toLowerCase().includes(term);
        const matchesCategory = item.category.toLowerCase().includes(term);
        const matchesParticulars = item.particulars.toLowerCase().includes(term);
        const matchesMode = item.mode.toLowerCase().includes(term);

        if (
          !matchesParty &&
          !matchesDoor &&
          !matchesForm &&
          !matchesRef &&
          !matchesCategory &&
          !matchesParticulars &&
          !matchesMode
        ) {
          return false;
        }
      }

      return true;
    });
  }, [processedLedger, filterType, filterMode, dateRange, startDate, endDate, searchTerm]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;

    filteredLedger.forEach((item) => {
      totalCredit += item.credit;
      totalDebit += item.debit;
    });

    const closingBal = totalCredit - totalDebit;

    return {
      totalCredit,
      totalDebit,
      closingBal,
      count: filteredLedger.length,
    };
  }, [filteredLedger]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredLedger.length === 0) return;

    const headers = [
      "Date",
      "Time",
      "Reference No",
      "Party / Member",
      "Door No",
      "Form No",
      "Type",
      "Category",
      "Particulars",
      "Payment Mode",
      "Credit (₹)",
      "Debit (₹)",
      "Running Balance (₹)",
      "Collected By",
    ];

    const rows = filteredLedger.map((item) => [
      `"${item.dateStr}"`,
      `"${item.timeStr}"`,
      `"${item.refNo}"`,
      `"${item.partyName}"`,
      `"${item.doorNo}"`,
      `"${item.formNo}"`,
      `"${item.typeLabel}"`,
      `"${item.category}"`,
      `"${item.particulars.replace(/"/g, '""')}"`,
      `"${item.mode}"`,
      item.credit,
      item.debit,
      item.runningBalance,
      `"${item.collectedBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Jamaat_General_Statement_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Printable CSS Styling */}
      <style>{`
        @media print {
          nav, button, input, select, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-header {
            display: block !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            General Ledger Statement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete Jamaat financial transactions, subscription receipts, billed dues, and balances.
          </p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <Button variant="outline" size="sm" onClick={fetchStatement} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredLedger.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="default" size="sm" onClick={handlePrint} disabled={filteredLedger.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Statement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Total Credit (Income)
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{summaryMetrics.totalCredit.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total collections & receipts</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Total Debit (Expenses / Billed)
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ₹{summaryMetrics.totalDebit.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expenses & monthly assessments</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Net Statement Balance
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryMetrics.closingBal >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
              ₹{summaryMetrics.closingBal.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net accumulated balance</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              Total Statement Entries
              <FileText className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summaryMetrics.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Matching records</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="border-border/60 shadow-sm no-print">
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Party, Door #, Form #, Ref #, Particulars..."
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

            {/* Type Filter */}
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="INCOME">Income / Credit</SelectItem>
                  <SelectItem value="EXPENSE">Expense / Debit</SelectItem>
                  <SelectItem value="DUES">Billed Dues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode Filter */}
            <div>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Modes</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Online">Online / UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="System Billed">System Billed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selector */}
            <div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="THIS_MONTH">This Month</SelectItem>
                  <SelectItem value="THIS_YEAR">This Year</SelectItem>
                  <SelectItem value="CUSTOM">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === "CUSTOM" && (
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">From:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">To:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto text-xs"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs text-muted-foreground h-8"
                >
                  Clear Custom Range
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Statement Table Card */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 py-3 px-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">General Statement Register</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredLedger.length} of {processedLedger.length} total entries
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm">Loading statement ledger records...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
              <p className="text-sm font-medium text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchStatement}>
                Try Again
              </Button>
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <FileText className="h-10 w-10 mx-auto opacity-40" />
              <p className="text-sm font-medium">No statement records match your criteria.</p>
              <p className="text-xs">Try clearing your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[130px]">Ref / Receipt #</TableHead>
                    <TableHead className="min-w-[180px]">Party / Member</TableHead>
                    <TableHead className="w-[100px]">Door / Form</TableHead>
                    <TableHead className="min-w-[150px]">Category & Particulars</TableHead>
                    <TableHead className="w-[100px]">Mode</TableHead>
                    <TableHead className="text-right w-[110px]">Credit (₹)</TableHead>
                    <TableHead className="text-right w-[110px]">Debit (₹)</TableHead>
                    <TableHead className="text-right w-[120px]">Balance (₹)</TableHead>
                    <TableHead className="w-[60px] no-print"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredLedger.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setSelectedEntry(item)}
                    >
                      <TableCell className="font-mono text-xs">
                        <div>{item.dateStr}</div>
                        <div className="text-[10px] text-muted-foreground">{item.timeStr}</div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium">
                        <Badge variant="outline" className="font-mono text-[11px] bg-background">
                          {item.refNo}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-xs text-foreground">{item.partyName}</div>
                        {item.phone !== "N/A" && (
                          <div className="text-[11px] text-muted-foreground">{item.phone}</div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="text-xs">Door #{item.doorNo}</div>
                        <div className="text-[10px] text-muted-foreground">Form #{item.formNo}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium">{item.category}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {item.particulars}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-semibold tracking-wider"
                        >
                          {item.mode}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {item.credit > 0 ? `+ ₹${item.credit.toLocaleString("en-IN")}` : "-"}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        {item.debit > 0 ? `- ₹${item.debit.toLocaleString("en-IN")}` : "-"}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                        ₹{item.runningBalance.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell className="no-print text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        {selectedEntry && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transaction Statement Detail
              </DialogTitle>
              <DialogDescription>
                Reference #{selectedEntry.refNo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold">
                    {selectedEntry.typeLabel}
                  </div>
                  <div className="text-lg font-bold mt-0.5">
                    {selectedEntry.credit > 0
                      ? `+ ₹${selectedEntry.credit.toLocaleString("en-IN")}`
                      : `- ₹${selectedEntry.debit.toLocaleString("en-IN")}`}
                  </div>
                </div>
                <Badge
                  variant={selectedEntry.credit > 0 ? "default" : "destructive"}
                  className="text-xs px-2.5 py-1"
                >
                  {selectedEntry.type}
                </Badge>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Date & Time:</span>
                  <span className="font-medium text-xs">{selectedEntry.dateStr} • {selectedEntry.timeStr}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Party / Member:</span>
                  <span className="font-medium text-xs text-right">{selectedEntry.partyName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Household Door / Form:</span>
                  <span className="font-medium text-xs">Door #{selectedEntry.doorNo} (Form #{selectedEntry.formNo})</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Category:</span>
                  <span className="font-medium text-xs">{selectedEntry.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Payment Mode:</span>
                  <span className="font-medium text-xs">{selectedEntry.mode}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Recorded / Collected By:</span>
                  <span className="font-medium text-xs">{selectedEntry.collectedBy}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1">
                <span className="text-muted-foreground text-xs block">Particulars & Notes:</span>
                <p className="text-xs p-2.5 bg-muted/30 rounded border text-foreground">
                  {selectedEntry.particulars || "No additional notes specified."}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
