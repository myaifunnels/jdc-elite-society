export type SmsTemplateKey =
  | "mastermind_purchase_buyer"
  | "mastermind_purchase_team"
  | "coaching_offer_buyer"
  | "coaching_offer_team"
  | "payment_approved"
  | "payment_rejected"
  | "password_reset"
  | "university_welcome"
  | "support_ticket_member"
  | "support_ticket_team"
  | "support_reply_member"
  | "support_reply_team"
  | "support_status_member"
  | "receipt_reupload_team";

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

export const SMS_TEMPLATE_GROUPS: Array<{ id: string; label: string; keys: SmsTemplateKey[] }> = [
  { id: "auth", label: "Account", keys: ["password_reset", "university_welcome"] },
  {
    id: "elite",
    label: "JDC Elite Society",
    keys: [
      "mastermind_purchase_buyer",
      "mastermind_purchase_team",
      "coaching_offer_buyer",
      "coaching_offer_team",
      "payment_approved",
      "payment_rejected",
      "receipt_reupload_team",
    ],
  },
  {
    id: "support",
    label: "Support",
    keys: ["support_ticket_member", "support_ticket_team", "support_reply_member", "support_reply_team", "support_status_member"],
  },
];

export const SMS_TEMPLATE_DEFINITIONS: SmsTemplateDefinition[] = [
  {
    key: "password_reset",
    label: "Forgot password — reset code",
    description: "Sent when someone requests a password reset. Use {{code}} — do not put long links in SMS.",
    vars: ["name", "code"],
    defaultBody:
      "Hi {{name}},\n\nYour JDC Elite Society password reset code is {{code}}. It expires in 1 hour.\n\nIf you did not ask for this, ignore this text.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "university_welcome",
    label: "University access open",
    description: "Sent when University / Mastermind access is granted and a portal account is ready.",
    vars: ["name"],
    defaultBody:
      "Hi {{name}},\n\nYour JDC Elite Society University is open. Mastermind Sessions 1 and 2 are in your dashboard.\n\nOpen your dashboard to sign in. If you have not set a password yet, use Forgot password.\n\nBest Regards,\n-Team JDC Elite Society",
  },
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
      "Hi {{name}},\n\nWe could not verify your receipt, so your University access is on hold for now.\n\nOpen Support on your dashboard to send a new receipt or message us.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "receipt_reupload_team",
    label: "Receipt re-uploaded (team alert)",
    description: "Sent to the team when a member uploads a new payment receipt from Support.",
    vars: ["name", "email"],
    defaultBody:
      "A member re-uploaded a Mastermind receipt.\n\nName: {{name}}\nEmail: {{email}}\n\nReview it on Contacts → Payment Verification.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "support_ticket_member",
    label: "Support ticket opened (member)",
    description: "Confirms to the member that their support ticket was created.",
    vars: ["name", "subject"],
    defaultBody:
      "Hi {{name}},\n\nWe received your support request: {{subject}}.\n\nOur team will reply in your dashboard Support inbox.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "support_ticket_team",
    label: "Support ticket opened (team alert)",
    description: "Sent to the team notify number when a customer opens a ticket.",
    vars: ["name", "subject", "category"],
    defaultBody:
      "New support ticket.\n\nFrom: {{name}}\nCategory: {{category}}\nSubject: {{subject}}\n\nOpen Support on the dashboard to reply.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "support_reply_member",
    label: "Support reply (member)",
    description: "Sent to the member when an admin replies.",
    vars: ["name", "subject", "preview"],
    defaultBody:
      "Hi {{name}},\n\nJDC Support replied on {{subject}}:\n{{preview}}\n\nOpen Support on your dashboard to continue the conversation.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "support_reply_team",
    label: "Support reply (team alert)",
    description: "Sent to the team when a member replies on an open ticket.",
    vars: ["name", "subject", "preview"],
    defaultBody:
      "Member reply on support.\n\nFrom: {{name}}\nTicket: {{subject}}\n{{preview}}\n\nOpen Support on the dashboard.\n\nBest Regards,\n-Team JDC Elite Society",
  },
  {
    key: "support_status_member",
    label: "Support status update (member)",
    description: "Sent when an admin changes ticket status (waiting, resolved, completed).",
    vars: ["name", "subject", "status"],
    defaultBody:
      "Hi {{name}},\n\nYour support ticket {{subject}} is now {{status}}.\n\nOpen Support on your dashboard for details.\n\nBest Regards,\n-Team JDC Elite Society",
  },
];

export function definitionFor(key: SmsTemplateKey) {
  return SMS_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
}

export function isSmsTemplateKey(value: string): value is SmsTemplateKey {
  return SMS_TEMPLATE_DEFINITIONS.some((item) => item.key === value);
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => (name in vars ? vars[name] : match));
}
