export class LLMService {
  private readonly apiKey:
    | string =
    process.env.RAG_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "";
  private readonly apiUrl = "https://openrouter.ai/api/v1";
  private readonly model:
    | string =
    process.env.RAG_OPENROUTER_LLM_MODEL ??
    process.env.OPENROUTER_LLM_MODEL ??
    "nvidia/nemotron-3-super-120b-a12b:free";

  async generateResponse(
    prompt: string,
    context: string[] = [],
    asJson = false,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is missing. Set RAG_OPENROUTER_API_KEY or OPENROUTER_API_KEY.",
      );
    }

    let fullPrompt =
      context.length > 0
        ? `Context information:\n${context.join("\n\n")}\n\nQuestion: ${prompt}\n\nAnswer based on the context above.`
        : prompt;

    if (asJson) {
      fullPrompt +=
        "\n\nReturn ONLY valid JSON with this shape: {\"recommendations\":[{\"name\":\"Tutor Name\",\"reason\":\"Why they fit\",\"matchedCategories\":[\"Category\"],\"strengths\":[\"Strength\"]}],\"summary\":\"Short summary\"}. Do not include markdown fences.";
    }

    const systemMessage = asJson
      ? "You are a helpful assistant for a tutoring marketplace. Answer using only the provided tutor profile context. Return only valid JSON."
      : "You are a helpful assistant for a tutoring marketplace. Answer using only the provided tutor profile context. If the context does not contain enough information, say so clearly.";

    const bodyPayload: Record<string, unknown> = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    };

    if (asJson && (this.model.includes("gpt") || this.model.includes("openai"))) {
      bodyPayload.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://skillbridge.local",
        "X-Title": "SkillBridge Tutor RAG",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const errorMessage = errorData?.error?.message ?? "unknown error";

      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorMessage}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter did not return a completion");
    }

    return content;
  }
}