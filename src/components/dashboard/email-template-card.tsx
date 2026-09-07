"use client";

import { useActionState, useState } from "react";

import {
  deleteEmailTemplateAction,
  resetEmailTemplateAction,
  saveEmailTemplateAction,
  type AutomationFormState,
} from "@/app/dashboard/automation/actions";
import type { EmailTemplate } from "@/lib/email-templates";

const initialState: AutomationFormState = {};

export function EmailTemplateCard({ template }: { template: EmailTemplate }) {
  const [saveState, saveAction, savePending] = useActionState(saveEmailTemplateAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetEmailTemplateAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteEmailTemplateAction, initialState);
  const [subject, setSubject] = useState(template.subject);
  const [html, setHtml] = useState(template.html);

  return (
    <details className="template-row">
      <summary>
        <span className="template-row-main">
          <strong>{template.label}</strong>
          <p>{template.description}</p>
        </span>
        <span className="template-row-meta">
          {template.isCustom ? <span className="status-pill is-quiet">Custom</span> : null}
          <span className="status-pill is-quiet">Email</span>
        </span>
      </summary>

      <div className="template-row-body">
        {template.vars.length ? (
          <p className="sms-template-vars">
            Available: {template.vars.map((item) => `{{${item}}}`).join(" · ")}
          </p>
        ) : null}

        <form action={saveAction} className="grid gap-2">
          <input type="hidden" name="id" value={template.id} />
          <input type="hidden" name="key" value={template.key ?? ""} />
          <input type="hidden" name="label" value={template.label} />

          <label className="sms-template-label" htmlFor={`subject-${template.id}`}>
            Subject
          </label>
          <input
            id={`subject-${template.id}`}
            name="subject"
            className="sms-template-input"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />

          <label className="sms-template-label" htmlFor={`html-${template.id}`}>
            Body (HTML)
          </label>
          <textarea
            id={`html-${template.id}`}
            name="html"
            className="sms-template-textarea"
            rows={8}
            value={html}
            onChange={(event) => setHtml(event.target.value)}
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
                onClick={() => {
                  setSubject(template.subject);
                  setHtml(template.html);
                }}
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
      </div>
    </details>
  );
}
