import type { z } from 'zod';

export interface GenerateObjectParams<T> {
  model: string;
  schema: z.ZodType<T>;
  system?: string;
  prompt: string;
  temperature?: number;
}

export interface GenerateTextParams {
  model: string;
  system?: string;
  prompt: string;
  temperature?: number;
}

export interface EmbedParams {
  model: string;
  value: string;
  outputDimensionality?: number;
}

export interface EmbedManyParams {
  model: string;
  values: string[];
  outputDimensionality?: number;
}

/**
 * Port: the domain's view of the LLM layer.
 * Implementations hide provider SDK details and retry logic.
 */
export interface LlmPort {
  generateObject<T>(params: GenerateObjectParams<T>): Promise<T>;
  generateText(params: GenerateTextParams): Promise<string>;
  embed(params: EmbedParams): Promise<number[]>;
  embedMany(params: EmbedManyParams): Promise<number[][]>;
}
