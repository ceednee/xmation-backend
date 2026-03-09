import type { XFollower } from "../../types/rapidapi";

export function detectUnfollows(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const currentIds = new Set(currentFollowers.map((f) => f.restId));
	return previousFollowers.filter((f) => !currentIds.has(f.restId));
}

export function detectNewFollowers(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const previousIds = new Set(previousFollowers.map((f) => f.restId));
	return currentFollowers.filter((f) => !previousIds.has(f.restId));
}
