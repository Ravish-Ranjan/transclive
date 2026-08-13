export interface TranscriptWord {
	word: string;
	punctuatedWord: string;
	start: number;
	end: number;
	confidence: number;
	speaker?: number;
}

export interface TranscriptSegment {
	text: string;
	start: number;
	end: number;
	speaker?: number;
	confidence: number;
	words: TranscriptWord[];
}

export interface TranscriptEvent {
	type: "transcript";

	segment: TranscriptSegment;

	isFinal: boolean;
	speechFinal: boolean;
}
