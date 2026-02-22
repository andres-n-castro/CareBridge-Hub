import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Search, RefreshCw, ArrowUpDown, Filter } from "lucide-react";

export interface HandoffFiltersState {
  search: string;
  status: string;
  attention: string;
  sort: string;
}

interface HandoffFiltersProps {
  filters: HandoffFiltersState;
  onFilterChange: (filters: HandoffFiltersState) => void;
  onRefresh: () => void;
}

export function HandoffFilters({ filters, onFilterChange, onRefresh }: HandoffFiltersProps) {
  const updateFilter = (key: keyof HandoffFiltersState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patient, room, shift..."
            className="pl-9 bg-background h-10"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Filters & Sort Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="w-[150px] h-10 shrink-0">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.attention} onValueChange={(v) => updateFilter("attention", v)}>
            <SelectTrigger className="w-[160px] h-10 shrink-0">
              <SelectValue placeholder="Attention" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Attention</SelectItem>
              <SelectItem value="missing">Missing Items</SelectItem>
              <SelectItem value="uncertain">Uncertain Items</SelectItem>
              <SelectItem value="follow_ups">Follow-ups</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border mx-1 hidden md:block" />

          <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
            <SelectTrigger className="w-[160px] h-10 shrink-0">
              <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 shrink-0" 
            onClick={onRefresh}
            aria-label="Refresh list"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
