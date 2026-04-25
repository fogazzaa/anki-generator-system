// Centraliza chamadas ao Gemini com fila, limites e retry.
import PQueue from "p-queue";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { countTokens } from "../tokenizer/countTokens.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Limites (via .env): RPM, TPM, RPD e input max por request.
class RateLimiter {
  constructor() {
    this.requestTimestamps = [];
    this.tokenTimestamps = [];
    this.rpmLimit = Number(process.env.GEMINIRPMLIMIT ?? 10);
    this.tpmLimit = Number(process.env.GEMINITPMLIMIT ?? 2000000);
  }

  prune(now) {
    this.requestTimestamps = this.requestTimestamps.filter((ts) => now - ts <= 60000);
    this.tokenTimestamps = this.tokenTimestamps.filter((entry) => now - entry.ts <= 60000);
  }

  async waitIfNeeded(estimatedTokens) {
    while (true) {
      const now = Date.now();
      this.prune(now);

      if (this.requestTimestamps.length >= this.rpmLimit) {
        const waitMs = 60000 - (now - this.requestTimestamps[0]) + 100;
        await sleep(Math.max(waitMs, 0));
        continue;
      }

      const tokenSum = this.tokenTimestamps.reduce((sum, entry) => sum + entry.tokens, 0);
      if (tokenSum + estimatedTokens >= this.tpmLimit && this.tokenTimestamps.length > 0) {
        const waitMs = 60000 - (now - this.tokenTimestamps[0].ts) + 100;
        await sleep(Math.max(waitMs, 0));
        continue;
      }

      const ts = Date.now();
      this.requestTimestamps.push(ts);
      this.tokenTimestamps.push({ ts, tokens: estimatedTokens });
      return;
    }
  }
}

const rateLimiter = new RateLimiter();
const apiConcurrency = Number(process.env.APICONCURRENCY ?? 3);
const apiCooldownMs = Number(process.env.APICOOLDOWNMS ?? 3000);
export const apiQueue = new PQueue({ concurrency: apiConcurrency });

function isRateLimitError(error) {
  const status = error?.status ?? error?.response?.status;
  const message = String(error?.message ?? "").toLowerCase();
  return status === 429 || message.includes("quota") || message.includes("rate");
}

async function retryWithBackoff(fn, maxAttempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error)) {
        throw error;
      }
      const delay = 2 ** attempt * 1000;
      console.log(`[API] rate limit atingido. Aguardando ${delay}ms antes da tentativa ${attempt + 1}...`);
      await sleep(delay);
    }
  }
  throw new Error(`[API] Falha apos ${maxAttempts} tentativas: ${lastError?.message ?? "erro desconhecido"}`);
}

export async function callGemini(promptText) {
  const estimatedTokens = countTokens(promptText);
  await rateLimiter.waitIfNeeded(estimatedTokens);

  return apiQueue.add(async () => {
    const genAi = new GoogleGenerativeAI(process.env.GEMINIKEY);
    const model = genAi.getGenerativeModel({
      model: process.env.GEMINIMODEL,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await retryWithBackoff(async (attempt) => {
      console.log(`[API] request enviado. Tokens estimados: ${estimatedTokens}. Tentativa: ${attempt}`);
      return model.generateContent(promptText);
    });

    await sleep(apiCooldownMs);
    return response.response.text();
  });
}
