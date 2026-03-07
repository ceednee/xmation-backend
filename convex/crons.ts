import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

/**
 * Cron job: Sync mentions every 5 minutes
 */
crons.interval(
  "Sync mentions",
  { minutes: 5 },
  api.sync.syncMentionsCron
);

/**
 * Cron job: Sync followers every 30 minutes
 */
crons.interval(
  "Sync followers",
  { minutes: 30 },
  api.sync.syncFollowersCron
);

/**
 * Cron job: Sync timeline every 15 minutes
 */
crons.interval(
  "Sync timeline",
  { minutes: 15 },
  api.sync.syncTimelineCron
);

export default crons;
