import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";
import { useState } from "react";
import NewSimulationDialog from "@/components/NewSimulationDialog";

interface NavbarProps {
  userRole: "Analyst" | "Manager" | "Client";
  onRoleChange: (role: "Analyst" | "Manager" | "Client") => void;
}

export default function Navbar({ userRole, onRoleChange }: NavbarProps) {
  const [showNewSimulationDialog, setShowNewSimulationDialog] = useState(false);

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
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </nav>
  );
}
