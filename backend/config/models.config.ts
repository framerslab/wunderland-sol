// File: backend/config/models.config.ts
/**
 * @file Centralized model configuration for LLM preferences and pricing.
 * @description Loads model preferences from environment variables (stripping comments)
 * and defines pricing information for cost calculation.
 * @version 1.2.2 - Added specific model preference for lc_audit_aide.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded from project root to make these variables available
const __filename = fileURLToPath(import.meta.url); // backend/config/models.config.ts
const __projectRoot = path.resolve(path.dirname(__filename), '../..'); // up to project root
dotenv.config({ path: path.join(__projectRoot, '.env') });

/**
 * @function getModelIdFromEnv
 * @description Helper function to get an environment variable value intended for a model ID,
 * stripping any trailing comments starting with '#'.
 * @param {string | undefined} envVarValue - The raw value from process.env.
 * @param {string} defaultValue - A fallback value if the envVar is not set or results in an empty string after stripping.
 * @returns {string} The cleaned model ID or the default value.
 */
function getModelIdFromEnv(envVarValue: string | undefined, defaultValue: string): string {
  if (typeof envVarValue === 'string' && envVarValue.trim() !== '') {
    const valueWithoutComment = envVarValue.split('#')[0].trim();
    if (valueWithoutComment.length > 0) {
      return valueWithoutComment;
    }
  }
  return defaultValue;
}

/**
 * @interface ModelConfig
 * @description Defines the structure for model pricing information.
 */
export interface ModelConfig {
  inputCostPer1K: number;
  outputCostPer1K: number;
  displayName?: string;
  provider?: string;
}

/**
 * @constant MODEL_PRICING
 * @description A map holding pricing information for various models.
 */
// Pricing verified against openai.com/api/pricing, anthropic.com/pricing,
// and openrouter.ai/models on 2026-04-16. Costs are per 1K tokens.
export const MODEL_PRICING: Record<string, ModelConfig> = {
  // OpenAI: GPT-5.4 family (current flagship + mini + nano)
  'gpt-5.4': { inputCostPer1K: 0.0025, outputCostPer1K: 0.015, displayName: 'GPT-5.4', provider: 'openai' },
  'gpt-5.4-mini': { inputCostPer1K: 0.00075, outputCostPer1K: 0.0045, displayName: 'GPT-5.4 Mini', provider: 'openai' },
  'gpt-5.4-nano': { inputCostPer1K: 0.0002, outputCostPer1K: 0.00125, displayName: 'GPT-5.4 Nano', provider: 'openai' },
  'gpt-5.4-pro': { inputCostPer1K: 0.030, outputCostPer1K: 0.180, displayName: 'GPT-5.4 Pro', provider: 'openai' },
  // OpenAI: GPT-4.1 family (legacy but still referenced)
  'gpt-4.1': { inputCostPer1K: 0.002, outputCostPer1K: 0.008, displayName: 'GPT-4.1', provider: 'openai' },
  'gpt-4.1-mini': { inputCostPer1K: 0.0004, outputCostPer1K: 0.0016, displayName: 'GPT-4.1 Mini', provider: 'openai' },
  'gpt-4.1-nano': { inputCostPer1K: 0.0001, outputCostPer1K: 0.0004, displayName: 'GPT-4.1 Nano', provider: 'openai' },
  // OpenAI: GPT-4o family (repriced to current $2.50/$10 per 1M; old 5/15 entry was stale)
  'gpt-4o-mini': { inputCostPer1K: 0.00015, outputCostPer1K: 0.00060, displayName: 'GPT-4o Mini', provider: 'openai' },
  'gpt-4o': { inputCostPer1K: 0.0025, outputCostPer1K: 0.010, displayName: 'GPT-4o', provider: 'openai' },
  // Legacy OpenAI
  'gpt-4-turbo': { inputCostPer1K: 0.01, outputCostPer1K: 0.03, displayName: 'GPT-4 Turbo', provider: 'openai' },
  'gpt-3.5-turbo': { inputCostPer1K: 0.0005, outputCostPer1K: 0.0015, displayName: 'GPT-3.5 Turbo', provider: 'openai' },
  'gpt-3.5-turbo-16k': { inputCostPer1K: 0.003, outputCostPer1K: 0.004, displayName: 'GPT-3.5 Turbo 16k', provider: 'openai' },
  'text-embedding-3-small': { inputCostPer1K: 0.00002, outputCostPer1K: 0, displayName: 'Text Embedding 3 Small', provider: 'openai'},
  'text-embedding-3-large': { inputCostPer1K: 0.00013, outputCostPer1K: 0, displayName: 'Text Embedding 3 Large', provider: 'openai'},

  // Anthropic (direct)
  'claude-opus-4-7': { inputCostPer1K: 0.005, outputCostPer1K: 0.025, displayName: 'Claude Opus 4.7', provider: 'openrouter' },
  'claude-sonnet-4-6': { inputCostPer1K: 0.003, outputCostPer1K: 0.015, displayName: 'Claude Sonnet 4.6', provider: 'openrouter' },
  'claude-haiku-4-5-20251001': { inputCostPer1K: 0.001, outputCostPer1K: 0.005, displayName: 'Claude Haiku 4.5', provider: 'openrouter' },

  // OpenRouter Models
  'openai/gpt-5.4': { inputCostPer1K: 0.0025, outputCostPer1K: 0.015, displayName: 'OpenRouter: GPT-5.4', provider: 'openrouter' },
  'openai/gpt-5.4-mini': { inputCostPer1K: 0.00075, outputCostPer1K: 0.0045, displayName: 'OpenRouter: GPT-5.4 Mini', provider: 'openrouter' },
  'openai/gpt-4o-mini': { inputCostPer1K: 0.00015, outputCostPer1K: 0.00060, displayName: 'OpenRouter: GPT-4o Mini', provider: 'openrouter' },
  'openai/gpt-4o': { inputCostPer1K: 0.0025, outputCostPer1K: 0.010, displayName: 'OpenRouter: GPT-4o', provider: 'openrouter' },
  'openai/gpt-4-turbo': { inputCostPer1K: 0.01, outputCostPer1K: 0.03, displayName: 'OpenRouter: GPT-4 Turbo', provider: 'openrouter' },
  'openai/gpt-3.5-turbo': { inputCostPer1K: 0.0005, outputCostPer1K: 0.0015, displayName: 'OpenRouter: GPT-3.5 Turbo', provider: 'openrouter' },
  'anthropic/claude-opus-4-7': { inputCostPer1K: 0.005, outputCostPer1K: 0.025, displayName: 'OpenRouter: Claude Opus 4.7', provider: 'openrouter' },
  'anthropic/claude-sonnet-4-6': { inputCostPer1K: 0.003, outputCostPer1K: 0.015, displayName: 'OpenRouter: Claude Sonnet 4.6', provider: 'openrouter' },
  'anthropic/claude-haiku-4-5': { inputCostPer1K: 0.001, outputCostPer1K: 0.005, displayName: 'OpenRouter: Claude Haiku 4.5', provider: 'openrouter' },
  // Legacy Claude 3 still referenced by older tests/configs
  'anthropic/claude-3-haiku-20240307': { inputCostPer1K: 0.00025, outputCostPer1K: 0.00125, displayName: 'OpenRouter: Claude 3 Haiku', provider: 'openrouter' },
  'anthropic/claude-3-sonnet-20240229': { inputCostPer1K: 0.003, outputCostPer1K: 0.015, displayName: 'OpenRouter: Claude 3 Sonnet', provider: 'openrouter' },
  'anthropic/claude-3-opus-20240229': { inputCostPer1K: 0.015, outputCostPer1K: 0.075, displayName: 'OpenRouter: Claude 3 Opus', provider: 'openrouter' },
  'google/gemini-pro': { inputCostPer1K: 0.000125, outputCostPer1K: 0.000375, displayName: 'OpenRouter: Gemini Pro', provider: 'openrouter' },

  // Ollama Models
  'llama3': { inputCostPer1K: 0, outputCostPer1K: 0, displayName: 'Llama 3 (Ollama)', provider: 'ollama' },
  'codellama:13b': { inputCostPer1K: 0, outputCostPer1K: 0, displayName: 'CodeLlama 13B (Ollama)', provider: 'ollama' },

  'default': { inputCostPer1K: 0.0005, outputCostPer1K: 0.0015, displayName: 'Default Fallback Model Pricing' },
};

/**
 * Retrieves the pricing configuration for a given model ID.
 * @param {string} modelId - The model identifier.
 * @returns {ModelConfig} The pricing configuration or the default if not found.
 */
export function getModelPrice(modelId: string): ModelConfig {
  if (MODEL_PRICING[modelId]) {
    return MODEL_PRICING[modelId];
  }
  const parts = modelId.split('/');
  if (parts.length > 1) {
    const genericModelId = parts.slice(1).join('/');
    if (MODEL_PRICING[genericModelId]) {
      return MODEL_PRICING[genericModelId];
    }
  }
  console.warn(`[models.config.ts] getModelPrice: Pricing not found for model "${modelId}". Using default pricing.`);
  return MODEL_PRICING['default'];
}

/**
 * @constant MODEL_PREFERENCES
 * @description Preferred models for different application modes, loaded from environment variables
 * with comments stripped and sensible fallbacks.
 */
export const MODEL_PREFERENCES = {
  general: getModelIdFromEnv(process.env.MODEL_PREF_GENERAL_CHAT, 'openai/gpt-4o-mini'),
  coding: getModelIdFromEnv(process.env.MODEL_PREF_CODING, 'openai/gpt-4o'),
  system_design: getModelIdFromEnv(process.env.MODEL_PREF_SYSTEM_DESIGN, 'openai/gpt-4o'),
  meeting_summary: getModelIdFromEnv(process.env.MODEL_PREF_SUMMARIZATION, 'openai/gpt-4o-mini'),
  rag_synthesis: getModelIdFromEnv(process.env.MODEL_PREF_RAG_SYNTHESIS, 'openai/gpt-4o-mini'),
  self_reflection: getModelIdFromEnv(process.env.MODEL_PREF_SELF_REFLECTION, 'openai/gpt-4o-mini'),
  summarization: getModelIdFromEnv(process.env.MODEL_PREF_SUMMARIZATION, 'openai/gpt-4o-mini'),
  default_embedding: getModelIdFromEnv(process.env.MODEL_PREF_DEFAULT_EMBEDDING, 'openai/text-embedding-3-small'),
  interview_tutor: getModelIdFromEnv(process.env.MODEL_PREF_INTERVIEW_TUTOR, 'openai/gpt-4o'), // For coding_interviewer if mapped
  coding_tutor: getModelIdFromEnv(process.env.MODEL_PREF_CODING_TUTOR, 'openai/gpt-4o-mini'),
  utility: getModelIdFromEnv(process.env.UTILITY_LLM_MODEL_ID, 'openai/gpt-4o-mini'), // Aggregator model
  default: getModelIdFromEnv(process.env.ROUTING_LLM_MODEL_ID, 'openai/gpt-4o-mini'), // General fallback

  // Agent-specific overrides (keys should match agent.systemPromptKey or agent.id)
  diary: getModelIdFromEnv(process.env.MODEL_PREF_DIARY, 'openai/gpt-4o-mini'), // Retain -mini for diary unless specified
  lc_audit_aide: getModelIdFromEnv(process.env.MODEL_PREF_LC_AUDIT, 'openai/gpt-4o'), // **Enforce gpt-4o**
  coding_interviewer: getModelIdFromEnv(process.env.MODEL_PREF_CODING_INTERVIEWER, 'openai/gpt-4o'), // **Enforce gpt-4o**
};

console.log("[models.config.ts] Loaded MODEL_PREFERENCES (env vars processed):", JSON.stringify(MODEL_PREFERENCES, null, 2));
console.log(`[models.config.ts] Effective UTILITY_LLM_MODEL_ID: '${MODEL_PREFERENCES.utility}' (from env: '${process.env.UTILITY_LLM_MODEL_ID}')`);
