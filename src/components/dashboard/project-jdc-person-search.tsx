"use client";

import { useEffect, useId, useRef, useState } from "react";

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

export function ProjectJdcPersonSearch({ namePlaceholder }: { namePlaceholder: string }) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setPeople([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/contacts/search?${new URLSearchParams({ q: needle, kind: "contact" })}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { contacts?: Suggestion[] };
        setPeople(payload.contacts ?? []);
        setActive(0);
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function hasRealEmail(email: string) {
    return Boolean(email) && !email.toLowerCase().endsWith("@ghl.invalid");
  }

  function choose(person: Suggestion) {
    setName(person.name);
    setEmail(hasRealEmail(person.email) ? person.email : "");
    setQuery(person.name);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="pjdc-person-search" style={{ position: "relative", flex: "1 1 20rem" }}>
      <label className="pjdc-field">
        Search GHL contacts
        <input
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search name, email, or phone"
          autoComplete="off"
          aria-activedescendant={open && people[active] ? `${listId}-${people[active].id}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(current + 1, Math.max(people.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, 0));
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Enter" && open && people[active]) {
              event.preventDefault();
              choose(people[active]);
            }
          }}
        />
      </label>

      {open && query.trim() ? (
        <div id={listId} role="listbox" className="contact-search-menu">
          {loading ? <p className="contact-search-note">Searching…</p> : null}
          {!loading && people.length === 0 ? <p className="contact-search-note">No GHL contacts match that.</p> : null}
          {people.map((person, index) => (
            <button
              key={person.id}
              id={`${listId}-${person.id}`}
              type="button"
              role="option"
              aria-selected={active === index}
              className={cn("contact-search-option", active === index && "is-active")}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(person)}
            >
              <span>
                <strong>{person.name}</strong>
                <em>
                  {hasRealEmail(person.email) ? person.email : "No email on file"}
                  {person.city ? ` · ${person.city}` : ""}
                </em>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="pjdc-toolbar" style={{ marginTop: "0.5rem" }}>
        <label className="pjdc-field">
          Name
          <input
            type="text"
            name="name"
            required
            value={name}
            placeholder={namePlaceholder}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="pjdc-field">
          Email
          <input type="email" name="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      </div>
    </div>
  );
}
