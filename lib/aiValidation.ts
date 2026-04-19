import OpenAI from "openai";
import { z } from "zod";

const inputFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  type: z.enum(["text", "textarea", "number", "date"]).optional(),
  value: z.string().optional().default("")
});

export const aiValidationSchema = z.object({
  allFieldsComplete: z.boolean(),
  allValuesSensible: z.boolean(),
  issues: z.array(z.string()),
  score: z.number().min(0).max(100)
});

export const aiValidationInputSchema = z.object({
  fields: z.array(inputFieldSchema).min(1)
});

export type AiValidationResult = z.infer<typeof aiValidationSchema>;

export async function runAiValidation(fields: z.infer<typeof inputFieldSchema>[]): Promise<AiValidationResult> {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY missing; AI validation is mandatory before submit.");
  }

  const client = new OpenAI({ apiKey: openAiKey });

  const prompt = `Validate this Airtel SCM Statement of Work submission.
Return JSON with keys: allFieldsComplete(boolean), allValuesSensible(boolean), issues(string[]), score(number 0-100).
Rules:
- Required fields must be meaningfully filled.
- Dates should be valid and end date should not be before start date.
- Budget fields should be positive when present.
- Scope/milestone text should be understandable, not random gibberish.
- Be strict; if unsure, fail and add issues.

Input:\n${JSON.stringify(fields, null, 2)}`;

  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "sow_validation",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            allFieldsComplete: { type: "boolean" },
            allValuesSensible: { type: "boolean" },
            issues: { type: "array", items: { type: "string" } },
            score: { type: "number", minimum: 0, maximum: 100 }
          },
          required: ["allFieldsComplete", "allValuesSensible", "issues", "score"]
        }
      }
    }
  });

  return aiValidationSchema.parse(JSON.parse(completion.output_text));
}
