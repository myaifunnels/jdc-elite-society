"use client";

import { useEffect, useRef } from "react";

type AddressAutocompleteProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  mapsKey?: string;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[]; fields?: string[] },
          ) => { addListener: (event: string, handler: () => void) => void; getPlace: () => { formatted_address?: string } };
        };
      };
    };
  }
}

function loadPlaces(key: string) {
  const existing = document.querySelector<HTMLScriptElement>("script[data-google-places]");
  if (existing) {
    return existing;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
  script.async = true;
  script.dataset.googlePlaces = "true";
  document.head.appendChild(script);
  return script;
}

export function AddressAutocomplete({
  name = "address",
  defaultValue = "",
  placeholder = "Street, city, province or country",
  className,
  mapsKey,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const key = mapsKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || "";

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !key) return;

    function attach() {
      if (!input || !window.google?.maps?.places) return;
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ["address"],
        fields: ["formatted_address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          input.value = place.formatted_address;
        }
      });
    }

    if (window.google?.maps?.places) {
      attach();
      return;
    }

    const script = loadPlaces(key);
    script.addEventListener("load", attach);
    return () => script.removeEventListener("load", attach);
  }, [key]);

  return (
    <input
      ref={inputRef}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      autoComplete="street-address"
      className={className}
    />
  );
}
