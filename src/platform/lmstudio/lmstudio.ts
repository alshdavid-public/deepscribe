export type LMStudioConnectionOptions = {
  address: string;
  customHeaders?: Record<string, string | undefined>;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
};

export type CompletionOptions = {
  model?: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
};

export type Model = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export class LMStudioConnection {
  private address: string;
  private customHeaders: Record<string, string | undefined>;

  constructor(options: LMStudioConnectionOptions) {
    this.address = options.address.replace(/\/$/, ""); // Remove trailing slash
    this.customHeaders = options.customHeaders || {};
  }

  /**
   * Simple streaming chat method that yields text chunks
   */
  async *send(message: string): AsyncIterable<string> {
    const messages: ChatMessage[] = [{ role: "user", content: message }];

    yield* this.streamChatCompletion({
      messages,
      stream: true,
    });
  }

  /**
   * List available models
   */
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${this.address}/v1/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.customHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Create a chat completion (non-streaming)
   */
  async createChatCompletion(options: ChatCompletionOptions): Promise<string> {
    const response = await fetch(`${this.address}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.customHeaders,
      },
      body: JSON.stringify({
        model: options.model || "local-model",
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat completion failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Create a streaming chat completion
   */
  async *streamChatCompletion(
    options: ChatCompletionOptions,
  ): AsyncIterableIterator<string> {
    const response = await fetch(`${this.address}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.customHeaders,
      },
      body: JSON.stringify({
        model: options.model || "local-model",
        messages: options.messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Streaming chat completion failed: ${response.statusText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Create a text completion (non-streaming)
   */
  async createCompletion(options: CompletionOptions): Promise<string> {
    const response = await fetch(`${this.address}/v1/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.customHeaders,
      },
      body: JSON.stringify({
        model: options.model || "local-model",
        prompt: options.prompt,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Completion failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.text || "";
  }

  /**
   * Create a streaming text completion
   */
  async *streamCompletion(options: CompletionOptions): AsyncIterable<string> {
    const response = await fetch(`${this.address}/v1/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.customHeaders,
      },
      body: JSON.stringify({
        model: options.model || "local-model",
        prompt: options.prompt,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Streaming completion failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const text = json.choices[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Example usage:
// const client = new LMStudioConnection({ address: 'http://localhost:1234' });
//
// // Simple streaming
// for await (const chunk of client.send('Hello!')) {
//   console.log(chunk);
// }
//
// // Chat completion
// const response = await client.createChatCompletion({
//   messages: [
//     { role: 'system', content: 'You are a helpful assistant.' },
//     { role: 'user', content: 'What is TypeScript?' }
//   ],
//   temperature: 0.7
// });
//
// // List models
// const models = await client.getModels();
