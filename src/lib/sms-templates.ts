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
      "Salamat, {{name}}!\n\nNatanggap na namin ang iyong JDC Mastermind payment ({{price}}).\n\nBukas na ang access mo ngayon din — hindi ka na kailangang maghintay.\n\nI-check ang iyong dashboard para sa mga update.",
  },
  {
    key: "mastermind_purchase_team",
    label: "JDC Mastermind — payment received (team alert)",
    description: "Sent to the team notify number when a new Mastermind payment comes in.",
    vars: ["name", "price", "paymentMethod"],
    defaultBody: "New JDC Mastermind payment: {{name}} · {{price}} · {{paymentMethod}}.\n\nVerify the receipt on the dashboard.",
  },
  {
    key: "coaching_offer_buyer",
    label: "1-on-1 Coaching — payment received (buyer)",
    description: "Sent to the buyer after they grab the post-checkout coaching offer.",
    vars: ["name", "price", "hours"],
    defaultBody:
      "Salamat, {{name}}!\n\nNatanggap na namin ang iyong 1-on-1 Coaching payment ({{price}}) para sa {{hours}}.\n\nMage-message kami para i-schedule ang session mo.",
  },
  {
    key: "coaching_offer_team",
    label: "1-on-1 Coaching — payment received (team alert)",
    description: "Sent to the team notify number when a coaching add-on payment comes in.",
    vars: ["name", "price", "format"],
    defaultBody: "New Coaching add-on: {{name}} · {{format}} · {{price}}.\n\nVerify the receipt on the dashboard.",
  },
  {
    key: "payment_approved",
    label: "Payment approved",
    description: "Sent to the buyer when an admin approves their Mastermind payment.",
    vars: ["name"],
    defaultBody: "Hi {{name}}, verified na ang iyong JDC Mastermind payment!\n\nBuo na ang access mo. I-check ang iyong dashboard.",
  },
  {
    key: "payment_rejected",
    label: "Payment rejected",
    description: "Sent to the buyer when an admin rejects their Mastermind payment.",
    vars: ["name"],
    defaultBody:
      "Hi {{name}}, hindi namin na-verify ang iyong resibo.\n\nNaka-lock muna ang University access mo.\n\nPakitingnan ang iyong dashboard o makipag-ugnayan sa amin para malutas ito.",
  },
];

export function definitionFor(key: SmsTemplateKey) {
  return SMS_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => (name in vars ? vars[name] : match));
}
