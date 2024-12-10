import { OpenAIClient } from "@/lib/openai-client";
import { ContentAnalysis } from "@/types";
import { ExtractedContent } from "../screenshot/browser-manager";

export class ContentAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(content: ExtractedContent): Promise<ContentAnalysis> {
    const analysisPrompt = `Analyze the following website content for security risks and legitimacy:

    Input: ${JSON.stringify({
      title: content.title,
      description: content.metaDescription,
      mainText: content.mainContent.substring(0, 500),
      totalLinks: content.links.length,
      linkExamples: content.links.slice(0, 5),
    })}
    
    Evaluate for:
    - Brand legitimacy & professionalism
    - Content quality & value
    - Technical trust indicators
    - Authentication & data handling
    - Deceptive elements or urgent prompts
    - Site structure & navigation
    - Security measures
    
    Return JSON:
    {
      "purpose": "clear page purpose (1 sentence)",
      "risks": ["key risks"],
      "isScam": boolean,
      "riskScore": 0-100 (higher=riskier) or -1 if unable to analyze,
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

      const trustScore = this.calculateTrustScore(analysis.trustSignals);
      const riskScore = this.calculateRiskScore(analysis.riskFactors);

      analysis.riskScore = Math.round(
        riskScore * 0.4 + (100 - trustScore) * 0.6
      );

      if (analysis.trustSignals.isMajorBrand && trustScore > 80) {
        analysis.riskScore = Math.min(analysis.riskScore, 20);
      }

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
      credentialRequests: 15,
      dataCollection: 15,
      urgencyTactics: 25,
      suspiciousElements: 25,
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
