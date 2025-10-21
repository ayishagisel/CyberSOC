import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle } from "lucide-react";

interface HintsButtonProps {
  actionsTaken?: number;
}

export default function HintsButton({ actionsTaken = 0 }: HintsButtonProps) {
  const [open, setOpen] = useState(false);

  const requiredActions = [
    {
      phase: "Phase 1: Initial Detection",
      actions: [
        "Begin Containment Protocol (or Gather More Intelligence First)"
      ]
    },
    {
      phase: "Phase 1-2: Identification Actions",
      actions: [
        "Isolate Endpoints",
        "Lock User Accounts",
        "Analyze Network Traffic",
        "Escalate to Manager"
      ]
    },
    {
      phase: "Phase 2: Determine Impact",
      actions: [
        "Complete Full Network Scan (or Focus on Critical Systems First)"
      ]
    },
    {
      phase: "Phase 3: Analyze Attack Vectors",
      actions: [
        "Forensic Analysis of Patient Zero (or Network Traffic Analysis)"
      ]
    },
    {
      phase: "Phase 3-4: Containment Actions",
      actions: [
        "Network Segmentation",
        "Azure AD Lockdown"
      ]
    },
    {
      phase: "Phase 4: Contain and Eradicate",
      actions: [
        "Isolate All Affected Endpoints (or Begin System Recovery Process)"
      ]
    },
    {
      phase: "Phase 5: Document and Improve",
      actions: [
        "Generate Incident Report (or Update Security Policies)"
      ]
    }
  ];

  const totalActions = requiredActions.reduce((sum, phase) => sum + phase.actions.length, 0);
  const progress = Math.round((actionsTaken / totalActions) * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="hints-button"
        >
          <Lightbulb className="w-4 h-4" />
          Show Hints
          {actionsTaken > 0 && (
            <Badge variant="secondary" className="ml-1">
              {actionsTaken}/12
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Incident Response Action Guide
          </DialogTitle>
          <DialogDescription>
            Complete these 12 actions to achieve 100% workflow completion
          </DialogDescription>
        </DialogHeader>

        {/* Progress Summary */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-mono">{actionsTaken} / {totalActions} actions</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progress}% complete
          </p>
        </div>

        {/* Action Checklist */}
        <div className="space-y-4 mt-4">
          {requiredActions.map((phaseGroup, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                {phaseGroup.phase}
              </h4>
              <div className="space-y-2 pl-4">
                {phaseGroup.actions.map((action, actionIdx) => (
                  <div
                    key={actionIdx}
                    className="flex items-start gap-2 p-2 rounded bg-muted/50"
                  >
                    <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-sm mb-2">💡 Pro Tips:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Actions in parentheses are alternative choices - pick one</li>
            <li>• Watch the left panel update as you progress through phases</li>
            <li>• The AI Assistant shows available actions for your current phase</li>
            <li>• Some actions appear in multiple phases - take them when available</li>
            <li>• Completion percentage updates in the Session Progress section</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setOpen(false)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
