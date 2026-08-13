import type {
	TranscriptSegment,
	TranscriptWord,
} from "../types/transcription.js";

interface DeepgramWord {
	word?: string;
	punctuated_word?: string;
	start?: number;
	end?: number;
	confidence?: number;
	speaker?: number;
}

interface DeepgramAlternative {
	transcript?: string;
	confidence?: number;
	words?: DeepgramWord[];
}

interface DeepgramResults {
	channel?: {
		alternatives?: DeepgramAlternative[];
	};

	is_final?: boolean;
	speech_final?: boolean;
}

export function parseDeepgramResult(
	data: DeepgramResults,
): TranscriptSegment | null {
	const alternative = data.channel?.alternatives?.[0];

	if (!alternative) {
		return null;
	}

	const words = alternative.words ?? [];

	if (!alternative.transcript || words.length === 0) {
		return null;
	}

	const transcriptWords: TranscriptWord[] = words.map((word) => ({
		word: word.word ?? "",
		punctuatedWord: word.punctuated_word ?? word.word ?? "",
		start: word.start ?? 0,
		end: word.end ?? 0,
		confidence: word.confidence ?? 0,
		speaker: word.speaker,
	}));

	const firstWord = transcriptWords[0];

	const lastWord = transcriptWords[transcriptWords.length - 1];

	return {
		text: alternative.transcript,
		start: firstWord!.start,
		end: lastWord!.end,
		confidence: alternative.confidence ?? 0,
		speaker: getDominantSpeaker(transcriptWords),
		words: transcriptWords,
	};
}

function getDominantSpeaker(words: TranscriptWord[]): number | undefined {
	const speakerCounts = new Map<number, number>();

	for (const word of words) {
		if (word.speaker === undefined) {
			continue;
		}

		speakerCounts.set(
			word.speaker,
			(speakerCounts.get(word.speaker) ?? 0) + 1,
		);
	}

	if (speakerCounts.size === 0) {
		return undefined;
	}

	let dominantSpeaker: number | undefined;

	let maxCount = 0;

	for (const [speaker, count] of speakerCounts) {
		if (count > maxCount) {
			dominantSpeaker = speaker;
			maxCount = count;
		}
	}

	return dominantSpeaker;
}
