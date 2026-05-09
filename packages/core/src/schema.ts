// Helpers exposing the AI-agent system prompt and JSON Schema bundled with
// this package. Useful when configuring AI agents that produce blog content.

import fs from 'node:fs';
import path from 'node:path';

let cachedPrompt: string | null = null;
let cachedSchema: object | null = null;

const SCHEMA_DIR = path.resolve(__dirname, '..', 'schema');

/**
 * Returns the AI agent system prompt template (markdown) bundled with this
 * package. Drop the returned string into your AI agent's system message to
 * teach it the content blocks format.
 */
export function getAiPromptTemplate(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  const file = path.join(SCHEMA_DIR, 'ai-prompt.md');
  cachedPrompt = fs.readFileSync(file, 'utf-8');
  return cachedPrompt;
}

/**
 * Returns the JSON Schema (Draft-7) describing the content blocks format.
 * Use this with OpenAI structured outputs (`response_format: { type: 'json_schema', json_schema: ... }`)
 * or Anthropic tool_use input_schema.
 */
export function getContentBlocksJsonSchema(): object {
  if (cachedSchema !== null) return cachedSchema;
  const file = path.join(SCHEMA_DIR, 'blocks.schema.json');
  cachedSchema = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return cachedSchema!;
}
