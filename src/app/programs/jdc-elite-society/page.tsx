import type { Metadata } from "next";

import { JdcEliteSocietyPage } from "@/components/elite/jdc-elite-society-page";

export const metadata: Metadata = {
  title: "JDC Elite Society",
  description:
    "Structure. Discipline. Direction. Join JDC Elite Society: the private community and portal for OFWs, employees, and beginner entrepreneurs who want more in life.",
};

export default function Page() {
  return <JdcEliteSocietyPage />;
}
