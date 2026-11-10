import { MacosSpinner } from "@/components/dashboard/macos-spinner";

export default function ContactsLoading() {
  return (
    <div className="macos-route-loading">
      <MacosSpinner size={40} />
      <p>Loading contacts</p>
    </div>
  );
}
