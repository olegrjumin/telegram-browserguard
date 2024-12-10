import { OpenAIClient } from "@/lib/openai-client";
import { ContentAnalysis } from "@/types";
import { ExtractedContent } from "../screenshot/browser-manager";

export class ContentAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(content: ExtractedContent): Promise<ContentAnalysis> {
    const analysisPrompt = `
      Analyze this website content for both security risks AND legitimacy signals.
      
      Content to analyze: ${JSON.stringify(content)}

      First, check for positive trust signals:
      1. Brand Authenticity:
         - Is this a well-known legitimate website/brand?
         - Does the content quality match professional standards?
         - Are proper legal pages (privacy policy, terms) present?
      
      2. Content Quality:
         - Is the content professionally written and error-free?
         - Does it provide clear value to users?
         - Is navigation clear and purposeful?

      3. Technical Trust Signals:
         - Are links pointing to legitimate related content?
         - Is there a proper site structure?
         - Are there professional features (search, help, contact)?

      Then, evaluate potential risks:
      1. Login/Authentication:
         - If present, are credential requests appropriate for the service?
         - Are security measures (2FA, secure forms) implemented?
      
      2. Content Analysis:
         - Is information collection justified by the service?
         - Is there transparency about data usage?
         - Are there unexpected elements for this type of site?

      3. Security Concerns:
         - Are there deceptive elements or urgent prompts?
         - Is sensitive information handled appropriately?
         - Are there unexpected redirects or popups?

      Return a JSON response with this structure:
      {
        "purpose": "clear description of the page's purpose",
        "risks": ["list of potential risks, if any"],
        "isScam": boolean,
        "riskScore": number 0-100 (higher = riskier) or -1 if unable to analyze,
        "mainTopics": ["key topics"],
        "targetAudience": "intended audience",
        "trustSignals": {
          "isMajorBrand": boolean,
          "hasProperLegal": boolean,
          "professionalContent": boolean,
          "properNavigation": boolean,
          "appropriateSecurity": boolean
        },
        "riskFactors": {
          "credentialRequests": boolean,
          "dataCollection": boolean,
          "urgencyTactics": boolean,
          "suspiciousElements": boolean,
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

      // Calculate trust score (0-100, higher is more trustworthy)
      const trustScore = this.calculateTrustScore(analysis.trustSignals);
      // Calculate risk score (0-100, higher is riskier)
      const riskScore = this.calculateRiskScore(analysis.riskFactors);

      // Final risk score is weighted inverse of trust score and direct risk score
      analysis.riskScore = Math.round(
        riskScore * 0.4 + (100 - trustScore) * 0.6
      );

      // Adjust for major brands
      if (analysis.trustSignals.isMajorBrand && trustScore > 80) {
        analysis.riskScore = Math.min(analysis.riskScore, 20);
      }

      // Set scam flag based on combined factors
      analysis.isScam =
        analysis.riskScore > 70 &&
        !analysis.trustSignals.isMajorBrand &&
        (analysis.riskFactors.suspiciousElements ||
          analysis.riskFactors.urgencyTactics);

      return analysis;
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return this.getDefaultAnalysis();
    }
  }

  private calculateTrustScore(signals: Record<string, boolean>): number {
    const weights = {
      isMajorBrand: 35,
      hasProperLegal: 20,
      professionalContent: 20,
      properNavigation: 15,
      appropriateSecurity: 10,
    };

    let score = 0;
    for (const [key, present] of Object.entries(signals)) {
      if (present && key in weights) {
        score += weights[key as keyof typeof weights];
      }
    }

    return score;
  }

  private calculateRiskScore(factors: Record<string, boolean>): number {
    const weights = {
      credentialRequests: 15, // Reduced from 35 as legitimate sites often need login
      dataCollection: 15, // Reduced as legitimate sites collect data too
      urgencyTactics: 25, // Increased as this is a stronger spam signal
      suspiciousElements: 25, // Increased as this is a stronger spam signal
      poorQuality: 20,
    };

    let score = 0;
    for (const [key, present] of Object.entries(factors)) {
      if (present && key in weights) {
        score += weights[key as keyof typeof weights];
      }
    }

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
      trustSignals: {
        isMajorBrand: false,
        hasProperLegal: false,
        professionalContent: false,
        properNavigation: false,
        appropriateSecurity: false,
      },
      riskFactors: {
        credentialRequests: false,
        dataCollection: false,
        urgencyTactics: false,
        suspiciousElements: false,
        poorQuality: false,
      },
    };
  }
}
