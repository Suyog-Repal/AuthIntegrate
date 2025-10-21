import { Fingerprint, LogOut, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface HeaderProps {
  hardwareConnected: boolean;
}

export function Header({ hardwareConnected }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Fingerprint className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Dual-Factor Authentication
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  hardwareConnected ? "bg-success animate-pulse" : "bg-destructive"
                }`}
                data-testid="hardware-status-indicator"
              />
              <span className="text-xs text-muted-foreground">
                {hardwareConnected ? "Hardware Connected" : "Hardware Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                <User className="w-5 h-5" />
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium">{user?.profile?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user?.profile?.role}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
