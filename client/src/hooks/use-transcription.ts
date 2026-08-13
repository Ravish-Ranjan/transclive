"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTranscriptionOptions {
	language?: string;
}

type ServerMessage =
	| { type: "ready" }
	| {
			type: "transcript";
			segment: TranscriptSegment;
			isFinal: boolean;
			speechFinal: boolean;
	  }
	| { type: "error"; message: string }
	| { type: "utterance_end"; lastWordEnd: number }
	| { type: "deepgram_closed" }
	| { type: "stopping" };

type TranscriptMessage = Extract<ServerMessage, { type: "transcript" }>;

interface TranscriptSegment {
	text: string;
	start: number;
	end: number;
	speaker?: number;
	confidence: number;
	words: {
		word: string;
		punctuatedWord: string;
		start: number;
		end: number;
		confidence: number;
		speaker?: number;
	}[];
}

export function useTranscription(options: UseTranscriptionOptions = {}) {
	const { language = "en-US" } = options;

	const socketRef = useRef<WebSocket | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [isConnected, setIsConnected] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	// const [transcript, setTranscript] = useState("");
	const [segments, setSegments] = useState<TranscriptSegment[]>([]);
	const [interimSegment, setInterimSegment] =
		useState<TranscriptSegment | null>(null);
	const [error, setError] = useState<string | null>(null);

	function handleTranscript(data: TranscriptMessage) {
		if (!data.segment.text) {
			return;
		}

		if (data.isFinal) {
			setSegments((current) => [...current, data.segment]);

			setInterimSegment(null);
		} else {
			setInterimSegment(data.segment);
		}
	}

	function handleServerMessage(data: ServerMessage) {
		switch (data.type) {
			case "ready":
				break;

			case "transcript":
				handleTranscript(data);
				break;

			case "stopping":
				break;

			case "error":
				setError(data.message);
				break;

			case "deepgram_closed":
				setIsConnected(false);
				break;

			case "utterance_end":
				break;

			default:
				break;
		}
	}

	const connect = useCallback(() => {
		return new Promise<WebSocket>((resolve, reject) => {
			const apiUrl =
				process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:816";

			const websocketUrl = apiUrl
				.replace(/^http:/, "ws:")
				.replace(/^https:/, "wss:");

			const socket = new WebSocket(`${websocketUrl}/ws/transcribe`);

			socketRef.current = socket;

			socket.onopen = () => {
				setIsConnected(true);
				setError(null);

				resolve(socket);
			};

			socket.onerror = () => {
				setError("Unable to connect to transcription server");

				reject(new Error("WebSocket connection failed"));
			};

			socket.onclose = () => {
				setIsConnected(false);
			};

			socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as ServerMessage;

					handleServerMessage(data);
				} catch (error) {
					console.error("Invalid WebSocket message:", error);
				}
			};
		});
	}, []);

	const start = useCallback(async () => {
		if (isRecording) {
			return;
		}

		try {
			setError(null);
			setSegments([]);
			setInterimSegment(null);

			const socket = socketRef.current ?? (await connect());

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});

			streamRef.current = stream;

			await waitForSocketOpen(socket);

			socket.send(
				JSON.stringify({
					type: "start",
					language,
				}),
			);

			await waitForReady(socket);

			const mimeType = getSupportedMimeType();

			if (!mimeType) {
				throw new Error(
					"Browser does not support a compatible audio format",
				);
			}

			const recorder = new MediaRecorder(stream, {
				mimeType,
			});

			mediaRecorderRef.current = recorder;

			recorder.ondataavailable = (event) => {
				if (
					event.data.size === 0 ||
					socket.readyState !== WebSocket.OPEN
				) {
					return;
				}

				socket.send(event.data);
			};

			recorder.onstart = () => {
				setIsRecording(true);
			};

			recorder.onstop = () => {
				setIsRecording(false);

				/*
				 * The final audio chunk has now
				 * been emitted.
				 *
				 * Tell the server to finalize
				 * the Deepgram stream.
				 */
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(
						JSON.stringify({
							type: "stop",
						}),
					);
				}
			};

			recorder.start(250);
		} catch (error) {
			console.error("Failed to start transcription:", error);

			setError(
				error instanceof Error
					? error.message
					: "Failed to start recording",
			);

			cleanupRecording();
		}
	}, [connect, language, isRecording]);

	function cleanupRecording() {
		mediaRecorderRef.current = null;

		streamRef.current?.getTracks().forEach((track) => track.stop());

		streamRef.current = null;

		setIsRecording(false);
	}

	const stop = useCallback(() => {
		const recorder = mediaRecorderRef.current;

		if (recorder && recorder.state !== "inactive") {
			/*
			 * Do NOT send the stop message
			 * here.
			 *
			 * recorder.onstop does it after
			 * the final dataavailable event.
			 */
			recorder.stop();
			return;
		}

		cleanupRecording();
	}, []);

	useEffect(() => {
		return () => {
			mediaRecorderRef.current?.stop();

			streamRef.current?.getTracks().forEach((track) => track.stop());

			socketRef.current?.close();
		};
	}, []);

	return {
		isConnected,
		isRecording,
		segments,
		interimSegment,
		error,
		start,
		stop,
	};
}

function getSupportedMimeType(): string | null {
	const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

	return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function waitForSocketOpen(socket: WebSocket): Promise<void> {
	if (socket.readyState === WebSocket.OPEN) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			reject(new Error("WebSocket connection timeout"));
		}, 10000);

		socket.addEventListener(
			"open",
			() => {
				window.clearTimeout(timeout);

				resolve();
			},
			{ once: true },
		);

		socket.addEventListener(
			"error",
			() => {
				window.clearTimeout(timeout);

				reject(new Error("WebSocket connection failed"));
			},
			{ once: true },
		);
	});
}

function waitForReady(socket: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			reject(new Error("Deepgram connection timeout"));
		}, 10000);

		const handler = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data) as ServerMessage;

				if (data.type === "ready") {
					window.clearTimeout(timeout);

					socket.removeEventListener("message", handler);

					resolve();
				}

				if (data.type === "error") {
					window.clearTimeout(timeout);

					socket.removeEventListener("message", handler);

					reject(new Error(data.message));
				}
			} catch {
				// Ignore invalid messages.
			}
		};

		socket.addEventListener("message", handler);
	});
}
