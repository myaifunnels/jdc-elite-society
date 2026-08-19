"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { countries, defaultCountry, findCountry } from "@/lib/countries";

export function PhoneField({
  defaultIso = defaultCountry.iso,
  defaultNational = "",
}: {
  defaultIso?: string;
  defaultNational?: string;
}) {
  const [iso, setIso] = useState(defaultIso);
  const country = useMemo(() => findCountry(iso), [iso]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="phone-field">
      <input type="hidden" name="phoneCountry" value={country.iso} />
      <input type="hidden" name="phoneDial" value={country.dial} />
      <button
        type="button"
        className="phone-flag"
        aria-label={`Country code ${country.name} ${country.dial}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden>{country.flag}</span>
      </button>
      {open ? (
        <div className="phone-flag-menu" role="listbox">
          {countries.map((item) => (
            <button
              key={item.iso}
              type="button"
              role="option"
              aria-selected={item.iso === country.iso}
              onClick={() => {
                setIso(item.iso);
                setOpen(false);
              }}
            >
              <span aria-hidden>{item.flag}</span>
              <span>{item.name}</span>
              <em>{item.dial}</em>
            </button>
          ))}
        </div>
      ) : null}
      <span className="phone-dial">{country.dial}</span>
      <input
        name="phoneNational"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="917 123 4567"
        defaultValue={defaultNational}
        required
      />
    </div>
  );
}
