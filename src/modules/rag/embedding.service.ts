export class EmbeddingService {
  private readonly apiKey:
    | string =
    process.env.RAG_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "";
  private readonly apiUrl = "https://openrouter.ai/api/v1";
  private readonly embeddingModel:
    | string =
    process.env.RAG_OPENROUTER_EMBEDDING_MODEL ??
    process.env.OPENROUTER_EMBEDDING_MODEL ??
    "nvidia/llama-nemotron-embed-vl-1b-v2:free";

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is missing. Set RAG_OPENROUTER_API_KEY or OPENROUTER_API_KEY.",
      );
    }

    const response = await fetch(`${this.apiUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: this.embeddingModel,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const errorMessage = errorData?.error?.message;

      throw new Error(
        `OpenRouter embedding API error: ${response.status}${
          errorMessage ? ` - ${errorMessage}` : ""
        }`,
      );
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: unknown }>;
    };

    const embedding = data.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error("No embedding vector returned from OpenRouter");
    }

    return embedding as number[];
  }
}