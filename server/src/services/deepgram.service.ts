import { DeepgramClient } from "@deepgram/sdk";

const apiKey = process.env.DEEPGRAM_API_KEY;

if (!apiKey) {
	throw new Error("DEEPGRAM_API_KEY is not configured");
}

export const deepgram = new DeepgramClient({ apiKey });
