import { NextResponse } from "next/server";
import { getFormFields } from "@/lib/formConfig";

export async function GET() {
  return NextResponse.json({ ok: true, fields: getFormFields() });
}
