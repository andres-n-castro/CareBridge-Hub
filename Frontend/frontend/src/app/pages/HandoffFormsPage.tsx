import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { HandoffForm, HandoffStatus } from "../types/handoff";
import { MostRecentHandoffCard } from "../components/handoff/MostRecentHandoffCard";
import { HandoffFormsTable } from "../components/handoff/HandoffFormsTable";
import { HandoffFilters, HandoffFiltersState } from "../components/handoff/HandoffFilters";

// Mock Data
const MOCK_HANDOFFS: HandoffForm[] = [
  {
    id: "h-1",
    patientId: "PT-•••4821",
    roomNumber: "304-A",
    createdAt: new Date().toISOString(), // Just now
    status: "needs_review",
    attention: { missing: 2, uncertain: 1, followUps: 3 },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
  },
  {
    id: "h-2",
    patientId: "PT-•••9284",
    roomNumber: "210-B",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    status: "approved",
    attention: { missing: 0, uncertain: 0, followUps: 0 },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "h-3",
    patientId: "PT-•••1122",
    roomNumber: "101",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    status: "failed",
    attention: { missing: 0, uncertain: 0, followUps: 0 },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  },
  {
    id: "h-4",
    patientId: "PT-•••3344",
    roomNumber: "ICU-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    status: "approved",
    attention: { missing: 0, uncertain: 0, followUps: 0 },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
  },
  {
    id: "h-5",
    patientId: "PT-•••5566",
    roomNumber: "ER-4",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
    status: "needs_review",
    attention: { missing: 1, uncertain: 0, followUps: 0 },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
  },
];

export default function HandoffFormsPage() {
  const [filters, setFilters] = useState<HandoffFiltersState>({
    search: "",
    status: "all",
    attention: "all",
    sort: "recent",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const filteredHandoffs = useMemo(() => {
    let result = [...MOCK_HANDOFFS];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(h => 
        h.patientId.toLowerCase().includes(q) || 
        h.roomNumber.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (filters.status !== "all") {
      result = result.filter(h => h.status === filters.status);
    }

    // Attention Filter
    if (filters.attention !== "all") {
      result = result.filter(h => {
        if (filters.attention === "missing") return h.attention.missing > 0;
        if (filters.attention === "uncertain") return h.attention.uncertain > 0;
        if (filters.attention === "follow_ups") return h.attention.followUps > 0;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return filters.sort === "recent" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [filters]);

  // Separate most recent from the rest
  const mostRecentHandoff = filteredHandoffs.length > 0 ? filteredHandoffs[0] : null;
  const listHandoffs = filteredHandoffs.length > 0 ? filteredHandoffs.slice(1) : [];

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nurse Shift Handoff Forms
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and complete patient handoffs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
             <Link to="/sessions">View Sessions</Link>
          </Button>
          <Button className="shadow-sm" asChild>
            <Link to="/sessions">
              <Plus className="mr-2 h-4 w-4" />
              Start New Intake
            </Link>
          </Button>
        </div>
      </div>

      {/* Most Recent Section */}
      {mostRecentHandoff && !filters.search && filters.status === 'all' && filters.attention === 'all' ? (
        <MostRecentHandoffCard handoff={mostRecentHandoff} isLoading={isLoading} />
      ) : null}

      {/* List Section */}
      <div className="space-y-4">
        <HandoffFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          onRefresh={handleRefresh} 
        />
        
        <HandoffFormsTable 
          handoffs={mostRecentHandoff && !filters.search && filters.status === 'all' && filters.attention === 'all' ? listHandoffs : filteredHandoffs} 
          isLoading={isLoading} 
          error={error} 
          onRetry={handleRefresh}
        />
      </div>
    </div>
  );
}
