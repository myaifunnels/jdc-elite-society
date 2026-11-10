import type { Metadata } from "next";

import { mastermindOffer } from "@/data/mastermind-offer";
import { siteUrl } from "@/lib/site";

const offerUrl = `${siteUrl}/duplication`;
const ogImageUrl = `${siteUrl}${mastermindOffer.ogImage}`;
const title = "JDC Mastermind: Duplication Season | The Network Builder System";
const description =
  `Join JDC Mastermind with Coach Jayson Dela Cruz — two live sessions, ${mastermindOffer.sessionDates.session1} and ${mastermindOffer.sessionDates.session2} (Foundation and Execution), plus lifetime replays and the private JDC Elite Society community.`;

export const mastermindBatch2Seo: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { absolute: title },
  description,
  applicationName: "JDC Mastermind",
  authors: [{ name: "Coach Jayson Dela Cruz", url: offerUrl }],
  creator: "Coach Jayson Dela Cruz",
  publisher: "JDC Elite Society",
  keywords: [...mastermindOffer.keywords],
  category: "coaching",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: offerUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: offerUrl,
    siteName: "JDC Mastermind",
    title,
    description,
    images: [
      {
        url: ogImageUrl,
        width: mastermindOffer.ogImageWidth,
        height: mastermindOffer.ogImageHeight,
        alt: mastermindOffer.ogImageAlt,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: ogImageUrl,
        alt: mastermindOffer.ogImageAlt,
      },
    ],
  },
};

export function mastermindBatch2JsonLd() {
  const orgId = `${offerUrl}/#organization`;
  const personId = `${offerUrl}/#coach`;
  const websiteId = `${offerUrl}/#website`;
  const webpageId = `${offerUrl}/#webpage`;
  const courseId = `${offerUrl}/#course`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "JDC Elite Society",
        alternateName: ["JDC Mastermind", "Coach JDC"],
        url: offerUrl,
        logo: mastermindOffer.logo,
        email: mastermindOffer.support.email,
        telephone: mastermindOffer.support.phone,
        founder: { "@id": personId },
        sameAs: [
          "https://facebook.com/jaysondelacruzofficial",
          "https://instagram.com/jaysondc01/",
          "https://youtube.com/@JaysonDelaCruzOfficial",
          "https://community.coachjdc.org",
        ],
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Jayson Dela Cruz",
        alternateName: "Coach JDC",
        jobTitle: "Coach and Founder",
        worksFor: { "@id": orgId },
        url: `${offerUrl}/#coach`,
        image: mastermindOffer.coachImage,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: offerUrl,
        name: "JDC Mastermind",
        description,
        inLanguage: "en-PH",
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: offerUrl,
        name: title,
        description,
        isPartOf: { "@id": websiteId },
        about: { "@id": courseId },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: ogImageUrl,
          width: mastermindOffer.ogImageWidth,
          height: mastermindOffer.ogImageHeight,
        },
      },
      {
        "@type": "Course",
        "@id": courseId,
        name: "JDC Mastermind",
        description,
        url: offerUrl,
        image: ogImageUrl,
        inLanguage: "en-PH",
        provider: { "@id": orgId },
        instructor: { "@id": personId },
        educationalLevel: "Professional development",
        audience: {
          "@type": "Audience",
          audienceType: "Network marketers, entrepreneurs, aspiring leaders, and OFWs",
        },
        hasCourseInstance: mastermindOffer.sessions.slice(0, 2).map((session) => ({
          "@type": "CourseInstance",
          name: session.title,
          description: session.body,
          courseMode: "online",
        })),
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/building/checkout?src=duplication`,
          price: String(mastermindOffer.offerPrice),
          priceCurrency: "PHP",
          availability: "https://schema.org/InStock",
          category: "Lifetime access",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${offerUrl}/#faq`,
        mainEntity: mastermindOffer.faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
