"use client";

import { useActionState, useState } from "react";

import {
  deleteSmsTemplateAction,
  resetSmsTemplateAction,
  saveSmsTemplateAction,
  type AutomationFormState,
} from "@/app/dashboard/automation/actions";
import type { SmsTemplate } from "@/lib/sms-templates";

const initialState: AutomationFormState = {};

export function SmsTemplateCard({ template }: { template: SmsTemplate }) {
  const [saveState, saveAction, savePending] = useActionState(saveSmsTemplateAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetSmsTemplateAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSmsTemplateAction, initialState);
  const [body, setBody] = useState(template.body);

  return (
    <article className="sms-template-card">
      <header className="sms-template-card-head">
        <div>
          <strong>{template.label}</strong>
          <p>{template.description}</p>
        </div>
        {template.isCustom ? <span className="status-pill is-quiet">Custom</span> : null}
      </header>

      {template.vars.length ? (
        <p className="sms-template-vars">
          Available: {template.vars.map((item) => `{{${item}}}`).join(" · ")}
        </p>
      ) : null}

      <form action={saveAction} className="grid gap-2">
        <input type="hidden" name="id" value={template.id} />
        <input type="hidden" name="key" value={template.key ?? ""} />
        <input type="hidden" name="label" value={template.label} />
        <label className="sms-template-label" htmlFor={`body-${template.id}`}>
          Message
        </label>
        <textarea
          id={`body-${template.id}`}
          name="body"
          className="sms-template-textarea"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="sms-template-actions">
          <button type="submit" className="macos-btn macos-btn-primary" disabled={savePending}>
            {savePending ? "Saving..." : "Save"}
          </button>
          {template.key ? (
            <button
              type="submit"
              formAction={resetAction}
              className="macos-btn macos-btn-secondary"
              disabled={resetPending}
              onClick={() => setBody(template.body)}
            >
              {resetPending ? "Resetting..." : "Reset to default"}
            </button>
          ) : (
            <button
              type="submit"
              formAction={deleteAction}
              className="macos-btn macos-btn-danger"
              disabled={deletePending}
              onClick={(event) => {
                if (!window.confirm(`Delete "${template.label}"?`)) {
                  event.preventDefault();
                }
              }}
            >
              {deletePending ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
        {saveState.error ? <p className="auth-error">{saveState.error}</p> : null}
        {saveState.success ? <p className="auth-success">{saveState.success}</p> : null}
        {resetState.error ? <p className="auth-error">{resetState.error}</p> : null}
        {resetState.success ? <p className="auth-success">{resetState.success}</p> : null}
        {deleteState.error ? <p className="auth-error">{deleteState.error}</p> : null}
      </form>
    </article>
  );
}
