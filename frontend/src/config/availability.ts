// The API is the source of truth; this describes the public scheduling contract.
export type Schedule = {
  timezone: "UTC";
  workingDays: number[];
  startHour: number;
  endHour: number;
  durationMinutes: number;
  advanceDays: number;
  minimumNoticeHours: number;
  unavailableDates: string[];
  blockedSlots: string[];
};
