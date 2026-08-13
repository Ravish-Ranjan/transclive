/**
 * Provider-agnostic summary service.
 *
 * Default implementation is a local extractive summarizer (no external
 * API key required). Swap `summarize` for a real LLM call later without
 * touching callers.
 */

export interface SummaryService {
	summarize(transcript: string): Promise<string>;
}

function splitSentences(text: string): string[] {
	return text
		.replace(/\s+/g, " ")
		.trim()
		.split(/(?<=[.!?])\s+/)
		.filter((s) => s.length > 0);
}

function scoreSentences(sentences: string[]): number[] {
	const wordFreq = new Map<string, number>();

	for (const sentence of sentences) {
		for (const word of sentence.toLowerCase().match(/[a-z0-9']+/g) ?? []) {
			if (word.length < 3) continue;
			wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
		}
	}

	return sentences.map((sentence) => {
		const words = sentence.toLowerCase().match(/[a-z0-9']+/g) ?? [];
		if (words.length === 0) return 0;

		const score = words.reduce(
			(sum, word) => sum + (wordFreq.get(word) ?? 0),
			0,
		);

		return score / words.length;
	});
}

class ExtractiveSummaryService implements SummaryService {
	async summarize(transcript: string): Promise<string> {
		const sentences = splitSentences(transcript);

		if (sentences.length === 0) {
			return "";
		}

		if (sentences.length <= 3) {
			return sentences.join(" ");
		}

		const scores = scoreSentences(sentences);

		const targetCount = Math.max(2, Math.ceil(sentences.length * 0.2));

		const ranked = sentences
			.map((sentence, index) => ({ sentence, index, score: scores[index] ?? 0 }))
			.sort((a, b) => b.score - a.score)
			.slice(0, targetCount)
			.sort((a, b) => a.index - b.index);

		return ranked.map((r) => r.sentence).join(" ");
	}
}

export const summaryService: SummaryService = new ExtractiveSummaryService();
