import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

import { verifyAuthToken } from "../lib/auth.js";
import { deepgram } from "./deepgram.service.js";
import { parseDeepgramResult } from "./transcript.parser.js";
import type { TranscriptSegment } from "../types/transcription.js";
import { createTranscription } from "./transcription.service.js";

interface StartMessage {
	type: "start";
	language?: string;
}

interface StopMessage {
	type: "stop";
}

type ClientMessage = StartMessage | StopMessage;

export function setupTranscriptionWebSocket(httpServer: HttpServer) {
	const wss = new WebSocketServer({
		server: httpServer,
		path: "/ws/transcribe",
	});

	wss.on("connection", (socket, request) => {
		const token = getCookie(request.headers.cookie, "auth_token");

		if (!token) {
			socket.close(4001, "Authentication required");
			return;
		}

		let userId: string;

		try {
			const payload = verifyAuthToken(token);

			userId = payload.userId;
		} catch {
			socket.close(4001, "Invalid or expired authentication token");

			return;
		}

		console.log(`Transcription socket connected: ${userId}`);

		let deepgramConnection: Awaited<
			ReturnType<typeof deepgram.listen.v1.connect>
		> | null = null;

		let recordingStarted = false;
		let stopping = false;
		let sessionLanguage = "en-US";
		let sessionStartedAt: number | null = null;
		let sessionSegments: TranscriptSegment[] = [];

		socket.on("message", async (data, isBinary) => {
			try {
				/*
				 * Binary data = microphone audio.
				 */
				if (isBinary) {
					if (deepgramConnection && recordingStarted && !stopping) {
						const raw = data as any;
						let bytes: Uint8Array;
						if (Array.isArray(raw)) {
							// raw can be Buffer[] — concatenate parts
							const parts = raw.map(
								(p: any) => new Uint8Array(p),
							);
							const total = parts.reduce(
								(sum: number, p: Uint8Array) => sum + p.length,
								0,
							);
							bytes = new Uint8Array(total);
							let offset = 0;
							for (const p of parts) {
								bytes.set(p, offset);
								offset += p.length;
							}
						} else {
							// Buffer, ArrayBuffer, or TypedArray
							bytes = new Uint8Array(raw);
						}
						deepgramConnection.sendMedia(bytes);
						// deepgramConnection.sendMedia(data);
					}

					return;
				}

				const message = JSON.parse(data.toString()) as ClientMessage;

				if (message.type === "start") {
					if (recordingStarted) {
						return;
					}

					stopping = false;

					sessionLanguage = message.language ?? "en-US";
					sessionStartedAt = Date.now();
					sessionSegments = [];

					await startDeepgram(
						socket,
						sessionLanguage,
						(connection) => {
							deepgramConnection = connection;

							recordingStarted = true;
						},
					);

					return;
				}

				if (message.type === "stop") {
					if (!recordingStarted) {
						return;
					}

					stopping = true;

					/*
					 * Tell Deepgram that no more audio
					 * will be sent.
					 */
					if (deepgramConnection) {
						deepgramConnection.close();
					}

					recordingStarted = false;

					socket.send(
						JSON.stringify({
							type: "stopping",
						}),
					);
				}
			} catch (error) {
				console.error("Transcription WebSocket error:", error);

				sendError(socket, "Failed to process transcription request");
			}
		});

		socket.on("close", () => {
			console.log(`Transcription socket closed: ${userId}`);

			if (deepgramConnection) {
				deepgramConnection.close();
				deepgramConnection = null;
			}

			recordingStarted = false;
		});

		socket.on("error", (error) => {
			console.error(`Transcription socket error: ${userId}`, error);
		});

		async function startDeepgram(
			clientSocket: WebSocket,
			language: string,
			onReady: (
				connection: Awaited<
					ReturnType<typeof deepgram.listen.v1.connect>
				>,
			) => void,
		) {
			const connection = await deepgram.listen.v1.connect({
				model: "nova-3",
				language,
				smart_format: "true",
				interim_results: "true",
				punctuate: "true",
				diarize: "true",
				endpointing: 1000,
				utterance_end_ms: 1000,
			});

			connection.on("open", () => {
				console.log(`Deepgram connection opened: ${userId}`);

				onReady(connection);

				clientSocket.send(
					JSON.stringify({
						type: "ready",
					}),
				);
			});

			connection.on("message", (data) => {
				if (data.type === "UtteranceEnd") {
					if (clientSocket.readyState === WebSocket.OPEN) {
						clientSocket.send(
							JSON.stringify({
								type: "utterance_end",
								lastWordEnd: data.last_word_end,
							}),
						);
					}

					return;
				}
				if (data.type !== "Results") return;

				const segment = parseDeepgramResult(data);
				if (!segment) return;

				if (data.is_final) sessionSegments.push(segment);

				clientSocket.send(
					JSON.stringify({
						type: "transcript",
						segment,
						isFinal: data.is_final ?? false,
						speechFinal: data.speech_final ?? false,
					}),
				);
			});

			connection.on("error", (error) => {
				console.error(`Deepgram error: ${userId}`, error);

				sendError(clientSocket, "Deepgram transcription error");
			});

			connection.on("close", async () => {
				console.log(`Deepgram connection closed: ${userId}`);

				deepgramConnection = null;
				recordingStarted = false;
				stopping = false;

				if (sessionStartedAt !== null && sessionSegments.length > 0) {
					try {
						const duration = (Date.now() - sessionStartedAt) / 1000;
						const transcription = await createTranscription({
							userId,
							language: sessionLanguage,
							duration,
							segments: sessionSegments,
						});

						if (clientSocket.readyState === WebSocket.OPEN) {
							clientSocket.send(
								JSON.stringify({
									type: "transcription_saved",
									transcription: {
										id: transcription.id,
										language: transcription.language,
										duration: transcription.duration,
										createdAt: transcription.createdAt,
									},
								}),
							);
						}
					} catch (error) {
						console.error("Failed to save transcription:", error);

						sendError(clientSocket, "Failed to save transcription");
					}
				}

				sessionStartedAt = null;
				sessionSegments = [];

				if (clientSocket.readyState === WebSocket.OPEN) {
					clientSocket.send(
						JSON.stringify({
							type: "deepgram_closed",
						}),
					);
				}
			});

			connection.connect();

			await connection.waitForOpen();
		}
	});

	console.log("Transcription WebSocket available at /ws/transcribe");
}

function sendError(socket: WebSocket, message: string) {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(
			JSON.stringify({
				type: "error",
				message,
			}),
		);
	}
}

function getCookie(
	cookieHeader: string | undefined,
	name: string,
): string | undefined {
	if (!cookieHeader) {
		return undefined;
	}

	const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

	const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

	if (!target) {
		return undefined;
	}

	return decodeURIComponent(target.substring(name.length + 1));
}
