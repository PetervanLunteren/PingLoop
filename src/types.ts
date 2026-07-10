/**
 * A run, as the worker defines it. Pings happen on the grid
 * `fireAt + k * intervalMs`, and the run stops at `until`.
 *
 * The worker owns this. The app only reads it and draws a countdown.
 */
export interface Schedule {
  fireAt: number;
  intervalMs: number;
  until: number;
}
