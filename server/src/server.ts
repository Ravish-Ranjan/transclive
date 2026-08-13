import "dotenv/config";
import { createServer } from "node:http";

import app from "./app.js";
import { setupTranscriptionWebSocket } from "./services/transcription.websocket.js";

const PORT = Number(process.env.PORT) || 8000;

const httpserver = createServer(app);

setupTranscriptionWebSocket(httpserver);

httpserver.listen(PORT, () => {
	console.log(`SERVER : running on ${PORT}`);
});
