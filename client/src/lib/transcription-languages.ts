export interface TranscriptionLanguage {
	code: string;
	name: string;
}

export const transcriptionLanguages: TranscriptionLanguage[] = [
	{ code: "en-US", name: "English (US)" },
	{ code: "en-GB", name: "English (UK)" },
	{ code: "hi", name: "Hindi" },
	{ code: "es", name: "Spanish" },
	{ code: "fr", name: "French" },
	{ code: "de", name: "German" },
	{ code: "ja", name: "Japanese" },
];
