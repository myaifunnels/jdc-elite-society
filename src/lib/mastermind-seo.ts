import type { Metadata } from "next";

import { mastermindOffer } from "@/data/mastermind-offer";
import { eliteSiteUrl, siteUrl } from "@/lib/site";

const ogImageUrl = `${siteUrl}${mastermindOffer.ogImage}`;

export const mastermindSeo: Metadata = {
  metadataBase: new URL(eliteSiteUrl),
  title: {
    absolute: mastermindOffer.title,
  },
  description: mastermindOffer.description,
  applicationName: "JDC Mastermind",
  authors: [{ name: "Coach Jayson Dela Cruz", url: eliteSiteUrl }],
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
    canonical: eliteSiteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: eliteSiteUrl,
    siteName: "JDC Mastermind",
    title: mastermindOffer.title,
    description: mastermindOffer.description,
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
    title: mastermindOffer.title,
    description: mastermindOffer.description,
    images: [
      {
        url: ogImageUrl,
        alt: mastermindOffer.ogImageAlt,
      },
    ],
  },
};

export function mastermindJsonLd() {
  const orgId = `${eliteSiteUrl}/#organization`;
  const personId = `${eliteSiteUrl}/#coach`;
  const websiteId = `${eliteSiteUrl}/#website`;
  const webpageId = `${eliteSiteUrl}/#webpage`;
  const courseId = `${eliteSiteUrl}/#course`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "JDC Elite Society",
        alternateName: ["JDC Mastermind", "Coach JDC"],
        url: eliteSiteUrl,
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
        url: `${eliteSiteUrl}/#coach`,
        image: mastermindOffer.coachImage,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: eliteSiteUrl,
        name: "JDC Mastermind",
        description: mastermindOffer.description,
        inLanguage: "en-PH",
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: eliteSiteUrl,
        name: mastermindOffer.title,
        description: mastermindOffer.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": courseId },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: ogImageUrl,
          width: mastermindOffer.ogImageWidth,
          height: mastermindOffer.ogImageHeight,
        },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".elite-identity-headline", ".elite-hero-positioning", ".elite-faq h3"],
        },
      },
      {
        "@type": "Course",
        "@id": courseId,
        name: "JDC Mastermind",
        description: mastermindOffer.description,
        url: eliteSiteUrl,
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
          url: `${eliteSiteUrl}/checkout`,
          price: String(mastermindOffer.offerPrice),
          priceCurrency: "PHP",
          availability: "https://schema.org/InStock",
          category: "Lifetime access",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${eliteSiteUrl}/#faq`,
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
