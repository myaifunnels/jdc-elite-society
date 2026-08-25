export type SmsTemplateKey =
  | "mastermind_purchase_buyer"
  | "mastermind_purchase_team"
  | "coaching_offer_buyer"
  | "coaching_offer_team"
  | "payment_approved"
  | "payment_rejected";

export type SmsTemplateDefinition = {
  key: SmsTemplateKey;
  label: string;
  description: string;
  vars: string[];
  defaultBody: string;
};

export type SmsTemplate = {
  id: string;
  key: SmsTemplateKey | null;
  label: string;
  description: string;
  vars: string[];
  body: string;
  isCustom: boolean;
  updatedAt: string;
};

// Never include links — buyers are told to open their dashboard instead.
export const SMS_TEMPLATE_DEFINITIONS: SmsTemplateDefinition[] = [
  {
    key: "mastermind_purchase_buyer",
    label: "JDC Mastermind — payment received (buyer)",
    description: "Sent to the buyer the moment their Mastermind checkout is submitted.",
    vars: ["name", "price"],
    defaultBody:
      "Hi {{name}},\n\nYour JDC Mastermind payment of {{price}} is received. Your access is unlocked right now — no waiting.\n\nOpen your dashboard to get started.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "mastermind_purchase_team",
    label: "JDC Mastermind — payment received (team alert)",
    description: "Sent to the team notify number when a new Mastermind payment comes in.",
    vars: ["name", "price", "paymentMethod"],
    defaultBody:
      "New JDC Mastermind payment.\n\nName: {{name}}\nAmount: {{price}}\nMethod: {{paymentMethod}}\n\nVerify the receipt on the dashboard.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "coaching_offer_buyer",
    label: "1-on-1 Coaching — payment received (buyer)",
    description: "Sent to the buyer after they grab the post-checkout coaching offer.",
    vars: ["name", "price", "hours"],
    defaultBody:
      "Hi {{name}},\n\nYour 1-on-1 Coaching payment of {{price}} for {{hours}} is received.\n\nWe'll message you soon to schedule your session.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "coaching_offer_team",
    label: "1-on-1 Coaching — payment received (team alert)",
    description: "Sent to the team notify number when a coaching add-on payment comes in.",
    vars: ["name", "price", "format"],
    defaultBody:
      "New Coaching add-on.\n\nName: {{name}}\nFormat: {{format}}\nAmount: {{price}}\n\nVerify the receipt on the dashboard.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "payment_approved",
    label: "Payment approved",
    description: "Sent to the buyer when an admin approves their Mastermind payment.",
    vars: ["name"],
    defaultBody:
      "Hi {{name}},\n\nGreat news — your JDC Mastermind payment is verified. Your access is fully active.\n\nOpen your dashboard to get started.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "payment_rejected",
    label: "Payment rejected",
    description: "Sent to the buyer when an admin rejects their Mastermind payment.",
    vars: ["name"],
    defaultBody:
      "Hi {{name}},\n\nWe could not verify your receipt, so your University access is on hold for now.\n\nPlease open your dashboard or reach out to us to resolve this.\n\nBest Regards,\n-Team JDC Elite Society",
  },
];

export function definitionFor(key: SmsTemplateKey) {
  return SMS_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => (name in vars ? vars[name] : match));
}
