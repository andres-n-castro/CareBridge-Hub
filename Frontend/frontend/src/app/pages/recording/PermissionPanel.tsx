import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AlertCircle, Mic, RefreshCw } from "lucide-react";

interface PermissionPanelProps {
  type: "denied" | "no_device" | "error";
  onRetry: () => void;
  onBack?: () => void;
}

export function PermissionPanel({ type, onRetry, onBack }: PermissionPanelProps) {
  if (type === "denied") {
    return (
      <Card className="w-full max-w-lg mx-auto bg-destructive/10 border-destructive">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <Mic className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-destructive">Microphone access required</h3>
          <div className="space-y-2 text-muted-foreground">
            <p className="text-sm">Please follow these steps:</p>
            <ol className="text-sm list-decimal list-inside space-y-1">
              <li>Allow microphone access in your browser</li>
              <li>Reload the page if prompted</li>
            </ol>
          </div>
          <Button variant="destructive" onClick={onRetry} className="mt-4 w-full sm:w-auto">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === "no_device") {
    return (
      <Card className="w-full max-w-lg mx-auto bg-amber-50 border-amber-200">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-amber-800">No microphone found</h3>
          <p className="text-sm text-amber-700">
            Please check your device connection and try again.
          </p>
          <div className="flex gap-3 mt-4 w-full sm:w-auto justify-center">
            <Button variant="outline" onClick={onBack} className="border-amber-300 text-amber-800 hover:bg-amber-100">
              Go Back
            </Button>
            <Button onClick={onRetry} className="bg-amber-600 hover:bg-amber-700 text-white">
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-destructive/5 border-destructive">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-destructive">Recording Error</h3>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while recording.
        </p>
        <div className="flex gap-3 mt-4 w-full sm:w-auto justify-center">
          <Button variant="outline" onClick={onBack}>
            Return to Sessions
          </Button>
          <Button onClick={onRetry} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
