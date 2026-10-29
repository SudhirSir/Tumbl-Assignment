import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  goldRate24k: parseInt(process.env.GOLD_RATE_24K_PER_GRAM || '7000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  llmProvider: process.env.LLM_PROVIDER || 'mock',
};
