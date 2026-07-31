import { LogOut, User, Settings, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown.js";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar.js";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full focus:outline-none cursor-pointer"
          aria-label="User menu"
        >
          <Avatar className="size-8 border border-border">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 border border-border">
        <DropdownMenuLabel className="bg-muted/15 border-b border-border/40 pb-2">
          <p className="text-xs font-bold text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground truncate leading-normal">{user.email}</p>
          <span className="inline-flex mt-1 items-center rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase select-none">
            {user.role.replace("_", " ")}
          </span>
        </DropdownMenuLabel>

        <div className="p-1">
          <DropdownMenuItem onSelect={() => navigate("/profile")}>
            <User className="mr-2 size-3.5 text-muted-foreground" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 size-3.5 text-muted-foreground" />
            Account Settings
          </DropdownMenuItem>
          {user.role === "SYSTEM_ADMIN" && (
            <DropdownMenuItem onSelect={() => navigate("/audit")}>
              <Shield className="mr-2 size-3.5 text-muted-foreground" />
              Audit Logs
            </DropdownMenuItem>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="p-1">
          <DropdownMenuItem
            onSelect={logout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="mr-2 size-3.5" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default UserMenu;
