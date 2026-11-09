"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Candidate = { id: string; name: string; email: string };

export function ProjectJdcPersonSearch({
  namePlaceholder,
  candidates,
}: {
  namePlaceholder: string;
  candidates: Candidate[];
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return [];
    return candidates
      .filter((person) => person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [candidates, needle]);

  useEffect(() => {
    setActive(0);
  }, [needle]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(person: Candidate) {
    setName(person.name);
    setEmail(person.email);
    setQuery(person.name);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="pjdc-person-search" style={{ position: "relative", flex: "1 1 20rem" }}>
      <label className="pjdc-field">
        Search existing Google sign-ins
        <input
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search name or email"
          autoComplete="off"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(current + 1, Math.max(matches.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, 0));
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Enter" && open && matches[active]) {
              event.preventDefault();
              choose(matches[active]);
            }
          }}
        />
      </label>

      {open && needle ? (
        <div id={listId} role="listbox" className="contact-search-menu">
          {matches.length === 0 ? (
            <p className="contact-search-note">No one signed in with Google matches that.</p>
          ) : null}
          {matches.map((person, index) => (
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
                <em>{person.email}</em>
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
