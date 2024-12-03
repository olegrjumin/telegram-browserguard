import OpenAI from "openai";

interface OpenAIConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface QueryOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIClient {
  private client: OpenAI;
  private config: Required<OpenAIConfig>;

  constructor(apiKey: string, config: OpenAIConfig = {}) {
    this.client = new OpenAI({ apiKey });
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 10000,
    };
  }

  private async delay(attempt: number): Promise<void> {
    const delayMs = Math.min(
      this.config.maxDelay,
      this.config.baseDelay * Math.pow(2, attempt)
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  public async createCompletion(
    prompt: string,
    options: QueryOptions = {}
  ): Promise<{
    content: string | null;
    error?: string;
  }> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: options.model || "gpt-3.5-turbo",
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 300,
        });

        return { content: completion.choices[0]?.message?.content || null };
      } catch (error) {
        if (error instanceof Error) {
          const openAIError = error as any;

          if (openAIError.code === "insufficient_quota") {
            return { content: null, error: "API quota exceeded" };
          }

          if (openAIError.status === 429) {
            if (attempt === this.config.maxRetries - 1) {
              return { content: null, error: "Rate limit exceeded" };
            }
            await this.delay(attempt);
            continue;
          }
        }
        throw error;
      }
    }
    return { content: null, error: "Max retries reached" };
  }
}
