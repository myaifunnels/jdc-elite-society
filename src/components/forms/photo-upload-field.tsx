"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import { mediaSrc } from "@/lib/media";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoUploadField({
  defaultUrl = "",
  required = false,
}: {
  defaultUrl?: string;
  required?: boolean;
}) {
  const [preview, setPreview] = useState(mediaSrc(defaultUrl) ?? "");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function applyFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Use a JPG, PNG, WEBP, or GIF photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Keep the photo under 5MB.");
      return;
    }
    setError("");
    setPreview(URL.createObjectURL(file));
  }

  function assignToInput(file: File) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }

  return (
    <div className="photo-upload">
      <button
        type="button"
        className={dragging ? "photo-upload-frame is-dragging" : "photo-upload-frame"}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            assignToInput(file);
            applyFile(file);
          }
        }}
        aria-label={preview ? "Change your profile photo" : "Upload your profile photo"}
      >
        {preview ? (
          // User photos can be R2 URLs or data URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile preview" />
        ) : (
          <span className="photo-upload-placeholder">
            <Camera size={22} aria-hidden />
          </span>
        )}
        <span className="photo-upload-badge" aria-hidden="true">
          <Camera size={14} />
        </span>
      </button>

      <input
        ref={inputRef}
        name="profilePhoto"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required={required && !defaultUrl}
        className="photo-upload-input"
        onChange={(event) => applyFile(event.target.files?.[0])}
      />

      <div className="photo-upload-copy">
        <p className="photo-upload-title">{preview ? "Looking good" : "Add your photo"}</p>
        {error ? (
          <p className="photo-upload-error">{error}</p>
        ) : (
          <p className="photo-upload-hint">JPG, PNG, or WEBP · drag &amp; drop or click to browse · under 5MB</p>
        )}
      </div>
    </div>
  );
}
