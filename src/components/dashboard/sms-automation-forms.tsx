"use client";

import { useActionState } from "react";

import {
  saveSmsFromNumberAction,
  saveSmsTemplateAction,
  sendTestSmsAction,
  type AutomationFormState,
} from "@/app/dashboard/automation/actions";

const initialState: AutomationFormState = {};

export function SmsFromNumberForm({ value }: { value: string }) {
  const [state, action, pending] = useActionState(saveSmsFromNumberAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "22rem" }}>
      <label className="sms-template-label" htmlFor="smsFromNumber">
        Default from number
      </label>
      <input
        id="smsFromNumber"
        name="smsFromNumber"
        defaultValue={value}
        placeholder="+639171234567"
        className="sms-template-input"
      />
      <p className="sms-template-hint">Used for Twilio sends. GHL and TextBee send from their own connected number/device.</p>
      <div className="sms-template-actions">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Saving..." : "Save from number"}
        </button>
      </div>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function SendTestSmsForm({ templates }: { templates: { id: string; label: string; body: string }[] }) {
  const [state, action, pending] = useActionState(sendTestSmsAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "28rem" }}>
      <label className="sms-template-label" htmlFor="test-to">
        Send to
      </label>
      <input id="test-to" name="to" placeholder="+639171234567" className="sms-template-input" />

      <label className="sms-template-label" htmlFor="test-template">
        Starting from template
      </label>
      <select
        id="test-template"
        className="sms-template-input"
        onChange={(event) => {
          const textarea = document.getElementById("test-body") as HTMLTextAreaElement | null;
          const picked = templates.find((item) => item.id === event.target.value);
          if (textarea && picked) {
            textarea.value = picked.body;
          }
        }}
        defaultValue=""
      >
        <option value="">Write my own message</option>
        {templates.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="sms-template-label" htmlFor="test-body">
        Message (sample values fill in any {"{{vars}}"})
      </label>
      <textarea id="test-body" name="body" className="sms-template-textarea" rows={4} />

      <div className="sms-template-actions">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Sending..." : "Send text"}
        </button>
      </div>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function AddSmsTemplateForm() {
  const [state, action, pending] = useActionState(saveSmsTemplateAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "28rem" }}>
      <label className="sms-template-label" htmlFor="new-label">
        Template name
      </label>
      <input id="new-label" name="label" placeholder="e.g. Webinar reminder" className="sms-template-input" required />

      <label className="sms-template-label" htmlFor="new-body">
        Message
      </label>
      <textarea id="new-body" name="body" className="sms-template-textarea" rows={4} required />

      <div className="sms-template-actions">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Adding..." : "Add template"}
        </button>
      </div>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}
