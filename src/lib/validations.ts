import { z } from "zod";

import { membershipOptions } from "@/lib/membership";

export const audienceOptions = [
  "OFW",
  "Employee",
  "First-time entrepreneur",
  "Business owner",
  "Professional",
  "Other",
] as const;

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.email("Enter a valid email."),
  phone: z.string().min(7, "Phone is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  tags: z.string().min(2, "Add at least one tag."),
  bestDescribesYou: z.string().optional(),
  programInterest: z.string().min(2, "Select a program."),
  assignedPartner: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    email: z.email("Enter a valid email."),
    phone: z.string().min(8, "Phone number is required."),
    phoneCountry: z.string().min(2, "Choose a country."),
    company: z.string().min(2, "Company is required."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const completeProfileSchema = z
  .object({
    memberships: z.array(z.enum(membershipOptions)).min(1, "Choose Spartans, JES Member, or both."),
    bestDescribesYou: z.enum(audienceOptions, { message: "Tell me what best describes you." }),
    bestDescribesYouOther: z.string().optional().default(""),
    dateOfBirth: z.string().min(1, "Date of birth is required."),
    address: z.string().min(5, "Address is required."),
    facebookProfileUrl: z.string().optional().default(""),
  })
  .refine((value) => value.bestDescribesYou !== "Other" || value.bestDescribesYouOther.trim().length >= 2, {
    message: "Tell us what “other” is.",
    path: ["bestDescribesYouOther"],
  });

export function resolveAudienceLabel(option: string, other = "") {
  if (option === "Other") {
    const detail = other.trim();
    return detail ? `Other: ${detail}` : "Other";
  }

  return option;
}

export function splitAudienceValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { option: "" as const, other: "" };
  }
  if (trimmed === "Other" || trimmed.startsWith("Other:")) {
    return { option: "Other" as const, other: trimmed.replace(/^Other:\s*/i, "").trim() };
  }
  if ((audienceOptions as readonly string[]).includes(trimmed)) {
    return { option: trimmed as (typeof audienceOptions)[number], other: "" };
  }
  return { option: "Other" as const, other: trimmed };
}

export const accountProfileSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    company: z.string().min(2, "Company is required."),
    phone: z.string().min(8, "Phone number is required."),
    phoneCountry: z.string().min(2, "Choose a country."),
    memberships: z.array(z.enum(membershipOptions)),
    bestDescribesYou: z.enum(audienceOptions, { message: "Tell me what best describes you." }),
    bestDescribesYouOther: z.string().optional().default(""),
    dateOfBirth: z.string().min(1, "Date of birth is required."),
    address: z.string().min(5, "Address is required."),
    facebookProfileUrl: z.string().optional().default(""),
    currentPassword: z.string().optional().default(""),
    newPassword: z.string().optional().default(""),
    confirmPassword: z.string().optional().default(""),
    requireMembership: z.boolean().optional().default(true),
  })
  .refine((value) => value.bestDescribesYou !== "Other" || value.bestDescribesYouOther.trim().length >= 2, {
    message: "Tell us what “other” is.",
    path: ["bestDescribesYouOther"],
  })
  .refine((value) => !value.requireMembership || value.memberships.length >= 1, {
    message: "Choose Spartans, JES Member, or both.",
    path: ["memberships"],
  })
  .refine((value) => !value.newPassword || value.newPassword.length >= 8, {
    message: "Use at least 8 characters.",
    path: ["newPassword"],
  })
  .refine((value) => !value.newPassword || value.newPassword === value.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => !value.newPassword || value.currentPassword.length >= 1, {
    message: "Enter your current password to change it.",
    path: ["currentPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "This reset link is missing or incomplete."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export const elitePaymentMethods = ["BPI Bank", "GCash"] as const;

export const eliteCheckoutSchema = z
  .object({
    fullName: z.string().min(2, "Kailangan ang iyong buong pangalan."),
    email: z.email("Hindi wastong email format."),
    mobile: z
      .string()
      .min(1, "Kailangan ang iyong mobile number.")
      .refine((value) => /^09\d{2}\s?\d{3}\s?\d{4}$/.test(value.replace(/-/g, "")), {
        message: "Format: 09XX XXX XXXX",
      }),
    password: z.string().min(8, "Use at least 8 characters for your password."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    paymentMethod: z.enum(elitePaymentMethods, { message: "Pumili ng payment method." }),
    couponCode: z.string().optional().default(""),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type EliteCheckoutInput = z.infer<typeof eliteCheckoutSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
