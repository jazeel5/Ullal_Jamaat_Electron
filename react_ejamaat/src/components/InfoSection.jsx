import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function InfoSection({ title, description, children, icon: Icon }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Card className="border-border/40">
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </div>
  );
}
