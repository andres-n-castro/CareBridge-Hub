import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Plus, Upload, RefreshCw, Loader2 } from "lucide-react";
import {
  FiltersRow,
  SessionFiltersState,
  DEFAULT_SESSION_FILTERS,
} from "../components/FiltersRow";
import { SessionsTable } from "../components/SessionsTable";
import { PaginationControls } from "../components/PaginationControls";
import { Session } from "../data/mockSessions";
import { AlertBanner } from "../components/AlertBanner";
import { Skeleton } from "../components/ui/skeleton";
import { SessionStatus } from "../components/StatusBadge";
import * as api from "../services/api";

// Status sort priority (lower = higher priority)
const STATUS_PRIORITY: Record<SessionStatus, number> = {
  Recording: 0,
  Processing: 1,
  Ready: 2,
  Failed: 3,
  Approved: 4,
};

function isWithinDateRange(
  createdAt: string,
  range: string
): boolean {
  if (range === "all") return true;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const msInDay = 86_400_000;
  switch (range) {
    case "today": {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return created >= startOfToday.getTime();
    }
    case "7days":
      return created >= now - 7 * msInDay;
    case "30days":
      return created >= now - 30 * msInDay;
    default:
      return true;
  }
}

export default function SessionListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [filters, setFilters] = useState<SessionFiltersState>(
    DEFAULT_SESSION_FILTERS
  );

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await api.listSessions(100, 0);
      setSessions(data.map(api.backendSessionToFrontend));
      setError(null);
    } catch {
      setError("Failed to load sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchSessions();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.listSessions(100, 0);
      setSessions(data.map(api.backendSessionToFrontend));
    } catch {
      // Silently ignore refresh errors — list already shown
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    try {
      await api.deleteSession(Number(id));
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete session. Please try again.");
    }
  };

  const handleNewSession = async () => {
    setCreatingSession(true);
    try {
      const { id } = await api.createSession();
      navigate(`/sessions/${id}/record`);
    } catch {
      setError("Failed to create a new session. Please try again.");
      setCreatingSession(false);
    }
  };

  // Apply filters & sort
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search — match against patient id, session id, owner
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.maskedPatientId.toLowerCase().includes(q) ||
          s.patientId.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.owner.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((s) => s.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      result = result.filter((s) =>
        isWithinDateRange(s.createdAt, filters.dateRange)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "status":
          return (
            (STATUS_PRIORITY[a.status] ?? 99) -
            (STATUS_PRIORITY[b.status] ?? 99)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, filters]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sessions
          </h1>
          <p className="text-muted-foreground mt-1">
            Start a new intake or review completed sessions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import audio</span>
          </Button>
          <Button
            className="gap-2 shadow-sm"
            onClick={handleNewSession}
            disabled={creatingSession}
          >
            {creatingSession ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FiltersRow
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Main Content */}
      <div className="space-y-4">
        {error ? (
          <div className="rounded-md border bg-card p-8 text-center space-y-4">
            <AlertBanner message={error} />
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-md" />
          </div>
        ) : filteredSessions.length === 0 && sessions.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-white">
            <p className="text-muted-foreground">
              No sessions match your filters.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setFilters(DEFAULT_SESSION_FILTERS)}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            <SessionsTable sessions={filteredSessions} onDelete={handleDelete} />
            <PaginationControls />
          </>
        )}
      </div>
    </div>
  );
}
