import { ChevronDown, Search, LogOut, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { profileService } from "@/api/profileService";

const roleLabels: Record<string, string> = {
  admin: "System Administrator",
  doctor: "Medical Doctor",
  patient: "Patient",
  pharmacist: "Pharmacist",
  nurse: "Head Nurse",
  lab_staff: "Lab Technician",
};

export function TopBar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchProfile();
  }, []);

  const displayName = user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="flex h-[64px] items-center justify-between px-4 md:px-8 gap-6">
        {/* Left: Sidebar trigger */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
        </div>

        {/* Center: Search */}
        <div className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
          searchFocused ? "flex-1 max-w-lg bg-card border-primary ring-1 ring-primary" : "flex-1 max-w-md bg-muted border-transparent"
        } border`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="bg-transparent outline-none text-sm w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Avatar" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-xs font-medium">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground">{roleLabels[role || ""] || "Member"}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              <div className="px-2 py-2 border-b text-xs">
                <p className="font-semibold">{displayName}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="text-xs cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive cursor-pointer">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}