import { MacosSpinner } from "@/components/dashboard/macos-spinner";

export default function DashboardLoading() {
  return (
    <div className="macos-route-loading">
      <MacosSpinner size={40} />
      <p>Loading</p>
    </div>
  );
}
