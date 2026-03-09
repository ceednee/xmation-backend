export class SyncConcurrencyManager {
	private runningSyncs: Set<string> = new Set();

	isRunning(syncKey: string): boolean {
		return this.runningSyncs.has(syncKey);
	}

	start(syncKey: string): void {
		this.runningSyncs.add(syncKey);
	}

	end(syncKey: string): void {
		this.runningSyncs.delete(syncKey);
	}

	getRunningCount(): number {
		return this.runningSyncs.size;
	}
}
