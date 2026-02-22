import { useState, useEffect } from "react";
import { Search, Copy, Pin, Clock } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";
import { TranscriptSegment } from "../types";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  onPin: (id: string) => void;
  onCopy: (text: string) => void;
  highlightedSegmentIds?: string[];
  className?: string;
}

export function TranscriptPanel({ segments, onPin, onCopy, highlightedSegmentIds = [], className }: TranscriptPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'All' | 'Nurse' | 'Patient'>('All');

  const filteredSegments = segments.filter(seg => {
    const matchesSearch = seg.text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || seg.speaker === filter;
    return matchesSearch && matchesFilter;
  });

  // Auto-scroll to first highlighted segment (optional, but good UX)
  useEffect(() => {
    if (highlightedSegmentIds.length > 0) {
      const el = document.getElementById(`segment-${highlightedSegmentIds[0]}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSegmentIds]);

  return (
    <div className={cn("flex flex-col h-full border border-border rounded-lg bg-card overflow-hidden shadow-sm", className)}>
      {/* Sticky Header */}
      <div className="p-4 border-b border-border bg-card z-10 sticky top-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Transcript</h2>
          <span className="text-xs text-muted-foreground">{segments.length} segments</span>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transcript..." 
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Nurse', 'Patient'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                filter === f 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Body */}
      <ScrollArea className="flex-1 bg-muted/10">
        <div className="p-4 space-y-4">
          {filteredSegments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No matching segments found.
            </div>
          ) : (
            filteredSegments.map((seg) => {
              const isHighlighted = highlightedSegmentIds.includes(seg.id);
              return (
                <div 
                  key={seg.id} 
                  id={`segment-${seg.id}`}
                  className={cn(
                    "group relative p-3 rounded-lg border border-border bg-card transition-all duration-300",
                    "hover:border-primary/20",
                    seg.isPinned && "border-primary/40 bg-primary/5",
                    isHighlighted && "ring-2 ring-primary ring-offset-2 border-primary bg-primary/5 shadow-md z-10"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={seg.speaker === 'Nurse' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-5">
                        {seg.speaker}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {seg.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(seg.text)} title="Copy text">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-6 w-6", seg.isPinned && "text-primary")} 
                        onClick={() => onPin(seg.id)}
                        title="Pin as evidence"
                      >
                        <Pin className="w-3 h-3 fill-current" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {search ? (
                      // Simple highlighting logic
                      seg.text.split(new RegExp(`(${search})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? <span key={i} className="bg-yellow-100 text-yellow-900 font-medium px-0.5 rounded">{part}</span> : part
                      )
                    ) : (
                      seg.text
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-2 border-t border-border bg-muted/5 text-center">
        <Button variant="link" size="sm" className="h-auto py-1 text-xs text-muted-foreground">
          Jump to latest
        </Button>
      </div>
    </div>
  );
}
