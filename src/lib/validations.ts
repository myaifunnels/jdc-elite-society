import { z } from "zod";

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

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(["member", "partner"], { message: "Choose how you are joining." }),
  bestDescribesYou: z.enum(audienceOptions, { message: "Tell me what best describes you." }),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
