import { createContext, useContext, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const UpdateContext = createContext(null);
const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function AppUpdatesProvider({ children }) {
  const api = window.electronAPI;
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!api?.onUpdateState) return;
    let active = true;
    let receivedEvent = false;
    const unsubscribe = api.onUpdateState((nextState) => {
      receivedEvent = true;
      if (active) setState(nextState);
    });
    api.getUpdateState().then((initialState) => {
      // A progress event may have arrived while the initial request was in flight.
      if (active && !receivedEvent) setState(initialState);
    }).catch((error) => console.error("Unable to read update status:", error));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [api]);

  const runAction = async (action) => {
    try {
      await api[action]();
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: "error",
        dialogOpen: true,
        error: error.message || "Unable to contact the application updater. Please restart E-Jamaat and try again.",
        retryAction: "check",
      }));
    }
  };

  const status = state?.status;
  const busy = ["checking", "downloading", "installing"].includes(status);
  const retryMethod = state?.retryAction === "download"
    ? "downloadUpdate"
    : state?.retryAction === "install" ? "quitAndInstall" : "checkForUpdates";
  const messages = {
    idle: "Check for a newer version of E-Jamaat.",
    checking: "Checking for updates…",
    available: `E-Jamaat ${state?.version} is available. Download it when you are ready.`,
    "not-available": "You are using the latest version of E-Jamaat.",
    downloading: state?.percent >= 100 ? "Download complete. Verifying the update…" : "Downloading the update. You can keep using E-Jamaat.",
    downloaded: `Version ${state?.version} is ready. Save your work before restarting to install it.`,
    installing: "Restarting E-Jamaat to install the update…",
    error: "The update could not be completed. Your current version is still available.",
    unsupported: state?.error,
  };

  return (
    <UpdateContext.Provider value={{ state, runAction, available: Boolean(api?.getUpdateState) }}>
      {children}
      <Dialog open={Boolean(state?.dialogOpen)} onOpenChange={(open) => {
        if (!open) runAction("closeUpdates");
      }}>
        <DialogContent onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> E-Jamaat Updates
            </DialogTitle>
            <DialogDescription>
              Installed version: {state?.currentVersion || "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              {busy && <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />}
              {["not-available", "downloaded"].includes(status) && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />}
              {status === "error" && <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
              <p className="text-sm">{messages[status] || messages.idle}</p>
            </div>

            {status === "downloading" && (
              <div className="space-y-2">
                <Progress value={state.percent} aria-label="Update download progress" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatMB(state.transferred)} / {state.total ? formatMB(state.total) : "Calculating…"}</span>
                  <span>{Math.floor(state.percent)}%</span>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive break-words">
                {state.error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => runAction("closeUpdates")}>
              {status === "downloading" ? "Continue in background" : "Close"}
            </Button>
            {["idle", "not-available"].includes(status) && (
              <Button onClick={() => runAction("checkForUpdates")}>
                <RefreshCw className="h-4 w-4" /> Check for Updates
              </Button>
            )}
            {status === "available" && (
              <Button onClick={() => runAction("downloadUpdate")}>
                <Download className="h-4 w-4" /> Download Update
              </Button>
            )}
            {status === "downloaded" && (
              <Button onClick={() => runAction("quitAndInstall")}>
                <RefreshCw className="h-4 w-4" /> Restart & Install
              </Button>
            )}
            {status === "error" && (
              <Button onClick={() => runAction(retryMethod)}>
                <RefreshCw className="h-4 w-4" /> Retry {state.retryAction === "download" ? "Download" : state.retryAction === "install" ? "Install" : "Check"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpdateContext.Provider>
  );
}

export function AppUpdateButton() {
  const context = useContext(UpdateContext);
  if (!context?.available) return null;
  const { state, runAction } = context;
  const status = state?.status;
  const busy = ["checking", "downloading", "installing"].includes(status);
  const label = status === "downloading" ? `Updating ${Math.floor(state.percent)}%`
    : status === "downloaded" ? "Restart to update"
    : status === "available" ? "Update available"
    : status === "error" ? "Update failed"
    : "Updates";

  return (
    <Button
      variant={["available", "downloaded"].includes(status) ? "default" : "outline"}
      size="sm"
      className="gap-2 shrink-0"
      title="Check for application updates"
      onClick={() => runAction("openUpdates")}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      <span>{label}</span>
    </Button>
  );
}
