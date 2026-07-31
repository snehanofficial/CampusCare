import { AlertCircle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { StatCard } from "../../../components/common/StatCard.js";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to CampusCare Help Desk & IT Service Management."
      />

      {/* Grid of StatCards (Scaffold) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value="12"
          delta={{ value: 4.8, isPositive: false }}
          icon={Clock}
        />
        <StatCard
          title="Critical Incidents"
          value="1"
          delta={{ value: 50, isPositive: false }}
          icon={ShieldAlert}
        />
        <StatCard
          title="Active Assets"
          value="1,248"
          delta={{ value: 1.2, isPositive: true }}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Approvals"
          value="3"
          icon={AlertCircle}
        />
      </div>

      {/* Service Status & Recent activity Scaffold */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              System Service Status
            </h3>
            <div className="space-y-3">
              {[
                { name: "Campus Wi-Fi", status: "Operational", color: "bg-success" },
                { name: "Active Directory Identity", status: "Operational", color: "bg-success" },
                { name: "LMS Canvas", status: "Degraded Performance", color: "bg-warning" },
                { name: "Student Info System SIS", status: "Operational", color: "bg-success" },
                { name: "Campus Email System", status: "Operational", color: "bg-success" },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/40"
                >
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${service.color}`} />
                    <span className="text-xs text-muted-foreground">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent System Activity
          </h3>
          <div className="space-y-4">
            {[
              { time: "10m ago", text: "Ticket INC-1029 assigned to IT Support Team" },
              { time: "1h ago", text: "Wi-Fi access point in Library restarted" },
              { time: "3h ago", text: "New asset tag #CC-LAP-4029 generated" },
              { time: "1d ago", text: "SLA Policy configured for CRITICAL priority" },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-3 text-xs">
                <span className="text-muted-foreground whitespace-nowrap">{activity.time}</span>
                <span className="text-foreground font-medium">{activity.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
