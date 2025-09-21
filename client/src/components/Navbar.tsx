import { Button } from "@/components/ui/button";
import { Shield, User, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import NewSimulationDialog from "@/components/NewSimulationDialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  userRole: "Analyst" | "Manager" | "Client";
  onRoleChange: (role: "Analyst" | "Manager" | "Client") => void;
}

export default function Navbar({ userRole, onRoleChange }: NavbarProps) {
  const [showNewSimulationDialog, setShowNewSimulationDialog] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold">CyberSOC Playbook</h1>
          </div>
          
          <div className="flex bg-muted rounded-lg p-1" data-testid="role-switcher">
            {(["Analyst", "Manager", "Client"] as const).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`px-3 py-1 text-sm font-medium transition-colors rounded-md ${
                  userRole === role
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`role-${role.toLowerCase()}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowNewSimulationDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="new-simulation-btn"
          >
            New Simulation
          </Button>
          
          <NewSimulationDialog 
            open={showNewSimulationDialog}
            onOpenChange={setShowNewSimulationDialog}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Role: {user?.role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}