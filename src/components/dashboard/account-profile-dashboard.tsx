"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Lock, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { AuthFormState } from "@/app/login/actions";
import { updateOwnAccountProfile } from "@/app/dashboard/profile/actions";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { PhoneField } from "@/components/forms/phone-field";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { nationalDigitsFromInternational } from "@/lib/countries";
import { membershipLabel, membershipTheme, type Membership } from "@/lib/membership";
import { AuthUser } from "@/lib/types";
import { audienceOptions, splitAudienceValue } from "@/lib/validations";

const initialState: AuthFormState = {};

function formatJoined(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function roleLabel(role: AuthUser["role"]) {
  if (role === "admin") return "Admin";
  if (role === "partner") return "Partner";
  if (role === "contact") return "Contact";
  return "Member";
}

export function AccountProfileDashboard({
  user,
  showWorkspaceLinks = false,
  needsAddressConfirm = false,
  mapAddress,
}: {
  user: AuthUser;
  showWorkspaceLinks?: boolean;
  needsAddressConfirm?: boolean;
  mapAddress?: string;
}) {
  const audience = useMemo(() => splitAudienceValue(user.bestDescribesYou ?? ""), [user.bestDescribesYou]);
  const [state, formAction, pending] = useActionState(updateOwnAccountProfile, initialState);
  const [memberships, setMemberships] = useState<Membership[]>(user.memberships);
  const [audienceOption, setAudienceOption] = useState<string>(audience.option);
  const firstName = user.name.split(" ")[0] || "there";
  const verified = user.accountStatus === "verified";
  const nationalPhone = nationalDigitsFromInternational(user.phoneCountry || "PH", user.phone || "");

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.membership ?? "";
    const next = membershipTheme(memberships);
    if (next) {
      root.dataset.membership = next;
    } else {
      delete root.dataset.membership;
    }

    return () => {
      if (previous) {
        root.dataset.membership = previous;
      } else {
        delete root.dataset.membership;
      }
    };
  }, [memberships]);

  function toggleMembership(value: Membership) {
    setMemberships((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <div className="account-dash">
      <section className="account-dash-hero">
        <div className="account-dash-hero-bg" aria-hidden />
        <div className="account-dash-hero-copy">
          <p className="macos-kicker">{verified ? "Your account" : "Finish and stay ready"}</p>
          <h2>{verified ? `${firstName}, this is your room.` : `${firstName}, make this yours.`}</h2>
          <p>
            {user.role === "contact" && needsAddressConfirm
              ? "Replace the temporary map address with your real location. Saving that address is how we verify a Contact account."
              : verified
                ? "Update your photo, details, and password anytime. This is the card the team and community see."
                : "Edit everything here. A complete profile is the first step toward an active member room."}
          </p>
        </div>
        <div className="account-dash-status">
          <span className={verified ? "account-chip is-live" : "account-chip"}>
            <ShieldCheck size={14} />
            {verified ? "Active" : "Pending"}
          </span>
          <span className="account-chip is-quiet">{roleLabel(user.role)}</span>
          <span className="account-chip is-quiet">{membershipLabel(user.memberships)}</span>
        </div>
      </section>

      <form action={formAction} className="account-dash-layout" encType="multipart/form-data" id="account-editor">
        <aside className="account-dash-card account-dash-identity">
          <PhotoUploadField defaultUrl={user.facebookPhotoUrl ?? ""} required={!user.facebookPhotoUrl} />
          <div className="account-dash-identity-meta">
            <strong>{user.name}</strong>
            <em>{user.email}</em>
          </div>
          <ul className="account-dash-facts">
            <li>
              <Mail size={16} />
              <span>
                Email
                <b>{user.email}</b>
              </span>
            </li>
            <li>
              <MapPin size={16} />
              <span>
                Location
                <b>{user.address || "Add your address"}</b>
              </span>
            </li>
            <li>
              <CalendarDays size={16} />
              <span>
                Joined
                <b>{formatJoined(user.createdAt)}</b>
              </span>
            </li>
            <li>
              <Sparkles size={16} />
              <span>
                Company
                <b>{user.company || "Add your company"}</b>
              </span>
            </li>
          </ul>
          {showWorkspaceLinks ? (
            <div className="account-dash-links">
              <Link href="/dashboard/university" className="macos-btn macos-btn-primary">
                Open University
              </Link>
              <Link href="/contact" className="macos-btn macos-btn-secondary">
                Talk to Coach JDC
              </Link>
            </div>
          ) : null}
        </aside>

        <div className="account-dash-main">
          <section className="account-dash-card">
            <header className="account-dash-section-head">
              <h3>Profile</h3>
              <p>Name, company, and how you show up in JDC Elite Society.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="auth-field">
                <span>Full name</span>
                <span className="auth-input-wrap">
                  <input name="name" defaultValue={user.name} autoComplete="name" required />
                </span>
              </label>
              <label className="auth-field">
                <span>Company</span>
                <span className="auth-input-wrap">
                  <input name="company" defaultValue={user.company} autoComplete="organization" required />
                </span>
              </label>
              <label className="auth-field">
                <span>Date of birth</span>
                <span className="auth-input-wrap">
                  <input
                    name="dateOfBirth"
                    type="date"
                    autoComplete="bday"
                    defaultValue={user.dateOfBirth ?? ""}
                    required
                  />
                </span>
              </label>
              <label className="auth-field">
                <span>What best describes you?</span>
                <span className="auth-input-wrap">
                  <select
                    name="bestDescribesYou"
                    value={audienceOption}
                    required
                    onChange={(event) => setAudienceOption(event.target.value)}
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    {audienceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              {audienceOption === "Other" ? (
                <label className="auth-field md:col-span-2">
                  <span>Tell us what “other” is</span>
                  <span className="auth-input-wrap">
                    <input
                      name="bestDescribesYouOther"
                      defaultValue={audience.other}
                      placeholder="e.g. Homemaker, student, freelancer"
                      required
                    />
                  </span>
                </label>
              ) : null}
              <label className="auth-field md:col-span-2">
                <span>Address</span>
                <span className="auth-input-wrap">
                  <AddressAutocomplete
                    name="address"
                    defaultValue={user.address || mapAddress || ""}
                    placeholder="Street, city, province or country"
                  />
                </span>
                {user.role === "contact" && needsAddressConfirm ? (
                  <em className="auth-field-hint">
                    This may still be a temporary pin. Change it to your real address, then save, so we can verify you.
                  </em>
                ) : null}
              </label>
              <label className="auth-field md:col-span-2">
                <span>Facebook profile URL</span>
                <span className="auth-input-wrap">
                  <input
                    name="facebookProfileUrl"
                    type="url"
                    defaultValue={user.facebookProfileUrl ?? ""}
                    placeholder="https://facebook.com/your.profile"
                  />
                </span>
              </label>
            </div>
          </section>

          <section className="account-dash-card">
            <header className="account-dash-section-head">
              <h3>Contact</h3>
              <p>Phone stays on your account and syncs to Go High Level when configured.</p>
            </header>
            <label className="auth-field">
              <span>Mobile number</span>
              <PhoneField defaultIso={user.phoneCountry || "PH"} defaultNational={nationalPhone} />
            </label>
          </section>

          <section className="account-dash-card">
            <header className="account-dash-section-head">
              <h3>Membership</h3>
              <p>JES means JDC Elite Society. Pick the room you belong in.</p>
            </header>
            <fieldset className="auth-roles">
              <legend className="sr-only">Membership</legend>
              <div className="auth-roles-row">
                <label>
                  <input
                    type="checkbox"
                    name="memberships"
                    value="spartan"
                    checked={memberships.includes("spartan")}
                    onChange={() => toggleMembership("spartan")}
                  />
                  Spartans
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="memberships"
                    value="jes"
                    checked={memberships.includes("jes")}
                    onChange={() => toggleMembership("jes")}
                  />
                  JES Member
                </label>
              </div>
            </fieldset>
          </section>

          <section className="account-dash-card">
            <header className="account-dash-section-head">
              <h3>
                <Lock size={16} />
                Password
              </h3>
              <p>Leave these blank to keep your current password.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="auth-field">
                <span>Current password</span>
                <span className="auth-input-wrap">
                  <input name="currentPassword" type="password" autoComplete="current-password" />
                </span>
              </label>
              <label className="auth-field">
                <span>New password</span>
                <span className="auth-input-wrap">
                  <input name="newPassword" type="password" autoComplete="new-password" />
                </span>
              </label>
              <label className="auth-field">
                <span>Confirm new password</span>
                <span className="auth-input-wrap">
                  <input name="confirmPassword" type="password" autoComplete="new-password" />
                </span>
              </label>
            </div>
          </section>

          <div className="account-dash-save">
            {state.error ? <p className="auth-error">{state.error}</p> : null}
            {state.success ? <p className="auth-success">{state.success}</p> : null}
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Saving account..." : "Save account"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
