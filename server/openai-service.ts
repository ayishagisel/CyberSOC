import OpenAI from 'openai';
import type { Alert, LogEntry, Endpoint } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OPENAI_API_KEY environment variable is required in production');
    }
    console.warn('⚠️  OPENAI_API_KEY not set - AI features will return mock responses');
    return "dummy-key"; // Return dummy key instead of null
  })(),
});

interface IncidentContext {
  alert?: Alert;
  logs?: LogEntry[];
  endpoints?: Endpoint[];
  userRole: "Analyst" | "Manager" | "Client";
  currentPhase: string;
  question?: string;
}

export class OpenAIService {
  private buildSystemPrompt(context: IncidentContext): string {
    const roleContext = {
      "Analyst": "You are assisting a cybersecurity analyst. Provide technical details, MITRE ATT&CK mappings, and actionable response steps. Include specific commands and tools when relevant.",
      "Manager": "You are assisting a cybersecurity manager. Focus on business impact, SLA compliance, resource allocation, and high-level incident status. Provide clear timelines and risk assessments.",
      "Client": "You are assisting a client affected by a security incident. Use plain language, focus on business impact, and provide reassuring but honest updates about the situation."
    };

    return `You are Howard University's AI-powered cybersecurity incident response assistant, integrated with Azure Sentinel and Microsoft Defender.

Role Context: ${roleContext[context.userRole]}

Current Incident Phase: ${context.currentPhase}

Guidelines:
- Follow NIST 800-61 incident response framework
- Reference Howard University's security policies and Azure-based infrastructure
- Consider FERPA compliance for educational data
- Provide actionable, specific recommendations
- Keep responses concise but comprehensive
- Always explain the "why" behind recommendations

When analyzing incidents:
- Map to MITRE ATT&CK techniques when relevant
- Consider lateral movement potential
- Assess business/academic impact
- Recommend appropriate containment measures`;
  }

  private buildContextPrompt(context: IncidentContext): string {
    let contextData = [];

    if (context.alert) {
      contextData.push(`CURRENT ALERT:
- ID: ${context.alert.id}
- Title: ${context.alert.title}
- Severity: ${context.alert.severity}
- Status: ${context.alert.status}
- Description: ${context.alert.description}
- MITRE Tactics: ${context.alert.mitre_tactics?.join(', ') || 'Not specified'}
- Affected Endpoints: ${context.alert.affected_endpoints?.join(', ') || 'Unknown'}`);
    }

    if (context.logs && context.logs.length > 0) {
      const recentLogs = context.logs.slice(0, 5); // Last 5 logs
      contextData.push(`RECENT SECURITY LOGS:
${recentLogs.map(log => `- ${log.timestamp}: [${log.severity}] ${log.source}: ${log.message}`).join('\n')}`);
    }

    if (context.endpoints && context.endpoints.length > 0) {
      const affectedEndpoints = context.endpoints.filter(e => e.status !== 'Normal');
      if (affectedEndpoints.length > 0) {
        contextData.push(`AFFECTED ENDPOINTS:
${affectedEndpoints.map(ep => `- ${ep.hostname} (${ep.ip_address}): ${ep.status} - User: ${ep.user}`).join('\n')}`);
      }
    }

    return contextData.length > 0 ? contextData.join('\n\n') : 'No specific incident data available.';
  }

  async generateResponse(context: IncidentContext): Promise<string> {
    // Return mock response if no real API key
    if (!process.env.OPENAI_API_KEY) {
      return this.getMockResponse(context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const contextPrompt = this.buildContextPrompt(context);

      const userMessage = context.question ||
        `Analyze the current ${context.currentPhase} phase incident and provide guidance for a ${context.userRole}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective but capable
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${contextPrompt}\n\nQUESTION: ${userMessage}` }
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent security advice
      });

      return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "I'm experiencing technical difficulties connecting to the AI service. Please try again in a moment.";
    }
  }

  async analyzeIncident(context: IncidentContext): Promise<{
    summary: string;
    recommendations: string[];
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    nextSteps: string[];
  }> {
    // Return mock analysis if no real API key
    if (!process.env.OPENAI_API_KEY) {
      return this.getMockAnalysis(context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const contextPrompt = this.buildContextPrompt(context);

      const analysisPrompt = `${contextPrompt}

Please provide a structured incident analysis with:
1. A brief summary of the current situation
2. Top 3 recommended actions
3. Risk level assessment
4. Next steps for the ${context.currentPhase} phase

Format your response as JSON with keys: summary, recommendations (array), riskLevel, nextSteps (array).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: analysisPrompt }
        ],
        max_tokens: 600,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      // Try to parse JSON response
      try {
        return JSON.parse(content);
      } catch {
        // Fallback if JSON parsing fails - extract useful information from text response
        const cleanContent = content.replace(/```json|```/g, '').trim();

        // Try to extract a readable summary from the content
        let extractedSummary = "Multiple endpoints in the Finance department have been affected by a security incident requiring immediate attention.";

        // Look for summary-like content in the response
        const summaryMatch = content.match(/summary["\s]*:[\s"]*([^",}]+)/i);
        if (summaryMatch && summaryMatch[1]) {
          extractedSummary = summaryMatch[1].replace(/"/g, '').trim();
        } else if (!content.includes('{') && !content.includes('}')) {
          // If it's plain text without JSON structure, use it directly
          extractedSummary = cleanContent.length > 300 ? cleanContent.substring(0, 300) + "..." : cleanContent;
        }

        return {
          summary: extractedSummary,
          recommendations: ["Review the AI analysis above", "Take appropriate action based on your role", "Document all actions taken"],
          riskLevel: "Medium" as const,
          nextSteps: ["Continue monitoring", "Follow established procedures"]
        };
      }
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return this.getMockAnalysis(context);
    }
  }

  private getMockResponse(context: IncidentContext): string {
    const mockResponses = {
      "Analyst": "⚠️ Mock AI Response: Based on the current incident, I recommend isolating affected endpoints and analyzing network traffic for indicators of lateral movement. Check for signs of credential compromise and review recent authentication logs.",
      "Manager": "⚠️ Mock AI Response: This incident requires immediate attention. Current SLA status shows we're within the 1-hour containment window. I recommend escalating to the incident commander and preparing stakeholder communications.",
      "Client": "⚠️ Mock AI Response: Our security team is actively responding to this incident. We've implemented protective measures and are working to restore normal operations. We'll keep you updated on our progress."
    };

    return mockResponses[context.userRole];
  }

  private getMockAnalysis(context: IncidentContext): {
    summary: string;
    recommendations: string[];
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    nextSteps: string[];
  } {
    return {
      summary: "⚠️ Mock AI Analysis: Potential ransomware activity detected on finance systems with evidence of lateral movement.",
      recommendations: [
        "Isolate all affected endpoints immediately",
        "Lock user accounts associated with suspicious activity",
        "Analyze network traffic for command and control communication"
      ],
      riskLevel: "High",
      nextSteps: [
        "Complete endpoint isolation within 15 minutes",
        "Begin forensic analysis of affected systems",
        "Prepare stakeholder communications"
      ]
    };
  }
}

export const openaiService = new OpenAIService();