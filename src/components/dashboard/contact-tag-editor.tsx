"use client";

import { useMemo, useState, useTransition } from "react";

import { addContactTag, removeContactTag } from "@/app/dashboard/contacts/actions";
import { TAG_GROUPS, tagGroupFor, uniqueTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function ContactTagEditor({
  contactId,
  tags,
  suggestions,
  canEdit,
}: {
  contactId: string;
  tags: string[];
  suggestions: string[];
  canEdit: boolean;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const current = uniqueTags(tags);
  const available = useMemo(() => {
    const have = new Set(current.map((tag) => tag.toLowerCase()));
    return uniqueTags([...TAG_GROUPS.flatMap((group) => group.tags), ...suggestions]).filter(
      (tag) => !have.has(tag.toLowerCase()),
    );
  }, [current, suggestions]);

  function submit(tag: string) {
    const next = uniqueTags([tag])[0];
    if (!next || !canEdit) {
      return;
    }
    startTransition(async () => {
      await addContactTag(contactId, next);
      setValue("");
    });
  }

  return (
    <div className="contact-tag-editor">
      <div className="contact-tag-cloud">
        {current.length === 0 ? <span className="macos-lead">No tags yet.</span> : null}
        {current.map((tag) => (
          <span key={tag} className={cn("tag-chip", `is-${tagGroupFor(tag)}`)}>
            {tag}
            {canEdit ? (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                disabled={pending}
                onClick={() => startTransition(() => void removeContactTag(contactId, tag))}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>

      {canEdit ? (
        <>
          <form
            className="contact-tag-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit(value);
            }}
          >
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Add a tag and sync it to GHL"
              disabled={pending}
            />
            <button type="submit" className="macos-btn macos-btn-secondary" disabled={pending || !value.trim()}>
              Add
            </button>
          </form>
          <div className="contact-tag-suggestions">
            {available.slice(0, 18).map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn("tag-chip is-ghost", `is-${tagGroupFor(tag)}`)}
                disabled={pending}
                onClick={() => submit(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
