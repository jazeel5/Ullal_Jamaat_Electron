import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Briefcase,
  Heart,
  IdCard,
  FileText,
  Accessibility,
  GraduationCap,
  Zap,
} from "lucide-react";

export function MemberCard({ member, onAadhaarClick, folderPath }) {
  const getMaritalStatus = (status) => {
    const statusMap = { Yes: "Married", No: "Single" };
    return statusMap[status] || status;
  };

  const getAvailabilityStatus = (status) => {
    const statusMap = { Yes: "Available", No: "Not Available" };
    return statusMap[status] || status;
  };

  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow pt-0">
      {/* Header */}
      <CardHeader className="py-3 bg-primary text-primary-foreground ">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">
              {member?.fullName}
            </h3>
            <p className="text-sm text-primary-foreground/80 mt-1">
              {member?.relationToOwner}
            </p>
          </div>
          {member?.aadhaarCardDoc && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAadhaarClick(member.aadhaarCardDoc)}
              className="flex-shrink-0"
            >
              View ID
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-4 space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">DOB</p>
              <p className="text-sm font-medium truncate">
                {member?.dateOfBirth || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-sm font-medium truncate">
                {member?.gender || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Occupation</p>
            <p className="text-sm font-medium truncate">
              {member?.occupation || "-"}
            </p>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Marital Status</p>
            <p className="text-sm font-medium truncate">
              {getMaritalStatus(member?.maritalStatus)}
            </p>
          </div>
        </div>

        {/* Row 4 */}
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Education</p>
            <p className="text-sm font-medium truncate">
              {member?.academicEducationLevel || "-"}
            </p>
          </div>
        </div>

        {/* Row 5 */}
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Annual Income</p>
            <p className="text-sm font-medium truncate">
              ₹{member?.annualIncome || "-"}
            </p>
          </div>
        </div>

        {/* Row 6 */}
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Voter ID</p>
            <Badge variant="outline" className="text-xs">
              {getAvailabilityStatus(member?.voterId)}
            </Badge>
          </div>
        </div>

        {/* Row 7 */}
        {member?.disablity === "yes" && (
          <div className="flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Disability</p>
              <p className="text-sm font-medium truncate">
                {member?.disablityStatus || "Yes"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
