export type Clock = { now(): number; sleep(ms: number): Promise<void> }

export const systemClock: Clock = {
	now: () => Date.now(),
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

// A UTC timestamp to the second, the form the lock file's fetchedAt uses.
export function isoSeconds(ms: number): string {
	return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z")
}
