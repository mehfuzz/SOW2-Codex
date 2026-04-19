import { NextResponse } from "next/server";
import { z } from "zod";
import { aiValidationInputSchema, runAiValidation } from "@/lib/aiValidation";
import { getSupabaseAdmin } from "@/lib/supabase";

const payloadSchema = aiValidationInputSchema.extend({
  aiValidation: z
    .object({
      allFieldsComplete: z.boolean(),
      allValuesSensible: z.boolean(),
      score: z.number().min(0).max(100),
      issues: z.array(z.string()).optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    const authoritativeValidation = await runAiValidation(parsed.data.fields);
    const allowSubmit = authoritativeValidation.allFieldsComplete && authoritativeValidation.allValuesSensible;

    if (!allowSubmit) {
      return NextResponse.json(
        {
          ok: false,
          error: "Submission blocked: AI check failed.",
          issues: authoritativeValidation.issues,
          score: authoritativeValidation.score
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("sow_submissions").insert({
      form_data: parsed.data.fields,
      ai_score: authoritativeValidation.score,
      ai_issues: authoritativeValidation.issues,
      created_at: new Date().toISOString()
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "SOW submitted successfully", score: authoritativeValidation.score });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
