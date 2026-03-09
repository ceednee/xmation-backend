/**
 * SIMDJSON Entity Extractor
 * 
 * Extracts entities (hashtags, mentions, URLs) from tweet data.
 * Type-safe entity extraction utilities.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract hashtags
 * const hashtags = extractHashtags(entities);
 * 
 * // Extract mentions
 * const mentions = extractMentions(entities);
 * 
 * // Extract URLs
 * const urls = extractUrls(entities);
 * ```
 */

/** Hashtag entity structure */
interface HashtagEntity {
	text?: string;
}

/** Mention entity structure */
interface MentionEntity {
	screen_name?: string;
	name?: string;
	id_str?: string;
	indices?: number[];
}

/** URL entity structure */
interface UrlEntity {
	url?: string;
	expanded_url?: string;
	display_url?: string;
	indices?: number[];
}

/** Combined entities structure */
interface Entities {
	hashtags?: HashtagEntity[];
	user_mentions?: MentionEntity[];
	urls?: UrlEntity[];
}

/**
 * Extract hashtags from entities
 * 
 * @param entities - Entities object
 * @returns Array of hashtag strings
 */
export const extractHashtags = (entities: Entities | undefined): string[] => {
	return entities?.hashtags?.map((h) => String(h.text)) || [];
};

/**
 * Extract user mentions from entities
 * 
 * @param entities - Entities object
 * @returns Array of mention objects
 */
export const extractMentions = (entities: Entities | undefined): Array<{
	screenName: string;
	name: string;
	id: string;
	indices: number[];
}> => {
	return (
		entities?.user_mentions?.map((m) => ({
			screenName: String(m.screen_name),
			name: String(m.name),
			id: String(m.id_str),
			indices: Array.isArray(m.indices) ? m.indices : [],
		})) || []
	);
};

/**
 * Extract URLs from entities
 * 
 * @param entities - Entities object
 * @returns Array of URL objects
 */
export const extractUrls = (entities: Entities | undefined): Array<{
	url: string;
	expandedUrl: string;
	displayUrl: string;
	indices: number[];
}> => {
	return (
		entities?.urls?.map((u) => ({
			url: String(u.url),
			expandedUrl: String(u.expanded_url),
			displayUrl: String(u.display_url),
			indices: Array.isArray(u.indices) ? u.indices : [],
		})) || []
	);
};
