import { TopNav } from "./TopNav";
import { Outlet } from "react-router";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-muted/5 flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-[1248px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
