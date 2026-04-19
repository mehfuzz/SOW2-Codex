"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultFields, FieldType, SOWField } from "@/lib/formSchema";

type FormValues = Record<string, string>;

type AiValidation = {
  allFieldsComplete: boolean;
  allValuesSensible: boolean;
  issues: string[];
  score: number;
  allowSubmit: boolean;
};

const emptyCustomField: Omit<SOWField, "id"> = {
  label: "",
  type: "text",
  required: true,
  placeholder: ""
};

export default function HomePage() {
  const [fields, setFields] = useState<SOWField[]>(defaultFields);
  const [values, setValues] = useState<FormValues>({});
  const [newField, setNewField] = useState(emptyCustomField);
  const [validation, setValidation] = useState<AiValidation | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/form-config");
        const result = await response.json();
        if (response.ok && result.ok && Array.isArray(result.fields) && result.fields.length > 0) {
          setFields(result.fields);
        }
      } catch {
        setFields(defaultFields);
      }
    };

    void loadConfig();
  }, []);

  const payloadFields = useMemo(
    () => fields.map((f) => ({ ...f, value: values[f.id] ?? "" })),
    [fields, values]
  );

  const handleAddField = () => {
    if (!newField.label.trim()) return;
    const id = `custom_${newField.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;

    setFields((prev) => [...prev, { id, ...newField }]);
    setNewField(emptyCustomField);
    setValidation(null);
  };

  const handleRunAICheck = async () => {
    setBusy(true);
    setStatus("Running mandatory AI validation...");
    setValidation(null);

    try {
      const response = await fetch("/api/validate-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: payloadFields })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatus(result.error ?? "AI check failed");
        return;
      }

      setValidation(result);
      setStatus(result.allowSubmit ? "AI check passed. You can submit." : "AI check failed. Fix issues before submit.");
    } catch {
      setStatus("AI check failed due to network/server error.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validation?.allowSubmit) {
      setStatus("Submission blocked: run AI check and fix issues first.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/submit-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: payloadFields, aiValidation: validation })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatus(result.error ?? "Submission failed");
        if (result.issues && Array.isArray(result.issues)) {
          setValidation((prev) =>
            prev
              ? {
                  ...prev,
                  issues: result.issues,
                  score: typeof result.score === "number" ? result.score : prev.score,
                  allowSubmit: false
                }
              : prev
          );
        }
        return;
      }

      setStatus(result.message ?? "SOW submitted successfully");
    } catch {
      setStatus("Submission failed due to network/server error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container">
      <div className="card">
        <h1>Airtel SCM - SOW Submission</h1>
        <p className="small">Submission is allowed only after mandatory AI completeness + sense check.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid">
            {fields.map((field) => (
              <div className="field" key={field.id}>
                <label htmlFor={field.id}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {renderInput(field.type, {
                  id: field.id,
                  value: values[field.id] ?? "",
                  placeholder: field.placeholder,
                  onChange: (value) => {
                    setValues((prev) => ({ ...prev, [field.id]: value }));
                    setValidation(null);
                  }
                })}
              </div>
            ))}
          </div>

          <hr style={{ margin: "20px 0", borderColor: "#e6e9f2" }} />

          <h3>Add Dynamic Field</h3>
          <div className="grid">
            <div className="field">
              <label>Field Label</label>
              <input
                value={newField.label}
                onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Additional requirement"
              />
            </div>
            <div className="field">
              <label>Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField((prev) => ({ ...prev, type: e.target.value as FieldType }))}
              >
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={handleAddField}>
              + Add Field
            </button>
            <button type="button" className="btn-primary" onClick={handleRunAICheck} disabled={busy}>
              Run AI Check
            </button>
            <button type="submit" className="btn-danger" disabled={busy || !validation?.allowSubmit}>
              Submit SOW
            </button>
          </div>
        </form>

        {validation && (
          <div className={`status ${validation.allowSubmit ? "ok" : "error"}`}>
            <strong>AI Score:</strong> {validation.score}/100
            {validation.issues.length > 0 && (
              <ul>
                {validation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {status && <div className={`status ${validation?.allowSubmit ? "ok" : "error"}`}>{status}</div>}
      </div>
    </main>
  );
}

function renderInput(
  type: FieldType,
  props: { id: string; value: string; placeholder?: string; onChange: (value: string) => void }
) {
  if (type === "textarea") {
    return (
      <textarea
        id={props.id}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      id={props.id}
      type={type}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}
