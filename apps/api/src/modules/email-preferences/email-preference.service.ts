import { EmailPreferenceRepository } from "./email-preference.repository.js";

// Centralized extensible email event registry
export const EMAIL_EVENTS = [
  { event: "USER_CREATED", label: "User Registered / Created" },
  { event: "USER_UPDATED", label: "User Information Modified" },
  { event: "TICKET_CREATED", label: "Ticket Created" },
  { event: "TICKET_ASSIGNED", label: "Ticket Assigned" },
  { event: "TICKET_RESOLVED", label: "Ticket Resolved" },
  { event: "INCIDENT_CREATED", label: "Incident Created" },
  { event: "ASSET_ASSIGNED", label: "Asset Assigned" },
  { event: "MAINTENANCE_REMINDER", label: "Maintenance Reminder" },
  { event: "INVENTORY_LOW_STOCK", label: "Inventory Low Stock" },
  { event: "SYSTEM_ANNOUNCEMENT", label: "System Announcements / Broadcasts" }
] as const;

export class EmailPreferenceService {
  /**
   * Hydrates all available system email events with the user's specific settings.
   */
  static async getHydratedUserPreferences(userId: string) {
    const dbPrefs = await EmailPreferenceRepository.getPreferencesByUserId(userId);
    const dbPrefsMap = new Map<string, boolean>(
      dbPrefs.map((p) => [p.eventType, p.enabled])
    );

    return EMAIL_EVENTS.map((item) => {
      const enabledVal = dbPrefsMap.get(item.event);
      return {
        event: item.event,
        label: item.label,
        enabled: enabledVal !== undefined ? enabledVal : true
      };
    });
  }

  /**
   * Update preference list for a user.
   */
  static async updateUserPreferences(
    userId: string,
    updates: Array<{ eventType: string; enabled: boolean }>
  ) {
    return EmailPreferenceRepository.upsertPreferences(userId, updates);
  }

  /**
   * Evaluates notifications to identify their event registry mapping,
   * then checks whether email deliveries are enabled for the target user.
   */
  static async isEmailEnabledForNotification(params: {
    userId: string;
    category: string;
    title: string;
  }): Promise<boolean> {
    const eventType = this.mapNotificationToEmailEvent(params.category, params.title);
    if (!eventType) return true; // Default true if no registry match exists (e.g. password resets)

    return EmailPreferenceRepository.isEmailEnabled(params.userId, eventType);
  }

  /**
   * Standard event router parsing logic. Maps notification tags to registry keys.
   */
  static mapNotificationToEmailEvent(category: string, title: string): string | null {
    const catUpper = category?.toUpperCase();
    const titleLower = title?.toLowerCase();

    if (catUpper === "TICKET") {
      if (titleLower.includes("assigned")) return "TICKET_ASSIGNED";
      if (titleLower.includes("resolved") || titleLower.includes("closed")) return "TICKET_RESOLVED";
      return "TICKET_CREATED";
    }

    if (catUpper === "INCIDENT") {
      return "INCIDENT_CREATED";
    }

    if (catUpper === "ASSET") {
      if (titleLower.includes("assigned")) return "ASSET_ASSIGNED";
    }

    if (catUpper === "MAINTENANCE") {
      return "MAINTENANCE_REMINDER";
    }

    if (catUpper === "INVENTORY") {
      return "INVENTORY_LOW_STOCK";
    }

    if (catUpper === "SYSTEM") {
      return "SYSTEM_ANNOUNCEMENT";
    }

    if (titleLower.includes("user created") || titleLower.includes("registered user")) {
      return "USER_CREATED";
    }
    if (titleLower.includes("user updated")) {
      return "USER_UPDATED";
    }

    return null;
  }
}
export default EmailPreferenceService;
