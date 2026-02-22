import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  Mic, 
  Pause, 
  Play, 
  Square, 
  AlertTriangle,
  Radio
} from "lucide-react";
import { cn } from "../../components/ui/utils";
import { motion } from "motion/react";

interface RecordingHeroCardProps {
  status: "idle" | "recording" | "paused";
  onStatusChange: (status: "idle" | "recording" | "paused") => void;
  onStop: () => void;
  lowInputWarning?: boolean;
}

export function RecordingHeroCard({ 
  status, 
  onStatusChange, 
  onStop,
  lowInputWarning = false 
}: RecordingHeroCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "recording") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Mock audio visualizer bars
  const [audioLevel, setAudioLevel] = useState<number[]>(Array(20).fill(10));
  
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      if (status === "recording") {
        setAudioLevel(prev => prev.map(() => Math.random() * 40 + 10));
      } else {
        setAudioLevel(Array(20).fill(4)); // Low level when idle/paused
      }
      // Slower animation for visual clarity
      setTimeout(() => {
        animationFrame = requestAnimationFrame(animate);
      }, 100);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [status]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-sm border-slate-200">
      <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center space-y-8">
        
        {/* 1. Status Block */}
        <div className="flex flex-col items-center space-y-3">
          <Badge 
            variant={status === "recording" ? "default" : "secondary"}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
              status === "recording" ? "bg-red-600 hover:bg-red-700 animate-pulse" : 
              status === "paused" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
              "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {status === "idle" && "Ready to Record"}
            {status === "recording" && (
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Recording
              </span>
            )}
            {status === "paused" && "Session Paused"}
          </Badge>
        </div>

        {/* 2. Timer Display */}
        <div className="text-center space-y-2">
          <div className={cn(
            "text-6xl sm:text-7xl font-mono font-medium tracking-tight tabular-nums transition-colors",
            status === "recording" ? "text-slate-900" : "text-slate-400"
          )}>
            {formatTime(elapsedTime)}
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Max recommended: 20 min
          </p>
        </div>

        {/* 3. Audio Visualizer */}
        <div className="w-full h-16 flex items-center justify-center gap-1 opacity-80">
           {audioLevel.map((height, i) => (
             <motion.div
               key={i}
               className={cn(
                 "w-1.5 rounded-full transition-all duration-100",
                 status === "recording" ? "bg-slate-800" : "bg-slate-200"
               )}
               animate={{ height: status === "recording" ? height : 4 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             />
           ))}
        </div>
        
        {status === "recording" && (
           <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <Mic className="h-3.5 w-3.5" />
             Mic active
           </div>
        )}

        {/* Low Input Warning */}
        {lowInputWarning && status === "recording" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Microphone input is very low. Check your distance to the mic.</span>
          </div>
        )}

        {/* 4. Controls */}
        <div className="flex items-center justify-center gap-4 w-full pt-4">
          {status === "idle" ? (
            <Button 
              size="lg" 
              className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-md transition-all hover:scale-105 active:scale-95"
              onClick={() => onStatusChange("recording")}
            >
              <Mic className="h-8 w-8 text-white" />
              <span className="sr-only">Start Recording</span>
            </Button>
          ) : (
            <>
              {status === "recording" ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-14 rounded-full border-2 border-slate-200 hover:bg-slate-50 transition-all"
                  onClick={() => onStatusChange("paused")}
                >
                  <Pause className="h-6 w-6 text-slate-700" />
                  <span className="sr-only">Pause</span>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-md hover:scale-105"
                  onClick={() => onStatusChange("recording")}
                >
                  <Play className="h-6 w-6 text-white ml-1" />
                  <span className="sr-only">Resume</span>
                </Button>
              )}

              <Button
                size="lg"
                variant="secondary"
                className="h-14 w-14 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-all border border-slate-200"
                onClick={onStop}
              >
                <Square className="h-5 w-5 fill-current" />
                <span className="sr-only">Stop</span>
              </Button>
            </>
          )}
        </div>
        
        {/* Keyboard Hint */}
        <div className="text-xs text-slate-400 font-medium">
          Space to {status === "recording" ? "Pause" : "Resume"}
        </div>

      </CardContent>
    </Card>
  );
}
