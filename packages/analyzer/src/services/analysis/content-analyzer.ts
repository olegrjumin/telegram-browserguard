import { OpenAIClient } from "@/lib/openai-client";
import { ContentAnalysis } from "@/types";
import { ExtractedContent } from "../screenshot/browser-manager";

export class ContentAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(content: ExtractedContent): Promise<ContentAnalysis> {
    const analysisPrompt = `
      Analyze website content and return JSON:
      {
        "purpose": "main site purpose in one sentence",
        "risks": ["list of potential risks or red flags"],
        "isScam": boolean indicating if site seems fraudulent,
        "riskScore": number 0-100 (higher = riskier),
        "mainTopics": ["key topics/themes"],
        "targetAudience": "likely target audience"
      }
      
      Content: ${JSON.stringify(content)}`;

    const { content: result, error } = await this.ai.createCompletion(
      analysisPrompt,
      {
        temperature: 0.2,
        maxTokens: 500,
      }
    );

    if (error || !result) {
      return this.getDefaultAnalysis();
    }

    try {
      return JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return this.getDefaultAnalysis();
    }
  }

  public getDefaultAnalysis(): ContentAnalysis {
    return {
      purpose: "Unable to analyze - service temporarily unavailable",
      risks: ["Analysis not performed"],
      isScam: false,
      riskScore: -1,
      mainTopics: ["Analysis not available"],
      targetAudience: "Unknown - analysis not performed",
    };
  }
}
