export interface MockChartDataPoint {
  name: string;
  opened: number;
  resolved: number;
  [key: string]: any;
}

export interface MockCategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface MockMttrDataPoint {
  name: string;
  hours: number;
}

export const mockTicketVolumeData: MockChartDataPoint[] = [
  { name: "Jul 25", opened: 18, resolved: 14 },
  { name: "Jul 26", opened: 22, resolved: 19 },
  { name: "Jul 27", opened: 30, resolved: 25 },
  { name: "Jul 28", opened: 28, resolved: 27 },
  { name: "Jul 29", opened: 20, resolved: 23 },
  { name: "Jul 30", opened: 15, resolved: 18 },
  { name: "Jul 31", opened: 25, resolved: 21 },
];

export const mockCategoryData: MockCategoryDataPoint[] = [
  { name: "Wi-Fi & Network", value: 45, color: "#3b82f6" },
  { name: "Software Licenses", value: 25, color: "#10b981" },
  { name: "Hardware Repair", value: 18, color: "#f59e0b" },
  { name: "User Accounts", value: 12, color: "#ef4444" },
];

export const mockMttrData: MockMttrDataPoint[] = [
  { name: "Week 1", hours: 4.8 },
  { name: "Week 2", hours: 4.2 },
  { name: "Week 3", hours: 3.5 },
  { name: "Week 4", hours: 2.8 },
];

export const mockSlaCompliance = {
  currentRate: 94.6,
  targetRate: 95.0,
  historicalTrend: [
    { month: "May", rate: 91.2 },
    { month: "Jun", rate: 93.4 },
    { month: "Jul", rate: 94.6 },
  ]
};
