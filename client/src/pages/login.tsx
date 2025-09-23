import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, UserCheck, Building, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"Analyst" | "Manager" | "Client" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginWithCredentials, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const handleRoleLogin = async () => {
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

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginWithCredentials(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid credentials. Please try again.",
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

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">
              <Mail className="h-4 w-4 mr-2" />
              Login with Email
            </TabsTrigger>
            <TabsTrigger value="demo">
              <UserCheck className="h-4 w-4 mr-2" />
              Demo Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Login
                </CardTitle>
                <CardDescription>
                  Sign in with your account credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setLocation("/register")}
                      className="text-primary hover:underline font-medium"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="mt-6">
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
                onClick={handleRoleLogin}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}