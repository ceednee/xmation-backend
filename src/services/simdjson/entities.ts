interface HashtagEntity {
	text?: string;
}

interface MentionEntity {
	screen_name?: string;
	name?: string;
	id_str?: string;
	indices?: number[];
}

interface UrlEntity {
	url?: string;
	expanded_url?: string;
	display_url?: string;
	indices?: number[];
}

interface Entities {
	hashtags?: HashtagEntity[];
	user_mentions?: MentionEntity[];
	urls?: UrlEntity[];
}

export const extractHashtags = (entities: Entities | undefined): string[] => {
	return entities?.hashtags?.map((h) => String(h.text)) || [];
};

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
