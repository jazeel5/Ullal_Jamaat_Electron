import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock3, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AnnouncementComingSoon() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-6 py-12">
      <Card className="relative w-full max-w-2xl overflow-hidden border-border/60 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="relative mb-7">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-10 w-10" />
            </div>
            <div className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-card text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            <Clock3 className="h-4 w-4" />
            Coming Soon
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Announcements &amp; Community Notices
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            This feature is currently under development. Soon, you will be able
            to create, target, publish, and manage community announcements from
            this page.
          </p>

          <Button
            variant="outline"
            className="mt-8 gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
