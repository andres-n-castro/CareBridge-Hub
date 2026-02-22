import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, RefreshCw, Calendar, ArrowUpDown, X } from "lucide-react";
import { cn } from "./ui/utils";

export interface SessionFiltersState {
  search: string;
  status: string;
  dateRange: string;
  sort: string;
}

export const DEFAULT_SESSION_FILTERS: SessionFiltersState = {
  search: "",
  status: "all",
  dateRange: "all",
  sort: "recent",
};

interface FiltersRowProps {
  filters: SessionFiltersState;
  onFilterChange: (filters: SessionFiltersState) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function FiltersRow({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
}: FiltersRowProps) {
  const updateFilter = (key: keyof SessionFiltersState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.dateRange !== "all";

  const clearFilters = () => {
    onFilterChange({ ...DEFAULT_SESSION_FILTERS, sort: filters.sort });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
      {/* Left: Search + Filters */}
      <div className="flex flex-1 items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patient ID, session ID, notes..."
            className="pl-9 bg-background h-10"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[140px] h-10 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Recording">Recording</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Ready">Ready</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.dateRange}
          onValueChange={(v) => updateFilter("dateRange", v)}
        >
          <SelectTrigger className="w-[140px] h-10 shrink-0 hidden md:flex">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="shrink-0 h-10 px-2.5 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      {/* Right: Sort + Refresh */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="w-[160px] h-10">
            <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Refresh list"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 text-muted-foreground",
              isRefreshing && "animate-spin"
            )}
          />
        </Button>
      </div>
    </div>
  );
}
