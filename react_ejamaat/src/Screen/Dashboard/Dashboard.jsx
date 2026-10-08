import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useGlobalContext } from "../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Home,
  Search,
  User,
  UserCheck,
  Filter,
  X,
  Zap,
  Droplet,
  Heart,
  CreditCard,
  Wifi,
  BookOpen,
  GraduationCap,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as PieChartRecharts,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Constants
const COLORS = [
  "#10b981",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
];

const AGE_RANGES = [
  { range: "0-5", min: 0, max: 5 },
  { range: "6-12", min: 6, max: 12 },
  { range: "13-18", min: 13, max: 18 },
  { range: "19-25", min: 19, max: 25 },
  { range: "26-35", min: 26, max: 35 },
  { range: "36-45", min: 36, max: 45 },
  { range: "46-55", min: 46, max: 55 },
  { range: "56-65", min: 56, max: 65 },
  { range: "66-75", min: 66, max: 75 },
  { range: "76+", min: 76, max: 120 },
];

const MARITAL_STATUS_OPTIONS = ["Married", "Unmarried", "Widow", "Widower"];
const HOUSE_TYPES = ["Rented", "Owned", "Leased", "Free Stay", "Family Property"];
const RATION_CARD_TYPES = ["APL", "BPL", "Rejected", "Applied", "Not-available"];
const WASHROOM_TYPES = ["Yes", "No", "Private", "Shared", "Public"];
const WATER_SUPPLY_TYPES = ["Own well", "Pipe line", "Public well", "Borewell", "Public line"];

// ============ Helper Functions ============

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const aggregateFacilityData = (mohallaList, facilityKey, propertyKey) => {
  const aggregated = {};

  mohallaList.forEach((mohalla) => {
    const facilityData = mohalla[facilityKey] || [];
    facilityData.forEach((facility) => {
      const key = facility[propertyKey];
      aggregated[key] = (aggregated[key] || 0) + (facility.count || 0);
    });
  });

  return Object.entries(aggregated).map(([key, count]) => ({
    [propertyKey]: key,
    count: count,
  }));
};

// ============ Skeleton Components ============

const StatCardSkeleton = () => (
  <Card className="border-border/40">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card className="border-border/40">
    <CardHeader className="py-3">
      <Skeleton className="h-5 w-64" />
    </CardHeader>
    <CardContent className="p-4">
      <Skeleton className="h-72 w-full rounded" />
    </CardContent>
  </Card>
);

const TableSkeleton = () => (
  <Card className="border-border/40">
    <CardHeader className="py-3">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </CardContent>
  </Card>
);

const FacilityCardSkeleton = () => (
  <Card className="border-border/40">
    <CardHeader className="py-3">
      <Skeleton className="h-5 w-20" />
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </CardContent>
  </Card>
);

// ============ Reusable Components ============

const InfoCard = ({ title, icon: IconComponent, children, isLoading }) => (
  <Card className="border-border/40 hover:shadow-md transition-shadow">
    <CardHeader className="py-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b pb-2 mb-2 last:border-b-0 last:mb-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    const titleLabel = payload[0].payload.ageRange
      ? `Age Bracket: ${payload[0].payload.ageRange} Yrs`
      : payload[0].payload.status || payload[0].payload.name;

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border/70 rounded-xl p-3.5 shadow-2xl space-y-2.5 text-xs min-w-[180px] z-50">
        <div className="flex items-center justify-between border-b pb-2 gap-2">
          <span className="font-bold text-sm text-foreground">{titleLabel}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {total} Total
          </span>
        </div>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className="font-medium text-muted-foreground">{entry.name}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>{entry.value}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ChartTypeSelectorGender = ({ chartType, onChange }) => (
  <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
    <Button
      size="sm"
      variant={chartType === "bar" ? "default" : "ghost"}
      onClick={() => onChange("bar")}
      className="h-7 px-2.5 text-xs gap-1"
    >
      <BarChart3 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Columns</span>
    </Button>
    <Button
      size="sm"
      variant={chartType === "area" ? "default" : "ghost"}
      onClick={() => onChange("area")}
      className="h-7 px-2.5 text-xs gap-1"
    >
      <Activity className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Area</span>
    </Button>
    <Button
      size="sm"
      variant={chartType === "line" ? "default" : "ghost"}
      onClick={() => onChange("line")}
      className="h-7 px-2.5 text-xs gap-1"
    >
      <TrendingUp className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Line</span>
    </Button>
  </div>
);

const ChartTypeSelectorFull = ({ chartType, onChange }) => (
  <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
    <Button
      size="sm"
      variant={chartType === "line" ? "default" : "ghost"}
      onClick={() => onChange("line")}
      className="h-7 w-7 p-0"
    >
      <TrendingUp className="h-3.5 w-3.5" />
    </Button>
    <Button
      size="sm"
      variant={chartType === "bar" ? "default" : "ghost"}
      onClick={() => onChange("bar")}
      className="h-7 w-7 p-0"
    >
      <BarChart3 className="h-3.5 w-3.5" />
    </Button>
    <Button
      size="sm"
      variant={chartType === "pie" ? "default" : "ghost"}
      onClick={() => onChange("pie")}
      className="h-7 w-7 p-0"
    >
      <PieChart className="h-3.5 w-3.5" />
    </Button>
  </div>
);

// ============ Chart Rendering ============

const renderGenderChart = (data, chartType, height = 350) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No demographic data available
      </div>
    );
  }

  const dataKey = data[0]?.ageRange ? "ageRange" : "status";

  return (
    <ResponsiveContainer width="100%" height={height}>
      {chartType === "line" ? (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
          <XAxis dataKey={dataKey} tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "10px" }} />
          <Line
            type="monotone"
            dataKey="Male"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Female"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ r: 5, fill: "#ec4899", strokeWidth: 2, stroke: "#ffffff" }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
        </LineChart>
      ) : chartType === "area" ? (
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="maleAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="femaleAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
          <XAxis dataKey={dataKey} tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "10px" }} />
          <Area
            type="monotone"
            dataKey="Male"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#maleAreaGrad)"
          />
          <Area
            type="monotone"
            dataKey="Female"
            stroke="#ec4899"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#femaleAreaGrad)"
          />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="maleBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="femaleBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={1} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
          <XAxis dataKey={dataKey} tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "10px" }} />
          <Bar dataKey="Male" fill="url(#maleBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={50} />
          <Bar dataKey="Female" fill="url(#femaleBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={50} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

const renderEducationChart = (data, chartType, height = 350, gradientId = "genEduGrad", primaryColor = "#06b6d4") => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
        No education statistics recorded
      </div>
    );
  }

  const CHART_COLORS = [
    "#06b6d4",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
  ];

  switch (chartType) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.8 }}
            />
            <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name="Count"
              stroke={primaryColor}
              strokeWidth={3}
              dot={{ r: 5, fill: primaryColor, strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChartRecharts margin={{ top: 10, bottom: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: "currentColor", opacity: 0.3 }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChartRecharts>
        </ResponsiveContainer>
      );
    case "bar":
    default:
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 65 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.8 }}
            />
            <YAxis tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              name="Count"
              fill={`url(#${gradientId})`}
              radius={[8, 8, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      );
  }
};

// ============ Main Component ============

export default function Dashboard() {
  const { allmohalla, allfamily, population } = useGlobalContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMohalla, setSelectedMohalla] = useState(null);
  const [allStats, setAllStats] = useState(null);
  const [facilityStats, setFacilityStats] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [chartTypes, setChartTypes] = useState({
    ageDistribution: "bar",
    marriage: "bar",
    generalEducation: "bar",
    religiousEducation: "bar",
  });

  const facilityCardsRef = useRef(null);
  const isLoading = !allStats || !facilityStats;

  // Filter mohallas by search
  const filteredMohallas = useMemo(() => {
    return (
      allmohalla?.mohallaData?.filter((mohalla) =>
        mohalla.mohallaName?.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    );
  }, [allmohalla, searchTerm]);

  // Auto-scroll to Facility Cards
  useEffect(() => {
    if (selectedMohalla && facilityCardsRef.current) {
      setTimeout(() => {
        facilityCardsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [selectedMohalla]);

  // Build age distribution data
  const buildAgeDistribution = useCallback((data) => {
    return AGE_RANGES.map((ageRange) => ({
      ageRange: ageRange.range,
      Male:
        data?.filter((p) => {
          const age = calculateAge(p?.member?.dateOfBirth);
          return (
            p?.member?.gender === "Male" &&
            age >= ageRange.min &&
            age <= ageRange.max &&
            age !== null
          );
        }).length || 0,
      Female:
        data?.filter((p) => {
          const age = calculateAge(p?.member?.dateOfBirth);
          return (
            p?.member?.gender === "Female" &&
            age >= ageRange.min &&
            age <= ageRange.max &&
            age !== null
          );
        }).length || 0,
    }));
  }, []);

  // Build education data
  const buildEducationData = useCallback((data, field) => {
    const stats = {};
    data?.forEach((p) => {
      const value = p?.member?.[field] || "Unknown";
      stats[value] = (stats[value] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([key, value]) => ({ name: key, value }))
      .filter((item) => item.value > 0);
  }, []);

  // Build marital status data
  const buildMaritalStatusData = useCallback((data) => {
    return MARITAL_STATUS_OPTIONS.map((status) => ({
      status,
      Male:
        data?.filter(
          (p) =>
            p?.member?.gender === "Male" &&
            p?.member?.maritalStatus === status
        ).length || 0,
      Female:
        data?.filter(
          (p) =>
            p?.member?.gender === "Female" &&
            p?.member?.maritalStatus === status
        ).length || 0,
    }));
  }, []);

  // Calculate all statistics
  useEffect(() => {
    try {
      if (!population || !allfamily || !allmohalla) return;

      const maleCount = population?.filter(
        (p) => p?.member?.gender === "Male"
      ).length || 0;
      const femaleCount = population?.filter(
        (p) => p?.member?.gender === "Female"
      ).length || 0;

      const allStats = {
        totalHouses: allfamily?.length || 0,
        totalPopulation: population?.length || 0,
        totalFamilies: allfamily?.length || 0,
        genderAgeBreakdown: buildAgeDistribution(population),
        males: maleCount,
        females: femaleCount,
        generalEducationData: buildEducationData(
          population,
          "academicEducationLevel"
        ),
        religiousEducationData: buildEducationData(
          population,
          "religiousEducationLevel"
        ),
        marriageByGender: buildMaritalStatusData(population),
        HousesCount: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "HousesCount",
          "houseOwnership"
        ),
        electricityCount: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "electricityCount",
          "electricity"
        ),
        rationCardCounts: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "rationCardCounts",
          "rationCard"
        ),
        washroomCount: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "washroomCount",
          "washroom"
        ),
        waterSupplyCounts: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "waterSupplyCounts",
          "waterSupply"
        ),
        maritalStatusCounts: aggregateFacilityData(
          allmohalla?.mohallaData || [],
          "maritalStatusCounts",
          "maritalStatus"
        ),
      };

      setAllStats(allStats);
      setFacilityStats({
        HousesCount: allStats.HousesCount,
        electricityCount: allStats.electricityCount,
        rationCardCounts: allStats.rationCardCounts,
        washroomCount: allStats.washroomCount,
        waterSupplyCounts: allStats.waterSupplyCounts,
        maritalStatusCounts: allStats.maritalStatusCounts,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  }, [allfamily, population, allmohalla, buildAgeDistribution, buildEducationData, buildMaritalStatusData]);

  // Update facility stats when mohalla selected
  useEffect(() => {
    try {
      if (selectedMohalla?._id) {
        setFacilityStats({
          HousesCount: selectedMohalla.HousesCount || [],
          electricityCount: selectedMohalla.electricityCount || [],
          rationCardCounts: selectedMohalla.rationCardCounts || [],
          washroomCount: selectedMohalla.washroomCount || [],
          waterSupplyCounts: selectedMohalla.waterSupplyCounts || [],
          maritalStatusCounts: selectedMohalla.maritalStatusCounts || [],
        });
      } else if (allStats) {
        setFacilityStats({
          HousesCount: allStats.HousesCount,
          electricityCount: allStats.electricityCount,
          rationCardCounts: allStats.rationCardCounts,
          washroomCount: allStats.washroomCount,
          waterSupplyCounts: allStats.waterSupplyCounts,
          maritalStatusCounts: allStats.maritalStatusCounts,
        });
      }
    } catch (error) {
      console.error("Error updating facility stats:", error);
    }
  }, [selectedMohalla, allStats]);

  return (
    <div className="min-h-screen bg-background overflow-y-auto max-h-[calc(100vh-64px)] pb-12">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-card to-card/50 px-4 py-8">
        <div className="max-w-9xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">Dashboard 222</h1>
              {isLoading ? (
                <Skeleton className="h-4 w-96 mt-2" />
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedMohalla
                    ? `Filtering Facility Cards: ${selectedMohalla.mohallaName}`
                    : "Overview of all communities, families, and population statistics"}
                </p>
              )}
            </div>
            <div className="text-right hidden lg:block bg-primary/10 p-4 rounded-lg">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">
                    {(allStats?.totalPopulation ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Population (All)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-9xl mx-auto space-y-6">
        {/* Filter Section */}
        <div className="space-y-4">
          <div className="flex gap-3 justify-end">
            <div className="relative">
              <Button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="gap-2 whitespace-nowrap"
                variant={showFilterMenu ? "default" : "outline"}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>

              {showFilterMenu && (
                <div className="absolute right-0 top-12 w-96 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[600px] overflow-hidden flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                    <h3 className="font-semibold text-sm">
                      Select Mohalla (Facility Cards Only)
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowFilterMenu(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-3 border-b sticky top-16 bg-card z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search mohalla..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-9 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="p-3 border-b">
                    <Button
                      onClick={() => {
                        setSelectedMohalla(null);
                        setShowFilterMenu(false);
                        setSearchTerm("");
                      }}
                      variant={selectedMohalla ? "outline" : "default"}
                      className="w-full"
                      size="sm"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      All Mohalla
                    </Button>
                  </div>

                  <div className="overflow-y-auto flex-1 p-3">
                    {filteredMohallas.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredMohallas.map((mohalla) => (
                          <Button
                            key={mohalla._id}
                            variant={
                              selectedMohalla?._id === mohalla._id
                                ? "default"
                                : "outline"
                            }
                            onClick={() => {
                              setSelectedMohalla(mohalla);
                              setShowFilterMenu(false);
                              setSearchTerm("");
                            }}
                            className="h-auto py-2 px-3 text-xs justify-center"
                          >
                            {mohalla.mohallaName}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No mohallas found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card className="border-border/40 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Total Mohallas
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {allmohalla?.mohallaData?.length || 0}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Building2 className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Total Houses
                        </p>
                        <p className="text-2xl font-bold">
                          {(allStats?.totalHouses ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                        <Home className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Total Population
                        </p>
                        <p className="text-2xl font-bold">
                          {(allStats?.totalPopulation ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                        <User className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/40 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Families
                        </p>
                        <p className="text-2xl font-bold">
                          {(allStats?.totalFamilies ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-400/20 dark:text-pink-400">
                        <Heart className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {selectedMohalla && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Facility Cards only:{" "}
                  <span className="text-primary font-semibold">
                    {selectedMohalla.mohallaName}
                  </span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setSelectedMohalla(null);
                  setSearchTerm("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <TableSkeleton />
              <TableSkeleton />
            </>
          ) : (
            <>
              <Card className="border-border/40 hover:shadow-md transition-shadow">
                <CardHeader className="py-3.5 border-b bg-muted/20">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Overall Statistics (All Mohalla)
                    </span>
                    <Badge variant="outline" className="text-xs bg-background">
                      {allmohalla?.mohallaData?.length || 0} Mohallas Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Summary Grid Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-center">
                      <p className="text-[11px] font-medium text-muted-foreground">Houses</p>
                      <p className="text-lg font-bold text-primary mt-0.5">
                        {(allStats?.totalHouses ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                      <p className="text-[11px] font-medium text-muted-foreground">Population</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {(allStats?.totalPopulation ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10 text-center">
                      <p className="text-[11px] font-medium text-muted-foreground">Avg Size</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        {(
                          (allStats?.totalPopulation || 0) /
                          (allStats?.totalFamilies || 1)
                        ).toFixed(1)} / Fam
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                      <p className="text-[11px] font-medium text-muted-foreground">Voters</p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {Array.isArray(population) ? population.filter((p) => p?.member?.voterId === "Yes").length : 0}
                      </p>
                    </div>
                  </div>

                  {/* Gender Distribution with Progress Bars */}
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Gender Breakdown
                    </p>

                    {/* Male Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <User className="h-3.5 w-3.5" /> Male Population
                        </span>
                        <span className="font-bold">
                          {allStats?.males || 0}{" "}
                          <span className="font-normal text-muted-foreground text-[11px]">
                            ({allStats?.totalPopulation ? Math.round(((allStats?.males || 0) / allStats.totalPopulation) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${allStats?.totalPopulation ? Math.round(((allStats?.males || 0) / allStats.totalPopulation) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Female Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-pink-600 dark:text-pink-400">
                          <UserCheck className="h-3.5 w-3.5" /> Female Population
                        </span>
                        <span className="font-bold">
                          {allStats?.females || 0}{" "}
                          <span className="font-normal text-muted-foreground text-[11px]">
                            ({allStats?.totalPopulation ? Math.round(((allStats?.females || 0) / allStats.totalPopulation) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${allStats?.totalPopulation ? Math.round(((allStats?.females || 0) / allStats.totalPopulation) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure & Household Indicators */}
                  <div className="pt-2 space-y-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Socio-Economic Summary
                    </p>
                    <DataRow
                      label="Electricity Connection Access"
                      value={`${allStats?.electricityCount?.find((item) => item.electricity === "Yes")?.count || 0} Families`}
                    />
                    <DataRow
                      label="Water Supply Available"
                      value={`${(allStats?.waterSupplyCounts || []).filter((item) => item.waterSupply !== "No" && item.waterSupply !== "Not Available").reduce((acc, curr) => acc + (curr.count || 0), 0)} Families`}
                    />
                    <DataRow
                      label="Ration Card Holders (APL/BPL)"
                      value={`${(allStats?.rationCardCounts || []).filter((item) => item.rationCard === "APL" || item.rationCard === "BPL" || item.rationCard === "Yes").reduce((acc, curr) => acc + (curr.count || 0), 0)} Families`}
                    />
                    <DataRow
                      label="Specially Abled Members"
                      value={`${(population || []).filter((p) => p?.member?.disablity === "yes").length} Members`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    Gender-wise Age Breakdown (All Mohalla)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-2 font-medium">
                            Age Range
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-green-600">
                            Male
                          </th>
                          <th className="text-right py-2 px-2 font-medium text-pink-600">
                            Female
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStats?.genderAgeBreakdown?.map((row) => (
                          <tr
                            key={row.ageRange}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="py-2 px-2 font-medium">
                              {row.ageRange}
                            </td>
                            <td className="text-right py-2 px-2 font-semibold text-green-600">
                              {row.Male || 0}
                            </td>
                            <td className="text-right py-2 px-2 font-semibold text-pink-600">
                              {row.Female || 0}
                            </td>
                            <td className="text-right py-2 px-2">
                              {(row.Male || 0) + (row.Female || 0)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50 font-semibold text-sm">
                          <td className="py-2 px-2">Total</td>
                          <td className="text-right py-2 px-2 text-green-600">
                            {allStats?.genderAgeBreakdown?.reduce(
                              (sum, row) => sum + (row.Male || 0),
                              0
                            ) || 0}
                          </td>
                          <td className="text-right py-2 px-2 text-pink-600">
                            {allStats?.genderAgeBreakdown?.reduce(
                              (sum, row) => sum + (row.Female || 0),
                              0
                            ) || 0}
                          </td>
                          <td className="text-right py-2 px-2">
                            {allStats?.totalPopulation || 0}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Age Distribution Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card className="border-border/40">
            <CardHeader className="py-3 flex items-center justify-between">
              <CardTitle className="text-sm flex items-center justify-between w-full">
                <span>Age Distribution by Gender (All Mohalla)</span>
                <ChartTypeSelectorGender
                  chartType={chartTypes.ageDistribution}
                  onChange={(type) =>
                    setChartTypes({
                      ...chartTypes,
                      ageDistribution: type,
                    })
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {renderGenderChart(
                allStats?.genderAgeBreakdown || [],
                chartTypes.ageDistribution,
                350
              )}
            </CardContent>
          </Card>
        )}

        {/* Marriage Status Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card className="border-border/40 hover:shadow-md transition-shadow">
            <CardHeader className="py-3.5 border-b bg-muted/20 flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Marriage Status by Gender (All Mohalla)
                </span>
                <ChartTypeSelectorGender
                  chartType={chartTypes.marriage}
                  onChange={(type) =>
                    setChartTypes({
                      ...chartTypes,
                      marriage: type,
                    })
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {renderGenderChart(
                allStats?.marriageByGender || [],
                chartTypes.marriage,
                350
              )}
            </CardContent>
          </Card>
        )}

        {/* Education Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <Card className="border-border/40 hover:shadow-md transition-shadow">
                <CardHeader className="py-3.5 border-b bg-muted/20 flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-cyan-500" />
                      General Education (All Mohalla)
                    </span>
                    <ChartTypeSelectorFull
                      chartType={chartTypes.generalEducation}
                      onChange={(type) =>
                        setChartTypes({
                          ...chartTypes,
                          generalEducation: type,
                        })
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {renderEducationChart(
                    allStats?.generalEducationData || [],
                    chartTypes.generalEducation,
                    350,
                    "genEduGrad",
                    "#06b6d4"
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 hover:shadow-md transition-shadow">
                <CardHeader className="py-3.5 border-b bg-muted/20 flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-amber-500" />
                      Religious Education (All Mohalla)
                    </span>
                    <ChartTypeSelectorFull
                      chartType={chartTypes.religiousEducation}
                      onChange={(type) =>
                        setChartTypes({
                          ...chartTypes,
                          religiousEducation: type,
                        })
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {renderEducationChart(
                    allStats?.religiousEducationData || [],
                    chartTypes.religiousEducation,
                    350,
                    "relEduGrad",
                    "#f59e0b"
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Facility Cards */}
        <div ref={facilityCardsRef}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Facility Cards
            {selectedMohalla && (
              <span className="text-sm text-muted-foreground">
                ({selectedMohalla.mohallaName})
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <FacilityCardSkeleton />
                <FacilityCardSkeleton />
                <FacilityCardSkeleton />
                <FacilityCardSkeleton />
                <FacilityCardSkeleton />
                <FacilityCardSkeleton />
              </>
            ) : (
              <>
                <InfoCard title="Houses" icon={Home} isLoading={isLoading}>
                  <div className="space-y-2">
                    {HOUSE_TYPES.map((type, idx) => {
                      const item = facilityStats?.HousesCount?.find(
                        (h) => h?.houseOwnership === type
                      );
                      return (
                        <DataRow key={idx} label={type} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard title="Electricity" icon={Zap} isLoading={isLoading}>
                  <div className="space-y-2">
                    {["Available", "Not Available"].map((label, idx) => {
                      const item = facilityStats?.electricityCount?.find(
                        (e) => e?.electricity === (label === "Available" ? "Yes" : "No")
                      );
                      return (
                        <DataRow key={idx} label={label} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard title="Marriage Status" icon={Heart} isLoading={isLoading}>
                  <div className="space-y-2">
                    {MARITAL_STATUS_OPTIONS.map((status, idx) => {
                      const item = facilityStats?.maritalStatusCounts?.find(
                        (m) => m?.maritalStatus === status
                      );
                      return (
                        <DataRow key={idx} label={status} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard title="Ration Card" icon={CreditCard} isLoading={isLoading}>
                  <div className="space-y-2">
                    {RATION_CARD_TYPES.map((type, idx) => {
                      const item = facilityStats?.rationCardCounts?.find(
                        (r) => r?.rationCard === type
                      );
                      return (
                        <DataRow key={idx} label={type} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard title="Toilet" icon={Wifi} isLoading={isLoading}>
                  <div className="space-y-2">
                    {WASHROOM_TYPES.map((type, idx) => {
                      const item = facilityStats?.washroomCount?.find(
                        (w) => w?.washroom === type
                      );
                      return (
                        <DataRow key={idx} label={type} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard title="Water Supply" icon={Droplet} isLoading={isLoading}>
                  <div className="space-y-2">
                    {WATER_SUPPLY_TYPES.map((type, idx) => {
                      const item = facilityStats?.waterSupplyCounts?.find(
                        (w) => w?.waterSupply === type
                      );
                      return (
                        <DataRow key={idx} label={type} value={item?.count || 0} />
                      );
                    })}
                  </div>
                </InfoCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
