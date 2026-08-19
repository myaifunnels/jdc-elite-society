"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function AffiliateQrCard({ url, label }: { url: string; label: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 360,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    }).then((value) => {
      if (!cancelled) {
        setDataUrl(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) {
    return <p className="text-sm text-[var(--muted)]">Preparing QR code…</p>;
  }

  return (
    <div className="grid justify-items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code for ${label}`} className="h-44 w-44 rounded-2xl border border-[var(--line)] bg-white p-2" />
      <a href={dataUrl} download={`${label.replace(/\s+/g, "-").toLowerCase()}-qr.png`} className="macos-btn macos-btn-secondary pressable">
        Download QR PNG
      </a>
    </div>
  );
}
