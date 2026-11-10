"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type AddressAutocompleteProps = {
  name?: string;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  mapsKey?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onLocationChange?: (coords: Coords) => void;
};

type Suggestion = {
  id: string;
  label: string;
  detail?: string;
  lat?: number;
  lng?: number;
};

type Coords = { lat?: number; lng?: number };

const emptySubscribe = () => () => undefined;

export function AddressAutocomplete({
  name = "address",
  defaultValue = "",
  value: valueProp,
  placeholder = "Street, city, province or country",
  className,
  onChange,
  onBlur,
  onLocationChange,
}: AddressAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = valueProp ?? innerValue;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState<Coords>({});
  const [menu, setMenu] = useState({ top: 0, left: 0, width: 280 });

  function placeMenu() {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const box = input.getBoundingClientRect();
    setMenu({
      top: box.bottom + 6,
      left: box.left,
      width: Math.max(box.width, 260),
    });
  }

  useEffect(() => {
    const needle = value.trim();
    if (!open || needle.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/address/suggest?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        setHits(payload.suggestions ?? []);
        setActive(0);
        placeMenu();
      } catch {
        if (controller.signal.aborted) {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, value]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      const menuEl = document.getElementById(listId);
      if (menuEl?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onReposition() {
      if (open) {
        placeMenu();
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [listId, open]);

  function setAddress(next: string, nextCoords: Coords = {}) {
    if (valueProp === undefined) {
      setInnerValue(next);
    }
    setCoords(nextCoords);
    onChange?.(next);
    onLocationChange?.(nextCoords);
  }

  function choose(item: Suggestion) {
    setAddress(item.label, { lat: item.lat, lng: item.lng });
    setHits([]);
    setOpen(false);
  }

  const showMenu = open && value.trim().length >= 3;
  const menuNode =
    showMenu && isClient
      ? createPortal(
          <div
            id={listId}
            className="address-suggest-menu"
            role="listbox"
            style={{ top: menu.top, left: menu.left, width: menu.width }}
          >
            {loading ? <p className="contact-search-note">Looking up addresses…</p> : null}
            {!loading && hits.length === 0 ? (
              <p className="contact-search-note">No match yet. Keep typing, or enter the address yourself.</p>
            ) : null}
            {hits.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={active === index}
                className={cn("contact-search-option", active === index && "is-active")}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
              >
                <span>
                  <strong>{item.label}</strong>
                  {item.detail ? <em>{item.detail}</em> : null}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="address-suggest">
      <input
        ref={inputRef}
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
        onFocus={() => {
          setOpen(true);
          placeMenu();
        }}
        onBlur={onBlur}
        onChange={(event) => {
          const next = event.target.value;
          setAddress(next);
          setOpen(true);
          if (next.trim().length < 3) {
            setHits([]);
            setLoading(false);
          }
          placeMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, Math.max(hits.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Escape") {
            setOpen(false);
          } else if (event.key === "Enter" && open && hits[active]) {
            event.preventDefault();
            choose(hits[active]);
          }
        }}
      />
      {typeof coords.lat === "number" ? <input type="hidden" name="addressLat" value={coords.lat} /> : null}
      {typeof coords.lng === "number" ? <input type="hidden" name="addressLng" value={coords.lng} /> : null}
      {menuNode}
    </div>
  );
}
