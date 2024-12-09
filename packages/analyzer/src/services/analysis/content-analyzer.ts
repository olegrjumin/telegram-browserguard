import { OpenAIClient } from "@/lib/openai-client";
import { ContentAnalysis } from "@/types";
import { ExtractedContent } from "../screenshot/browser-manager";

export class ContentAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(content: ExtractedContent): Promise<ContentAnalysis> {
    const analysisPrompt = `
      Analyze the following website content and determine if it's a valid page with meaningful content.
      Consider that some pages might be showing only status codes, errors, or be essentially empty.
      
      Content: ${JSON.stringify(content)}

      Consider:
      1. Is this a real webpage with meaningful content, or just a status/error message?
      2. If it's just a status/error, what might that indicate about the page?
      3. What is the actual purpose and content if it's a valid page?
      4. Are there any security or trust concerns based on the content?

      Return a JSON response with this structure:
      {
        "purpose": "clear description of the page's purpose, or explanation if it's an error/empty page",
        "risks": ["list of potential risks, including if the page is inaccessible or showing errors"],
        "isScam": boolean indicating if suspicious (consider empty/error pages suspicious),
        "riskScore": number 0-100 (higher = riskier) or -1 if unable to analyze,
        "mainTopics": ["key topics or status if error/empty"],
        "targetAudience": "intended audience or 'Not applicable - page unavailable' if error/empty"
      }`;

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
