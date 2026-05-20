/** Kabinet live stats — client/server umumiy tip (Prisma import yo'q). */
export type KabinetLiveStatsPayload = {
  totalUsersDisplay: number;
  activeTestTakersDisplay: number;
  byCategory: Array<{
    category: string;
    label: string;
    activeNow: number;
  }>;
};
