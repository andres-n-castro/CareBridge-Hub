import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import { Button } from "./ui/button";
import { 
  MoreHorizontal, 
  ArrowRight, 
  Copy, 
  FileDown, 
  Trash,
  FileText
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Session } from "../data/mockSessions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNavigate } from "react-router";

interface SessionsTableProps {
  sessions: Session[];
  onDelete?: (id: string) => void;
}

export function SessionsTable({ sessions, onDelete }: SessionsTableProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-white">
        <div className="rounded-full bg-muted/30 p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No sessions found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs">
          You haven't created any intake sessions yet. Start a new one to get started.
        </p>
        <Button>New Session</Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Patient</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow 
              key={session.id} 
              className="cursor-pointer hover:bg-muted/30 group"
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-foreground font-semibold tracking-tight">{session.maskedPatientId}</span>
                  <span className="text-xs text-muted-foreground font-normal">Session: {session.id}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                <div>
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs opacity-70">
                  {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={session.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{session.lastUpdated}</TableCell>
              <TableCell>
                <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-medium border border-blue-100 ring-1 ring-blue-50">
                  {session.owner}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => navigate(`/sessions/${session.id}/review`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Open</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/sessions/${session.id}/review`)}>
                        <ArrowRight className="mr-2 h-4 w-4" /> Review & Approve
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileDown className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete?.(session.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}