"use client";

import { useActionState } from "react";

import {
  saveEmailFromAddressAction,
  saveEmailTemplateAction,
  sendTestEmailAction,
  type AutomationFormState,
} from "@/app/dashboard/automation/actions";

const initialState: AutomationFormState = {};

export function EmailFromAddressForm({ name, address }: { name: string; address: string }) {
  const [state, action, pending] = useActionState(saveEmailFromAddressAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "26rem" }}>
      <label className="sms-template-label" htmlFor="emailFromName">
        Default sender name
      </label>
      <input
        id="emailFromName"
        name="emailFromName"
        defaultValue={name}
        placeholder="Coach JDC"
        className="sms-template-input"
      />

      <label className="sms-template-label" htmlFor="emailFromAddress">
        Default from address
      </label>
      <input
        id="emailFromAddress"
        name="emailFromAddress"
        defaultValue={address}
        placeholder="noreply@coachjdc.org"
        className="sms-template-input"
      />
      <p className="sms-template-hint">
        Sends through Resend as &quot;{name || "Coach JDC"} &lt;{address || "noreply@coachjdc.org"}&gt;&quot;.
      </p>
      <div className="sms-template-actions">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Saving..." : "Save sender name & address"}
        </button>
      </div>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function SendTestEmailForm({
  templates,
}: {
  templates: { id: string; label: string; subject: string; html: string }[];
}) {
  const [state, action, pending] = useActionState(sendTestEmailAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "30rem" }}>
      <label className="sms-template-label" htmlFor="test-email-to">
        Send to
      </label>
      <input id="test-email-to" name="to" type="email" placeholder="you@email.com" className="sms-template-input" />

      <label className="sms-template-label" htmlFor="test-email-template">
        Starting from template
      </label>
      <select
        id="test-email-template"
        className="sms-template-input"
        onChange={(event) => {
          const subjectInput = document.getElementById("test-email-subject") as HTMLInputElement | null;
          const htmlTextarea = document.getElementById("test-email-html") as HTMLTextAreaElement | null;
          const picked = templates.find((item) => item.id === event.target.value);
          if (picked) {
            if (subjectInput) subjectInput.value = picked.subject;
            if (htmlTextarea) htmlTextarea.value = picked.html;
          }
        }}
        defaultValue=""
      >
        <option value="">Write my own email</option>
        {templates.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="sms-template-label" htmlFor="test-email-subject">
        Subject
      </label>
      <input id="test-email-subject" name="subject" className="sms-template-input" />

      <label className="sms-template-label" htmlFor="test-email-html">
        Body (sample values fill in any {"{{vars}}"})
      </label>
      <textarea id="test-email-html" name="html" className="sms-template-textarea" rows={5} />

      <div className="sms-template-actions">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Sending..." : "Send email"}
        </button>
      </div>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function AddEmailTemplateForm() {
  const [state, action, pending] = useActionState(saveEmailTemplateAction, initialState);

  return (
    <form action={action} className="grid gap-2" style={{ maxWidth: "30rem" }}>
      <label className="sms-template-label" htmlFor="new-email-label">
        Template name
      </label>
      <input id="new-email-label" name="label" placeholder="e.g. Webinar reminder" className="sms-template-input" required />

      <label className="sms-template-label" htmlFor="new-email-subject">
        Subject
      </label>
      <input id="new-email-subject" name="subject" className="sms-template-input" required />

      <label className="sms-template-label" htmlFor="new-email-html">
        Body (HTML)
      </label>
      <textarea id="new-email-html" name="html" className="sms-template-textarea" rows={5} required />

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
