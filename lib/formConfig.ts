import { defaultFields, fieldConfigSchema, SOWField } from "@/lib/formSchema";

const fieldsSchema = fieldConfigSchema.array().min(1);

export function getFormFields(): SOWField[] {
  const raw = process.env.SOW_FORM_FIELDS_JSON;
  if (!raw) {
    return defaultFields;
  }

  try {
    const parsed = fieldsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return defaultFields;
    return parsed.data;
  } catch {
    return defaultFields;
  }
}
