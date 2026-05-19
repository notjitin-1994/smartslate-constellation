import { generateObject as sdkGenerateObject, generateText as sdkGenerateText, embed as sdkEmbed, embedMany as sdkEmbedMany } from 'ai';
import { google } from '@/lib/google';
import { withRetry } from '@/lib/retry';
import type { LlmPort, GenerateObjectParams, GenerateTextParams, EmbedParams, EmbedManyParams } from '@/ports/LlmPort';

export class GeminiLlmAdapter implements LlmPort {
  async generateObject<T>(params: GenerateObjectParams<T>): Promise<T> {
    const { object } = await withRetry(() =>
      sdkGenerateObject({
        model: google(params.model),
        schema: params.schema,
        system: params.system,
        prompt: params.prompt,
        temperature: params.temperature,
      })
    );
    return object;
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    const { text } = await withRetry(() =>
      sdkGenerateText({
        model: google(params.model),
        system: params.system,
        prompt: params.prompt,
        temperature: params.temperature,
      })
    );
    return text;
  }

  async embed(params: EmbedParams): Promise<number[]> {
    const { embedding } = await withRetry(() =>
      sdkEmbed({
        model: google.textEmbeddingModel(params.model),
        value: params.value,
        providerOptions: params.outputDimensionality
          ? { google: { outputDimensionality: params.outputDimensionality } }
          : undefined,
      })
    );
    return embedding;
  }

  async embedMany(params: EmbedManyParams): Promise<number[][]> {
    const { embeddings } = await withRetry(() =>
      sdkEmbedMany({
        model: google.textEmbeddingModel(params.model),
        values: params.values,
        providerOptions: params.outputDimensionality
          ? { google: { outputDimensionality: params.outputDimensionality } }
          : undefined,
      })
    );
    return embeddings;
  }
}

export const geminiLlmAdapter = new GeminiLlmAdapter();
