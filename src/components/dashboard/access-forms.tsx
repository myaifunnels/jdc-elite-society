"use client";

import { CAPABILITIES, type AccessMap, type AccessOverride, type AccessRole } from "@/lib/access";

export function RoleDefaultsForm({
  role,
  defaults,
  action,
}: {
  role: AccessRole;
  defaults: AccessMap;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="access-form">
      <input type="hidden" name="role" value={role} />
      <ul className="access-capability-list">
        {CAPABILITIES.map((item) => (
          <li key={item.id}>
            <label>
              <input type="checkbox" name={`cap:${item.id}`} defaultChecked={defaults[item.id]} />
              <span>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button type="submit" className="macos-btn macos-btn-primary">
        Save {role} defaults
      </button>
    </form>
  );
}

export function UserAccessForm({
  userId,
  role,
  defaults,
  overrides,
  action,
}: {
  userId: string;
  role: AccessRole;
  defaults: AccessMap;
  overrides: AccessOverride;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="access-form">
      <input type="hidden" name="userId" value={userId} />
      <label className="access-role-select">
        Access role
        <select name="role" defaultValue={role}>
          <option value="admin">Admin</option>
          <option value="partner">Partner</option>
          <option value="member">Member</option>
          <option value="contact">Contact</option>
        </select>
      </label>
      <ul className="access-capability-list">
        {CAPABILITIES.map((item) => {
          const override = overrides[item.id];
          const value = typeof override === "boolean" ? (override ? "allow" : "deny") : "inherit";
          return (
            <li key={item.id}>
              <span>
                <strong>{item.label}</strong>
                <em>
                  Default {defaults[item.id] ? "on" : "off"}. {item.detail}
                </em>
              </span>
              <select name={`cap:${item.id}`} defaultValue={value}>
                <option value="inherit">Inherit</option>
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>
            </li>
          );
        })}
      </ul>
      <button type="submit" className="macos-btn macos-btn-primary">
        Save this person&apos;s access
      </button>
    </form>
  );
}
