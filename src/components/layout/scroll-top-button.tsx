"use client";

export function ScrollTopButton() {
  return (
    <button
      type="button"
      className="site-footer-top pressable"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.7 14.7 12 9.4l5.3 5.3 1.4-1.4L12 6.6 5.3 13.3z" />
      </svg>
    </button>
  );
}
