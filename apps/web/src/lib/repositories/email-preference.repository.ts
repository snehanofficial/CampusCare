import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { apiClient } from "../api-client.js";

export interface EmailPreferenceItem {
  event: string;
  label: string;
  enabled: boolean;
}

// Local mock state for preferences in sandbox mode
let mockEmailPrefs: EmailPreferenceItem[] = [
  { event: "USER_CREATED", label: "User Registered / Created", enabled: true },
  { event: "USER_UPDATED", label: "User Information Modified", enabled: true },
  { event: "TICKET_CREATED", label: "Ticket Created", enabled: true },
  { event: "TICKET_ASSIGNED", label: "Ticket Assigned", enabled: true },
  { event: "TICKET_RESOLVED", label: "Ticket Resolved", enabled: true },
  { event: "INCIDENT_CREATED", label: "Incident Created", enabled: true },
  { event: "ASSET_ASSIGNED", label: "Asset Assigned", enabled: true },
  { event: "MAINTENANCE_REMINDER", label: "Maintenance Reminder", enabled: true },
  { event: "INVENTORY_LOW_STOCK", label: "Inventory Low Stock", enabled: true },
  { event: "SYSTEM_ANNOUNCEMENT", label: "System Announcements / Broadcasts", enabled: true },
];

export class EmailPreferenceRepository {
  /**
   * Retrieve email preferences list for the current session user.
   */
  async getPreferences(): Promise<EmailPreferenceItem[]> {
    if (isMockEnabled()) {
      return simulateDelay([...mockEmailPrefs]);
    }
    const response = await apiClient.get("/email-preferences");
    return response.data?.data || [];
  }

  /**
   * Bulk update email preference list.
   */
  async updatePreferences(
    preferences: Array<{ eventType: string; enabled: boolean }>
  ): Promise<boolean> {
    if (isMockEnabled()) {
      preferences.forEach((update) => {
        const item = mockEmailPrefs.find((p) => p.event === update.eventType);
        if (item) {
          item.enabled = update.enabled;
        }
      });
      return simulateDelay(true);
    }
    await apiClient.put("/email-preferences", { preferences });
    return true;
  }
}

export const emailPreferenceRepository = new EmailPreferenceRepository();
export default emailPreferenceRepository;
