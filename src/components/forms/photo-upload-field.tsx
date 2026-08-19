"use client";

import { useState } from "react";

export function PhotoUploadField({
  defaultUrl = "",
  required = false,
}: {
  defaultUrl?: string;
  required?: boolean;
}) {
  const [preview, setPreview] = useState(defaultUrl);

  return (
    <div className="photo-upload">
      <span className="photo-upload-frame">
        {preview ? (
          // User photos can be R2 URLs or data URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile preview" />
        ) : (
          <span>Photo</span>
        )}
      </span>
      <label className="photo-upload-pick">
        <input
          name="profilePhoto"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={required && !defaultUrl}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setPreview(defaultUrl);
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? "Change photo" : "Upload photo"}
      </label>
      <p>JPG, PNG, or WEBP. This is the picture the team will see while they verify you.</p>
    </div>
  );
}
