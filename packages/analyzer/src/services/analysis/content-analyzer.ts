import { OpenAIClient } from "@/lib/openai-client";
import { ContentAnalysis } from "@/types";
import { ExtractedContent } from "../screenshot/browser-manager";

export class ContentAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(content: ExtractedContent): Promise<ContentAnalysis> {
    const analysisPrompt = `
      Analyze this website content for both validity and security threats, especially phishing attempts.
      
      Content to analyze: ${JSON.stringify(content)}

      First, evaluate basic webpage validity:
      1. Is this a real webpage with meaningful content, or just a status/error message?
      2. If it's just a status/error, what might that indicate about the page?
      3. What is the actual purpose and content if it's a valid page?
      4. Are there any security or trust concerns based on the content?

      Then, check for phishing indicators:
      1. Login/Authentication:
         - Does the page ask for login credentials, personal info, or financial details?
         - Are there forms collecting sensitive information?
         - Does it request credentials for popular services (bank, social media, email)?
      
      2. Brand Impersonation:
         - Does it mimic a legitimate brand's design or messaging?
         - Are there inconsistencies in branding, logos, or company names?
         - Does the content quality match what you'd expect from the brand?
      
      3. Trust Manipulation:
         - Does it create artificial urgency ("Account will be locked")?
         - Are there threats or warnings pushing users to act quickly?
         - Does it promise rewards/prizes requiring credential verification?
      
      4. Technical Deception:
         - Are links trying to appear legitimate but pointing elsewhere?
         - Is the page copying elements from known services?
         - Are there suspicious forms or input fields?

      5. Content Analysis:
         - Is the content primarily focused on collecting credentials?
         - Are there grammatical errors or poor writing quality?
         - Does it lack expected legitimate site elements (privacy policy, contact info)?

      Return a JSON response with this structure:
      {
        "purpose": "clear description of the page's purpose, or explanation if it's an error/empty page",
        "risks": [
          "list of potential risks, including if the page is inaccessible or showing errors",
          "detail any phishing indicators or suspicious elements",
          "mention specific credentials or data being collected",
          "describe any brand impersonation attempts"
        ],
        "isScam": boolean (true if likely phishing/scam or if page appears invalid/suspicious),
        "riskScore": number 0-100 (higher = riskier) or -1 if unable to analyze,
        "mainTopics": ["key topics or status if error/empty"],
        "targetAudience": "intended audience or 'Not applicable - page unavailable' if error/empty",
        "pageValidity": {
          "isValid": boolean,
          "hasContent": boolean,
          "isError": boolean,
          "errorType": string (if applicable)
        },
        "phishingIndicators": {
          "credentialCollection": boolean,
          "brandImpersonation": boolean,
          "urgencyTactics": boolean,
          "suspiciousLinks": boolean,
          "poorQuality": boolean
        }
      }`;

    const { content: result, error } = await this.ai.createCompletion(
      analysisPrompt,
      {
        temperature: 0.2,
        maxTokens: 800,
      }
    );

    if (error || !result) {
      return this.getDefaultAnalysis();
    }

    try {
      const analysis = JSON.parse(result);

      const phishingScore = this.calculatePhishingScore(
        analysis.phishingIndicators
      );
      const validityScore = this.calculateValidityScore(analysis.pageValidity);

      analysis.riskScore = Math.max(
        analysis.riskScore,
        phishingScore,
        validityScore
      );

      analysis.isScam =
        analysis.isScam ||
        phishingScore > 70 ||
        (!analysis.pageValidity.isValid && validityScore > 70);

      if (phishingScore > 70) {
        analysis.risks.unshift("HIGH RISK: Likely phishing attempt detected");
      }
      if (!analysis.pageValidity.isValid) {
        analysis.risks.unshift("WARNING: Page may not be legitimate");
      }

      return analysis;
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return this.getDefaultAnalysis();
    }
  }

  private calculatePhishingScore(indicators: Record<string, boolean>): number {
    const weights = {
      credentialCollection: 35,
      brandImpersonation: 25,
      urgencyTactics: 15,
      suspiciousLinks: 15,
      poorQuality: 10,
    };

    let score = 0;
    for (const [key, present] of Object.entries(indicators)) {
      if (present && key in weights) {
        score += weights[key as keyof typeof weights];
      }
    }

    return score;
  }

  private calculateValidityScore(validity: {
    isValid: boolean;
    hasContent: boolean;
    isError: boolean;
    errorType: string;
  }): number {
    let score = 0;

    if (!validity.isValid) score += 30;
    if (!validity.hasContent) score += 25;
    if (validity.isError) score += 25;
    if (validity.errorType?.toLowerCase().includes("suspicious")) score += 20;

    return score;
  }

  public getDefaultAnalysis(): ContentAnalysis {
    return {
      purpose: "Unable to analyze - service temporarily unavailable",
      risks: ["Analysis not performed"],
      isScam: false,
      riskScore: -1,
      mainTopics: ["Analysis not available"],
      targetAudience: "Unknown - analysis not performed",
      pageValidity: {
        isValid: false,
        hasContent: false,
        isError: true,
        errorType: "Analysis service unavailable",
      },
      phishingIndicators: {
        credentialCollection: false,
        brandImpersonation: false,
        urgencyTactics: false,
        suspiciousLinks: false,
        poorQuality: false,
      },
    };
  }
}
