import { z } from "zod";

export type FieldType = "text" | "textarea" | "number" | "date";

export interface SOWField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
}

export const fieldConfigSchema = z.object({
  id: z.string().min(2),
  label: z.string().min(2),
  type: z.enum(["text", "textarea", "number", "date"]),
  required: z.boolean(),
  placeholder: z.string().optional()
});

export const defaultFields: SOWField[] = [
  { id: "projectTitle", label: "Project Title", type: "text", required: true, placeholder: "Fiber rollout for zone B" },
  { id: "buyerName", label: "Buyer Name", type: "text", required: true, placeholder: "Airtel SCM Buyer" },
  { id: "vendorName", label: "Vendor Name", type: "text", required: true, placeholder: "ABC Networks Pvt Ltd" },
  { id: "scopeSummary", label: "Scope Summary", type: "textarea", required: true, placeholder: "What is being delivered?" },
  { id: "milestones", label: "Milestones", type: "textarea", required: true, placeholder: "Key dates and deliverables" },
  { id: "budgetInr", label: "Budget (INR)", type: "number", required: true, placeholder: "4500000" },
  { id: "startDate", label: "Start Date", type: "date", required: true },
  { id: "endDate", label: "End Date", type: "date", required: true }
];
