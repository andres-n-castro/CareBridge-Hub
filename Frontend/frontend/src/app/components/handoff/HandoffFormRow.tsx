import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { MoreHorizontal, ExternalLink, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router";
import { TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "../ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { AttentionSummary } from "./AttentionChip";
import { HandoffForm } from "../../types/handoff";
import { cn } from "../ui/utils";

interface HandoffFormRowProps {
  handoff: HandoffForm;
}

function getShiftLabel(date: Date): string {
  const hours = date.getHours();
  // Simple logic: 7am-7pm is Day, 7pm-7am is Night
  const isDay = hours >= 7 && hours < 19;
  return isDay ? "Day" : "Night";
}

export function HandoffFormRow({ handoff }: HandoffFormRowProps) {
  const navigate = useNavigate();
  const createdDate = new Date(handoff.createdAt);
  const updatedDate = new Date(handoff.lastUpdated);
  const shift = getShiftLabel(createdDate);
  const dateStr = format(createdDate, "MMM d, yyyy");
  
  const hasAttention = 
    handoff.status === "needs_review" && 
    (handoff.attention.missing > 0 || handoff.attention.uncertain > 0 || handoff.attention.followUps > 0);
  
  const isFailed = handoff.status === "failed";
  
  return (
    <TableRow 
      className={cn(
        "group cursor-pointer hover:bg-muted/50 transition-colors",
        hasAttention && "bg-amber-50/30 hover:bg-amber-50/50",
        isFailed && "bg-red-50/30 hover:bg-red-50/50"
      )}
      onClick={() => navigate(`/sessions/${handoff.id}/review`)}
    >
      <TableCell className="font-medium pl-4">
        <div className="flex flex-col">
          <Link 
            to={`/sessions/${handoff.id}/review`} 
            className="text-foreground hover:underline decoration-primary underline-offset-4 font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {handoff.patientId}
          </Link>
          <span className="text-xs text-muted-foreground">Room {handoff.roomNumber}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col text-sm">
          <span>{dateStr}</span>
          <span className="text-xs text-muted-foreground">{shift} Shift</span>
        </div>
      </TableCell>
      
      <TableCell>
        <StatusBadge status={handoff.status} />
      </TableCell>
      
      <TableCell>
        <AttentionSummary 
          missing={handoff.attention.missing} 
          uncertain={handoff.attention.uncertain} 
          followUps={handoff.attention.followUps} 
        />
      </TableCell>
      
      <TableCell className="text-muted-foreground text-sm">
        <span title={format(updatedDate, "PPpp")}>
          {formatDistanceToNow(updatedDate, { addSuffix: true })}
        </span>
      </TableCell>
      
      <TableCell className="pr-4">
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/sessions/${handoff.id}/review`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Form
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                Report Issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}