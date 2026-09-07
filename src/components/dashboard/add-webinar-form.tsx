"use client";

import { useState } from "react";

import { WebinarForm } from "@/components/dashboard/webinar-form";

export function AddWebinarForm() {
  const [key, setKey] = useState(0);

  return <WebinarForm key={key} onDone={() => setKey((value) => value + 1)} />;
}
