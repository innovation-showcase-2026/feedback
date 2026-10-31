import { Groq } from 'groq-sdk';

// Groq / Grok AI configuration
export const groqConfig = {
  apiKey: "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",
  defaultModel: "openai/gpt-oss-120b",
  fallbackModel: "llama-3.3-70b-versatile",
};

export const GROQ_API_KEY = groqConfig.apiKey;

// Initialize Groq client instance
export const groqClient = new Groq({
  apiKey: groqConfig.apiKey,
  dangerouslyAllowBrowser: true,
});
