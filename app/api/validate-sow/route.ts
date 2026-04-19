import { NextResponse } from "next/server";
import { aiValidationInputSchema, runAiValidation } from "@/lib/aiValidation";

export async function POST(request: Request) {
  const parsed = aiValidationInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await runAiValidation(parsed.data.fields);

    return NextResponse.json({
      ok: true,
      ...result,
      allowSubmit: result.allFieldsComplete && result.allValuesSensible
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "AI validation failed" },
      { status: 500 }
    );
  }
}
