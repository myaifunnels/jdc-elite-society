"use client";

import { useActionState, useState } from "react";

import {
  PartnershipFormState,
  saveAffiliateCampaign,
  saveAffiliateMaterial,
  saveAffiliatePayoutMethod,
  grantAffiliateAccess,
  markAffiliateCyclePaid,
  recordAffiliateSale,
  updateAffiliateProfile,
  voidAffiliateSale,
} from "@/app/dashboard/partnership/actions";
import { FloatField } from "@/components/forms/float-field";
import { AffiliatePayoutMethod, AffiliateProfile, AuthUser, PayoutMethodKind } from "@/lib/types";
import { maskAccountNumber } from "@/lib/affiliate";
import { formatPhp } from "@/lib/pay-cycle";

const initial: PartnershipFormState = {};

export function GrantAccessForm({
  users,
  profiles,
}: {
  users: AuthUser[];
  profiles: AffiliateProfile[];
}) {
  const [state, action, pending] = useActionState(grantAffiliateAccess, initial);
  const candidates = users.filter((user) => !user.affiliateAccess);

  return (
    <form action={action} className="grid gap-3">
      <label className="auth-field">
        User
        <select name="userId" className="macos-select" required defaultValue="">
          <option value="" disabled>
            Choose a user
          </option>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} · {user.email} · {user.role}
            </option>
          ))}
        </select>
      </label>
      <label className="auth-field">
        Sponsor (optional)
        <select name="sponsorId" className="macos-select" defaultValue="">
          <option value="">No sponsor</option>
          {profiles.map((profile) => {
            const person = users.find((item) => item.id === profile.userId);
            return (
              <option key={profile.userId} value={profile.userId}>
                {person?.name ?? profile.code} · {profile.code}
              </option>
            );
          })}
        </select>
      </label>
      <FloatField label="Commission rate (0.20 = 20%)">
        <input name="commissionRate" type="number" step="0.01" min="0.01" max="1" defaultValue="0.20" placeholder=" " />
      </FloatField>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Granting…" : "Grant access"}
      </button>
    </form>
  );
}

export function UpdateAffiliateForm({
  profile,
  users,
  profiles,
}: {
  profile: AffiliateProfile;
  users: AuthUser[];
  profiles: AffiliateProfile[];
}) {
  const [state, action, pending] = useActionState(updateAffiliateProfile, initial);
  const person = users.find((item) => item.id === profile.userId);

  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-[var(--line)] p-4">
      <input type="hidden" name="userId" value={profile.userId} />
      <p className="text-sm font-semibold">{person?.name ?? profile.code}</p>
      <p className="text-xs text-[var(--muted)]">
        {person?.email} · /go/{profile.code}
      </p>
      <label className="auth-field">
        Status
        <select name="status" className="macos-select" defaultValue={profile.status}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="invited">Invited</option>
        </select>
      </label>
      <label className="auth-field">
        Sponsor
        <select name="sponsorId" className="macos-select" defaultValue={profile.sponsorId}>
          <option value="">No sponsor</option>
          {profiles
            .filter((item) => item.userId !== profile.userId)
            .map((item) => {
              const sponsor = users.find((user) => user.id === item.userId);
              return (
                <option key={item.userId} value={item.userId}>
                  {sponsor?.name ?? item.code}
                </option>
              );
            })}
        </select>
      </label>
      <FloatField label="Commission rate">
        <input
          name="commissionRate"
          type="number"
          step="0.01"
          min="0.01"
          max="1"
          defaultValue={String(profile.commissionRate)}
          placeholder=" "
        />
      </FloatField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="regenerateCode" />
        Regenerate share code
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="revoke" />
        Revoke dashboard access
      </label>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-secondary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : "Save partner"}
      </button>
    </form>
  );
}

export function RecordSaleForm({
  users,
  profiles,
}: {
  users: AuthUser[];
  profiles: AffiliateProfile[];
}) {
  const [state, action, pending] = useActionState(recordAffiliateSale, initial);

  return (
    <form action={action} className="grid gap-3">
      <label className="auth-field">
        Affiliate
        <select name="affiliateUserId" className="macos-select" required defaultValue="">
          <option value="" disabled>
            Choose affiliate
          </option>
          {profiles.map((profile) => {
            const person = users.find((item) => item.id === profile.userId);
            return (
              <option key={profile.userId} value={profile.userId}>
                {person?.name ?? profile.code} · {Math.round(profile.commissionRate * 100)}%
              </option>
            );
          })}
        </select>
      </label>
      <FloatField label="Gross sale amount (PHP)">
        <input name="grossAmount" type="number" min="1" step="0.01" required placeholder=" " />
      </FloatField>
      <FloatField label="Sale date (Manila)">
        <input name="soldAt" type="date" placeholder=" " />
      </FloatField>
      <FloatField label="Note (program, member, etc.)">
        <input name="source" placeholder=" " />
      </FloatField>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : "Record 20% commission"}
      </button>
    </form>
  );
}

export function MarkPaidForm({
  affiliateUserId,
  scheduledPayDate,
  amount,
}: {
  affiliateUserId: string;
  scheduledPayDate: string;
  amount: number;
}) {
  const [state, action, pending] = useActionState(markAffiliateCyclePaid, initial);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="affiliateUserId" value={affiliateUserId} />
      <input type="hidden" name="scheduledPayDate" value={scheduledPayDate} />
      <FloatField label="GCash / bank reference">
        <input name="reference" required placeholder=" " />
      </FloatField>
      <FloatField label="Note">
        <input name="note" placeholder=" " />
      </FloatField>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : `Mark ${formatPhp(amount)} paid`}
      </button>
    </form>
  );
}

export function VoidSaleForm({ saleId }: { saleId: string }) {
  const [state, action, pending] = useActionState(voidAffiliateSale, initial);
  return (
    <form action={action}>
      <input type="hidden" name="saleId" value={saleId} />
      <button type="submit" disabled={pending} className="text-xs text-red-400 underline disabled:opacity-70">
        {pending ? "Voiding…" : "Void"}
      </button>
      {state.error ? <p className="text-xs text-red-500">{state.error}</p> : null}
    </form>
  );
}

export function PayoutMethodForm({ method }: { method: AffiliatePayoutMethod | null }) {
  const [state, action, pending] = useActionState(saveAffiliatePayoutMethod, initial);
  const [payoutKind, setPayoutKind] = useState<PayoutMethodKind>(method?.method ?? "gcash");

  return (
    <form action={action} className="grid gap-3">
      <label className="auth-field">
        Method
        <select
          name="method"
          className="macos-select"
          value={payoutKind}
          onChange={(event) => setPayoutKind(event.target.value as PayoutMethodKind)}
        >
          <option value="gcash">GCash</option>
          <option value="maya">Maya</option>
          <option value="bank">Bank transfer</option>
          <option value="other">Other e-wallet</option>
        </select>
      </label>
      {payoutKind === "other" ? (
        <FloatField label="Which e-wallet?">
          <input name="bankName" defaultValue={method?.bankName ?? ""} placeholder=" " required />
        </FloatField>
      ) : (
        <FloatField label="Bank or wallet name">
          <input name="bankName" defaultValue={method?.bankName ?? ""} placeholder=" " />
        </FloatField>
      )}
      <FloatField label="Account name">
        <input name="accountName" defaultValue={method?.accountName ?? ""} required placeholder=" " />
      </FloatField>
      <FloatField label="Account or mobile number">
        <input name="accountNumber" defaultValue={method?.accountNumber ?? ""} required placeholder=" " />
      </FloatField>
      {method?.accountNumber ? (
        <p className="text-xs text-[var(--muted)]">Currently on file: {maskAccountNumber(method.accountNumber)}</p>
      ) : null}
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : "Save payout details"}
      </button>
    </form>
  );
}

export function CampaignForm() {
  const [state, action, pending] = useActionState(saveAffiliateCampaign, initial);
  return (
    <form action={action} className="grid gap-3">
      <FloatField label="Slug (facebook, register)">
        <input name="slug" required placeholder=" " />
      </FloatField>
      <FloatField label="Title">
        <input name="title" required placeholder=" " />
      </FloatField>
      <FloatField label="Description">
        <input name="description" placeholder=" " />
      </FloatField>
      <FloatField label="Destination path">
        <input name="destinationPath" defaultValue="/register" required placeholder=" " />
      </FloatField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Active
      </label>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : "Save campaign"}
      </button>
    </form>
  );
}

export function MaterialForm() {
  const [state, action, pending] = useActionState(saveAffiliateMaterial, initial);
  return (
    <form action={action} className="grid gap-3">
      <FloatField label="Title">
        <input name="title" required placeholder=" " />
      </FloatField>
      <FloatField label="Category">
        <input name="category" defaultValue="Logos" placeholder=" " />
      </FloatField>
      <FloatField label="File URL (R2 or CDN)">
        <input name="fileUrl" required placeholder=" " />
      </FloatField>
      <FloatField label="File name">
        <input name="fileName" placeholder=" " />
      </FloatField>
      <FloatField label="Sort order">
        <input name="sortOrder" type="number" defaultValue="0" placeholder=" " />
      </FloatField>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button type="submit" disabled={pending} className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70">
        {pending ? "Saving…" : "Add material"}
      </button>
    </form>
  );
}
