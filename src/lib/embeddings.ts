import OpenAI from "openai";
import type { Profile } from "@/types";
import { buildProfileEmbeddingText } from "@/lib/hybridSearch";

export const EMBEDDING_DIMENSIONS = 1536;

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export function padEmbedding(vec: number[]): number[] {
  if (vec.length === EMBEDDING_DIMENSIONS) return vec;
  const out = new Array(EMBEDDING_DIMENSIONS).fill(0);
  for (let i = 0; i < Math.min(vec.length, EMBEDDING_DIMENSIONS); i++) {
    out[i] = vec[i];
  }
  return out;
}

export function parseEmbedding(value: unknown): number[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {
      /* pgvector textual format */
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(",").map((part) => Number(part.trim()));
    }
  }
  return null;
}

export function toVectorLiteral(vec: number[]): string {
  return `[${padEmbedding(vec).join(",")}]`;
}

export async function embedText(text: string): Promise<number[] | null> {
  const client = getOpenAI();
  if (!client) return padEmbedding(pseudoEmbed(text));

  try {
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return padEmbedding(res.data[0].embedding);
  } catch {
    return padEmbedding(pseudoEmbed(text));
  }
}

export async function embedProfile(profile: Profile): Promise<number[]> {
  const text = buildProfileEmbeddingText(profile);
  return (await embedText(text)) ?? padEmbedding(pseudoEmbed(text));
}

/** Deterministic fallback when OpenAI key is absent (demo/dev) */
function pseudoEmbed(text: string, dims = 64): number[] {
  const vec = new Array(dims).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const idx = normalized.charCodeAt(i) % dims;
    vec[idx] += Math.sin(i + normalized.charCodeAt(i)) * 0.1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}
