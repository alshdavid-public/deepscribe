import { TextField } from "../platform/forms/text-field.ts";
import {
  ChatCompletionOptions,
  LMStudioConnection,
  Model,
} from "../platform/lmstudio/lmstudio.ts";
import { rx } from "../platform/rx/index.ts";

export class LMStudioService extends EventTarget {
  @rx accessor apiKey: TextField;
  @rx accessor apiAddress: TextField;
  @rx accessor selectedModel: TextField;
  @rx accessor models: Array<Model>;
  @rx accessor connected: boolean;
  @rx accessor connecting: boolean;
  client: LMStudioConnection | null;

  constructor() {
    super();
    this.client = null;
    this.selectedModel = new TextField();
    this.apiAddress = new TextField();
    this.apiKey = new TextField();
    this.connected = false;
    this.connecting = false;
    this.models = [];
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  disconnect() {
    this.client = null;
    this.selectedModel = new TextField();
    this.apiAddress = new TextField();
    this.apiKey = new TextField();
    this.connected = false;
    this.connecting = false;
    this.models = [];
  }

  async connect(): Promise<void> {
    if (this.apiAddress.value === "") {
      throw new Error("Missing address");
    }
    this.connected = false;
    this.connecting = true;
    try {
      this.client = new LMStudioConnection({
        address: this.apiAddress.value,
        customHeaders: {
          Authorization: this.apiKey.value
            ? `${this.apiKey.value}`
            : undefined,
        },
      });

      // await new Promise((res) => setTimeout(res, 1000));
      this.models = await this.client.getModels();
      this.models.sort((a, b) =>
        a.id.toLowerCase().localeCompare(b.id.toLowerCase()),
      );
      if (this.models.length) {
        this.selectedModel.value = this.models[0].id;
      }
      this.connected = true;
    } catch (error) {
      this.client = null;
      throw error;
    }
    this.connecting = false;
  }

  async refresh() {
    if (!this.client) {
      throw new Error("Not connected to server");
    }
    this.models = await this.getModels();
  }

  selectModel(modelId: string): void {
    if (!this.client) {
      throw new Error("Not connected to server");
    }
    if (!this.models.find((m) => m.id === modelId)) {
      throw new Error("Model does not exist");
    }
    this.selectedModel.value = modelId;
  }

  getModels(): Array<Model> {
    if (!this.client) {
      throw new Error("Not connected to server");
    }
    return structuredClone(this.models);
  }

  streamChatCompletion({
    model,
    ...options
  }: ChatCompletionOptions): AsyncIterableIterator<string> {
    if (!this.client) {
      throw new Error("Not connected to server");
    }
    return this.client.streamChatCompletion({
      model: model ? model : this.selectedModel.value,
      ...options,
    });
  }
}
