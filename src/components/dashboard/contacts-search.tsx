"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { contactsHref, type ContactsView } from "@/lib/contacts-href";
import { uniqueTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  name: string;
  email: string;
  city: string;
  kind: string;
  photoUrl?: string;
  status: string;
};

type TagOption = { tag: string; count: number };

export function ContactsSearch({
  view,
  kind,
  q,
  selectedTags,
  tags,
  hideTags = false,
}: {
  view: ContactsView;
  kind?: string;
  q?: string;
  selectedTags: string[];
  tags: TagOption[];
  hideTags?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(q ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Suggestion[]>([]);
  const [tagHits, setTagHits] = useState<TagOption[]>([]);
  const [active, setActive] = useState(0);

  const unusedTags = useMemo(() => {
    const have = new Set(selectedTags.map((tag) => tag.toLowerCase()));
    return tags.filter((item) => item.count > 0 && !have.has(item.tag.toLowerCase()));
  }, [selectedTags, tags]);

  useEffect(() => {
    const needle = query.trim();
    if (!needle || hideTags) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ q: needle });
      if (kind) {
        params.set("kind", kind);
      }
      for (const tag of selectedTags) {
        params.append("tag", tag);
      }
      try {
        const response = await fetch(`/api/contacts/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { contacts?: Suggestion[]; tags?: TagOption[] };
        setPeople(payload.contacts ?? []);
        setTagHits(payload.tags ?? []);
        setActive(0);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, kind, selectedTags, hideTags]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const needle = query.trim();
  const shownPeople = needle ? people : [];
  const shownTags = needle ? tagHits : [];
  const options = [
    ...shownPeople.map((person) => ({ type: "person" as const, person })),
    ...shownTags
      .filter((item) => !selectedTags.some((tag) => tag.toLowerCase() === item.tag.toLowerCase()))
      .map((tag) => ({ type: "tag" as const, tag })),
  ];

  function go(href: string) {
    setOpen(false);
    startTransition(() => router.push(href));
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) {
      return;
    }
    if (option.type === "person") {
      go(`/dashboard/contacts/${option.person.id}`);
      return;
    }
    go(contactsHref({ view, kind, q: query.trim(), tags: uniqueTags([...selectedTags, option.tag.tag]) }));
  }

  return (
    <div className="contacts-filters">
      <div ref={rootRef} className="contact-search is-advanced">
        <form action="/dashboard/contacts" method="get" autoComplete="off">
          {view !== "dashboard" ? <input type="hidden" name="view" value={view} /> : null}
          {kind ? <input type="hidden" name="kind" value={kind} /> : null}
          {selectedTags.map((tag) => (
            <input key={tag} type="hidden" name="tag" value={tag} />
          ))}
          <input
            name="q"
            value={query}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder={hideTags ? "Search registrants by name, email, or phone" : "Search name, email, city, or phone"}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActive((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => Math.max(current - 1, 0));
              } else if (event.key === "Escape") {
                setOpen(false);
              } else if (event.key === "Enter" && open && options[active]) {
                event.preventDefault();
                choose(active);
              }
            }}
          />
          <button type="submit" className="macos-btn macos-btn-secondary">
            Search
          </button>
        </form>

        {open && !hideTags ? (
          <div id={listId} className="contact-search-menu" role="listbox">
            {loading ? <p className="contact-search-note">Searching…</p> : null}
            {!loading && needle && options.length === 0 ? (
              <p className="contact-search-note">No people or tags match that yet.</p>
            ) : null}
            {!needle ? <p className="contact-search-note">Start typing to look up a person, or filter by tag.</p> : null}
            {shownPeople.length ? <p className="contact-search-label">People</p> : null}
            {shownPeople.map((person, index) => (
              <button
                key={person.id}
                type="button"
                role="option"
                aria-selected={active === index}
                className={cn("contact-search-option", active === index && "is-active")}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <ContactAvatar name={person.name} photoUrl={person.photoUrl} size="sm" />
                <span>
                  <strong>{person.name}</strong>
                  <em>
                    {person.email}
                    {person.city ? ` · ${person.city}` : ""}
                  </em>
                </span>
              </button>
            ))}
            {shownTags.length ? <p className="contact-search-label">Tags</p> : null}
            {shownTags
              .filter((item) => !selectedTags.some((tag) => tag.toLowerCase() === item.tag.toLowerCase()))
              .map((item, index) => {
                const optionIndex = shownPeople.length + index;
                return (
                  <button
                    key={item.tag}
                    type="button"
                    role="option"
                    aria-selected={active === optionIndex}
                    className={cn("contact-search-option", active === optionIndex && "is-active")}
                    onMouseEnter={() => setActive(optionIndex)}
                    onClick={() => choose(optionIndex)}
                  >
                    <span>
                      <strong>{item.tag}</strong>
                      <em>{item.count ? `${item.count} in this roster` : "Filter by this tag"}</em>
                    </span>
                  </button>
                );
              })}
          </div>
        ) : null}
      </div>

      {hideTags ? null : (
      <label className="contact-tag-filter">
        <span>Tag</span>
        <select
          value=""
          onChange={(event) => {
            const tag = event.target.value;
            if (!tag) {
              return;
            }
            go(contactsHref({ view, kind, q: query.trim(), tags: uniqueTags([...selectedTags, tag]) }));
          }}
        >
          <option value="">Filter by tag</option>
          {unusedTags.map((item) => (
            <option key={item.tag} value={item.tag}>
              {item.tag}
              {item.count ? ` (${item.count})` : ""}
            </option>
          ))}
        </select>
      </label>

      )}

      {hideTags ? null : selectedTags.length ? (
        <div className="contact-active-tags">
          {selectedTags.map((tag) => (
            <Link
              key={tag}
              href={contactsHref({
                view,
                kind,
                q: query.trim(),
                tags: selectedTags.filter((item) => item.toLowerCase() !== tag.toLowerCase()),
              })}
              className="tag-chip is-active"
            >
              {tag}
              <span aria-hidden>×</span>
            </Link>
          ))}
          <Link href={contactsHref({ view, kind, q: query.trim() })} className="tag-chip is-ghost">
            Clear tags
          </Link>
        </div>
      ) : null}
    </div>
  );
}
