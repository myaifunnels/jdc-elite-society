"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { countries, defaultCountry, findCountry } from "@/lib/countries";

const MENU_WIDTH = 272;
const MENU_MAX_HEIGHT = 256;

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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, maxHeight: MENU_MAX_HEIGHT });
  const rootRef = useRef<HTMLDivElement>(null);
  const flagRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function placeMenu() {
    const rect = flagRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left = Math.min(Math.max(12, rect.left), window.innerWidth - MENU_WIDTH - 12);
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow));
    const top = openUp ? rect.top - 8 - maxHeight : rect.bottom + 8;

    setCoords({ top, left, maxHeight });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function place() {
      placeMenu();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    place();
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      className="phone-flag-menu"
      role="listbox"
      style={{
        top: coords.top,
        left: coords.left,
        maxHeight: coords.maxHeight,
      }}
    >
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
  ) : null;

  return (
    <div ref={rootRef} className={open ? "phone-field is-open" : "phone-field"}>
      <input type="hidden" name="phoneCountry" value={country.iso} />
      <input type="hidden" name="phoneDial" value={country.dial} />
      <button
        ref={flagRef}
        type="button"
        className="phone-flag"
        aria-label={`Country code ${country.name} ${country.dial}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((current) => {
            if (current) return false;
            placeMenu();
            return true;
          });
        }}
      >
        <span aria-hidden>{country.flag}</span>
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
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
