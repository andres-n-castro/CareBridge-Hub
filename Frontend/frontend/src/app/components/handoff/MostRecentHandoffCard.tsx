import { formatDistanceToNow, format } from "date-fns";
import { ArrowRight, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { StatusBadge } from "./StatusBadge";
import { AttentionSummary } from "./AttentionChip";
import { HandoffForm } from "../../types/handoff";
import { cn } from "../ui/utils";

interface MostRecentHandoffCardProps {
  handoff: HandoffForm;
  isLoading?: boolean;
}

export function MostRecentHandoffCard({ handoff, isLoading }: MostRecentHandoffCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
        <Card className="border-l-4 border-l-muted bg-muted/5 h-48 animate-pulse" />
      </div>
    );
  }

  const isApproved = handoff.status === "approved";
  const statusLabel = isApproved ? "View Approved Report" : "Open Handoff Form";
  const linkTarget = `/sessions/${handoff.id}/review`; // Assuming this route for now based on background

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Most Recent
      </h2>
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-200 border-l-4 cursor-pointer",
          "hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          isApproved 
            ? "border-l-green-500 bg-green-50/10" 
            : "border-l-primary bg-background"
        )}
        onClick={() => navigate(linkTarget)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(linkTarget);
          }
        }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            
            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between md:justify-start md:gap-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    {handoff.patientId}
                    <StatusBadge status={handoff.status} />
                  </h3>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">Room {handoff.roomNumber}</span>
                    <span>•</span>
                    <span title={format(new Date(handoff.createdAt), "PPpp")}>
                      Created {formatDistanceToNow(new Date(handoff.createdAt), { addSuffix: true })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Attention Summary */}
              {!isApproved && (
                <div className="flex items-center gap-3 pt-1">
                  <AttentionSummary 
                    missing={handoff.attention.missing} 
                    uncertain={handoff.attention.uncertain} 
                    followUps={handoff.attention.followUps} 
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {isApproved && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto" 
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/sessions/${handoff.id}/review`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Link>
                </Button>
              )}
              
              <Button 
                size="lg" 
                className="w-full sm:w-auto shadow-sm" 
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link to={linkTarget} className="flex items-center justify-center">
                  {statusLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
