import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, UserCheck, Building } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"Analyst" | "Manager" | "Client" | null>(null);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const roleOptions = [
    {
      type: "Analyst" as const,
      title: "Security Analyst",
      description: "Technical incident response, detailed investigation, and hands-on remediation",
      icon: Shield,
      color: "border-blue-500 hover:bg-blue-50",
    },
    {
      type: "Manager" as const,
      title: "IT Manager",
      description: "Oversight of incident response, resource allocation, and business impact assessment",
      icon: UserCheck,
      color: "border-green-500 hover:bg-green-50",
    },
    {
      type: "Client" as const,
      title: "Business Stakeholder",
      description: "High-level status updates, business impact visibility, and communication coordination",
      icon: Building,
      color: "border-purple-500 hover:bg-purple-50",
    },
  ];

  const handleLogin = async () => {
    if (!selectedRole) return;

    try {
      await login(selectedRole);
      toast({
        title: "Login Successful",
        description: `Logged in as ${selectedRole}`,
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Unable to authenticate. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl font-bold">CyberSec Training Platform</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Incident Response Simulation & Training
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Select your role to access the appropriate training interface
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.type}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedRole === role.type
                    ? "ring-2 ring-primary bg-primary/5"
                    : role.color
                }`}
                onClick={() => setSelectedRole(role.type)}
                data-testid={`role-${role.type.toLowerCase()}`}
              >
                <CardHeader className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={handleLogin}
            disabled={!selectedRole || isLoading}
            size="lg"
            className="px-8"
            data-testid="login-button"
          >
            {isLoading ? (
              <>
                <User className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Login as {selectedRole || "..."}
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Simulated SSO Authentication</p>
          <p>This is a training environment with mock user credentials</p>
        </div>
      </div>
    </div>
  );
}