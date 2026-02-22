import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { AlertBanner } from "../AlertBanner";
import { Button } from "../ui/button";
import { FilePlus } from "lucide-react";
import { HandoffFormRow } from "./HandoffFormRow";
import { HandoffForm } from "../../types/handoff";
import { cn } from "../ui/utils";

interface HandoffFormsTableProps {
  handoffs: HandoffForm[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function HandoffFormsTable({ 
  handoffs, 
  isLoading, 
  error, 
  onRetry,
  className 
}: HandoffFormsTableProps) {
  
  if (error) {
    return (
      <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
        <div className="p-6">
          <AlertBanner 
            type="error" 
            title="Failed to load handoff forms" 
            message={error}
            action={onRetry ? <Button onClick={onRetry} variant="outline" size="sm">Retry</Button> : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead className="w-[200px]">Patient / Room</TableHead>
            <TableHead className="w-[150px]">Shift / Date</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[180px]">Attention</TableHead>
            <TableHead className="w-[150px]">Last Updated</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-10 w-[140px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : handoffs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <FilePlus className="h-10 w-10 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-foreground">No handoff forms yet</h3>
                  <p className="mb-4 text-sm">Start a new intake session to generate a handoff form.</p>
                  <Button asChild>
                    <a href="/sessions">Start New Intake</a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            handoffs.map((handoff) => (
              <HandoffFormRow key={handoff.id} handoff={handoff} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
