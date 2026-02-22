import { useState } from "react";
import { 
  Info, 
  CheckCircle2, 
  HelpCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../../../components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../../../components/ui/tooltip";
import { cn } from "../../../components/ui/utils";
import { SVIMetric, FollowUpQuestion } from "../types";

interface SVIPanelProps {
  metrics: SVIMetric[];
  questions: FollowUpQuestion[];
  onQuestionChange: (id: string, status: 'new' | 'asked' | 'answered', answer?: string) => void;
  onSuggestionClick?: (fieldId: string, suggestedValue?: string) => void;
  className?: string;
}

export function SVIPanel({ metrics, questions, onQuestionChange, onSuggestionClick, className }: SVIPanelProps) {
  const answeredCount = questions.filter(q => q.status === 'answered').length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className={cn("flex flex-col h-full border border-border rounded-lg bg-card overflow-hidden shadow-sm", className)}>
      {/* Sticky Header */}
      <div className="p-4 border-b border-border bg-card z-10 sticky top-0 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">SVI Insights</h2>
          <p className="text-xs text-muted-foreground">Social determinants considerations</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px]">Social Vulnerability Index (SVI) highlights potential barriers to care based on patient demographics and location.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-4 space-y-4">
        
        {/* SVI Summary Card */}
        <Card className="shadow-none border border-border">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Area Risk Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate" title={metric.label}>
                    {metric.label}
                  </span>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold tabular-nums leading-none">{metric.score}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-4 border-0 font-medium",
                        metric.category === 'High' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        metric.category === 'Moderate' ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                        "bg-green-100 text-green-700 hover:bg-green-100"
                      )}
                    >
                      {metric.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
             <div className="pt-3">
                <div className="text-xs text-muted-foreground bg-blue-50 text-blue-800 p-2 rounded border border-blue-100">
                  <p className="font-medium mb-0.5">Note on Housing:</p>
                  High risk indicates potential instability. Verify discharge address.
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Follow-up Questions Card */}
        <Card className="shadow-none border border-border">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Follow-up Questions
              </CardTitle>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No follow-up questions generated.
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className={cn(
                  "border rounded-lg p-3 transition-all",
                  q.status === 'answered' ? "bg-green-50/50 border-green-100" : "bg-card border-border"
                )}>
                  <div className="flex items-start gap-3">
                     {/* Toggle Button */}
                     <button 
                      onClick={() => {
                        if (q.status === 'answered') {
                           onQuestionChange(q.id, 'asked', q.answer);
                        } else {
                           onQuestionChange(q.id, q.status === 'new' ? 'asked' : 'new');
                        }
                      }}
                      className={cn(
                        "mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        q.status === 'answered' ? "bg-green-500 border-green-500 text-white" : 
                        q.status === 'asked' ? "bg-orange-100 border-orange-300 text-orange-600" :
                        "bg-background border-muted-foreground/30 hover:border-primary"
                      )}
                      title={q.status === 'answered' ? "Mark as not answered" : "Mark as asked"}
                     >
                       {q.status === 'answered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                       {q.status === 'asked' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                     </button>
                     
                     <div className="flex-1 space-y-1.5 w-full">
                        <p className={cn(
                          "text-sm font-medium leading-snug",
                          q.status === 'answered' && "text-muted-foreground line-through decoration-border"
                        )}>
                          {q.question}
                        </p>
                        
                        {q.status !== 'answered' && (
                          <p className="text-[11px] text-muted-foreground italic">
                            Rationale: {q.rationale}
                          </p>
                        )}
                        
                        {q.status === 'asked' && (
                          <div className="pt-1 animate-in fade-in slide-in-from-top-1">
                             <Textarea 
                              placeholder="Record patient response..."
                              className="min-h-[60px] text-xs resize-none mb-2"
                              value={q.answer || ''}
                              onChange={(e) => onQuestionChange(q.id, 'asked', e.target.value)}
                             />
                             <Button 
                              size="sm" 
                              className="h-7 w-full text-xs gap-2"
                              disabled={!q.answer?.trim()}
                              onClick={() => onQuestionChange(q.id, 'answered', q.answer)}
                             >
                               Mark as Answered
                             </Button>
                          </div>
                        )}
                        
                        {q.status === 'new' && (
                          <div className="flex items-center pt-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-0 text-[10px] text-primary hover:text-primary hover:bg-transparent -ml-0 font-normal hover:underline"
                              onClick={() => onQuestionChange(q.id, 'asked')}
                            >
                              Mark as Asked
                            </Button>
                          </div>
                        )}
                        
                        {q.status === 'answered' && (
                          <div className="pt-1">
                             <div className="text-xs bg-white/50 p-2 rounded border border-green-100 text-green-900 break-words">
                               "{q.answer}"
                             </div>
                              <div className="flex items-center justify-between mt-1">
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="h-auto p-0 text-[10px] text-muted-foreground"
                                  onClick={() => onQuestionChange(q.id, 'asked', q.answer)}
                                >
                                  Edit Answer
                                </Button>
                              </div>
                              
                              {/* Suggested Impact Chip */}
                              {q.relatedFieldIds && q.relatedFieldIds.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {q.relatedFieldIds.map(fid => (
                                     <div 
                                       key={fid}
                                       className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors shadow-sm"
                                       onClick={() => onSuggestionClick?.(fid, q.answer)}
                                     >
                                       <Sparkles className="w-3 h-3" />
                                       <span>Update field</span>
                                     </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
