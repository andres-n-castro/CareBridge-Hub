import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { HandoffForm } from "../types/handoff";
import { MostRecentHandoffCard } from "../components/handoff/MostRecentHandoffCard";
import { HandoffFormsTable } from "../components/handoff/HandoffFormsTable";
import { HandoffFilters, HandoffFiltersState } from "../components/handoff/HandoffFilters";
import * as api from "../services/api";

export default function HandoffFormsPage() {
  const navigate = useNavigate();
  const [handoffs, setHandoffs] = useState<HandoffForm[]>([]);
  const [creatingSession, setCreatingSession] = useState(false);
  const [filters, setFilters] = useState<HandoffFiltersState>({
    search: "",
    status: "all",
    attention: "all",
    sort: "recent",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNewIntake = async () => {
    setCreatingSession(true);
    try {
      const { id } = await api.createSession();
      navigate(`/sessions/${id}/record`);
    } catch {
      setError("Failed to create a new session. Please try again.");
      setCreatingSession(false);
    }
  };

  const fetchHandoffs = async () => {
    try {
      setIsLoading(true);
      const data = await api.listSessions(100, 0);
      setHandoffs(data.map(api.backendSessionToHandoffForm));
      setError(null);
    } catch {
      setError("Failed to load handoff forms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoffs();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await api.listSessions(100, 0);
      setHandoffs(data.map(api.backendSessionToHandoffForm));
      setError(null);
    } catch {
      // Silently ignore refresh errors — list already shown
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHandoffs = useMemo(() => {
    let result = [...handoffs];

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
  }, [handoffs, filters]);

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
          <Button className="shadow-sm" onClick={handleNewIntake} disabled={creatingSession}>
            {creatingSession ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Start New Intake
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
          onRetry={fetchHandoffs}
        />
      </div>
    </div>
  );
}
