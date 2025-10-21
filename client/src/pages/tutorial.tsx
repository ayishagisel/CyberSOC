import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, FileText, Target, TrendingUp } from "lucide-react";

export default function Tutorial() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to CyberSOC Training Platform",
      icon: Shield,
      description: "An interactive incident response training simulator",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This platform simulates realistic cybersecurity incidents to train security analysts on proper incident response procedures.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎯 Learning Objectives:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Master the 5-phase incident response workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Practice containment and eradication techniques</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Learn MITRE ATT&CK framework mapping</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Generate professional incident reports</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Understanding the Dashboard Layout",
      icon: Target,
      description: "Navigate the three-panel interface",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Left Panel</CardTitle>
                <CardDescription className="text-xs">Workflow Tracker</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Shows your progress through the 5 incident response phases with real-time highlighting.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Center Panel</CardTitle>
                <CardDescription className="text-xs">Incident Data</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Displays alerts, affected endpoints, security logs, and metrics.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Right Panel</CardTitle>
                <CardDescription className="text-xs">AI Assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Provides guidance, action buttons, and contextual help for each phase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "The 5-Phase Incident Response Workflow",
      icon: TrendingUp,
      description: "Follow the industry-standard NIST framework",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            The left panel tracks your progress through these critical phases:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <h4 className="font-semibold text-sm">Initial Detection and Assessment</h4>
                <p className="text-xs text-muted-foreground">Identify the security incident and determine initial response actions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <h4 className="font-semibold text-sm">Determine Impact and Scope</h4>
                <p className="text-xs text-muted-foreground">Assess affected systems and evaluate the extent of the compromise</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <h4 className="font-semibold text-sm">Analyze Attack Vectors</h4>
                <p className="text-xs text-muted-foreground">Investigate how the attack occurred and identify entry points</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <h4 className="font-semibold text-sm">Contain and Eradicate Threat</h4>
                <p className="text-xs text-muted-foreground">Isolate affected systems and remove the threat from the environment</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">5</Badge>
              <div>
                <h4 className="font-semibold text-sm">Document and Improve</h4>
                <p className="text-xs text-muted-foreground">Generate reports and update security procedures</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step-by-Step: How to Complete a Simulation",
      icon: FileText,
      description: "Your guide to successful incident response",
      content: (
        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Pro Tip: Use the Hints Button</h4>
                <p className="text-xs text-muted-foreground">
                  Look for the "Show Hints" button in the dashboard to see all 12 required actions at any time!
                </p>
              </div>
            </div>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">1</Badge>
              <div>
                <strong>Start Investigation:</strong> Click "Start Investigation" on a Critical or High severity alert in the center panel
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">2</Badge>
              <div>
                <strong>Watch the Left Panel:</strong> The first phase "Initial Detection and Assessment" will highlight in light blue
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">3</Badge>
              <div>
                <strong>Read AI Guidance:</strong> The AI Assistant (right panel) provides context and recommendations for the current phase
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">4</Badge>
              <div>
                <strong>Take Actions:</strong> Click action buttons in the AI Assistant panel (e.g., "Begin Containment Protocol")
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">5</Badge>
              <div>
                <strong>Progress Through Phases:</strong> Watch the left panel update as you complete each phase (checkmark = completed, circle = active)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">6</Badge>
              <div>
                <strong>Complete All Actions:</strong> Take at least 12 actions total to reach 100% completion
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-0.5">7</Badge>
              <div>
                <strong>Generate Report:</strong> In the final phase, click "Generate Incident Report" to document your response
              </div>
            </li>
          </ol>
        </div>
      )
    }
  ];

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setLocation("/");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {tutorialSteps.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              Skip Tutorial
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {isLastStep ? "Start Simulation" : "Next"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
