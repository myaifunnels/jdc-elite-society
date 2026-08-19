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
});

export type LeadInput = z.infer<typeof leadSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is required."),
    email: z.email("Enter a valid email."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    memberships: z.array(z.enum(membershipOptions)).min(1, "Choose Spartans, JES Member, or both."),
    bestDescribesYou: z.enum(audienceOptions, { message: "Tell me what best describes you." }),
    dateOfBirth: z.string().min(1, "Date of birth is required."),
    address: z.string().min(5, "Address is required."),
    facebookProfileUrl: z.string().optional().default(""),
    facebookPhotoUrl: z.string().optional().default(""),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
