import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "./ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router";
import { cn } from "./ui/utils";

export function TopNav() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <nav className="h-16 border-b border-border bg-background flex items-center justify-center px-4 sticky top-0 z-50">
      <div className="w-full max-w-[1200px] flex items-center justify-between h-full">
        {/* Left: App Name + Nav */}
        <div className="flex items-center gap-8 h-full">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-semibold text-lg tracking-tight">
              Shift Hero
            </Link>
            {/* Optional Demo Pill */}
            <span className="hidden sm:inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              Demo
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 h-full">
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => cn(
                "inline-flex items-center px-4 h-full text-sm font-medium border-b-2 transition-colors",
                isActive 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              Handoff Forms
            </NavLink>
            <NavLink 
              to="/sessions" 
              className={({ isActive }) => cn(
                "inline-flex items-center px-4 h-full text-sm font-medium border-b-2 transition-colors",
                isActive 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              )}
            >
              Sessions
            </NavLink>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-2 pr-1 py-1 h-auto hover:bg-muted gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" /> {/* Fallback to initials */}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">NP</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">N. Patel</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
