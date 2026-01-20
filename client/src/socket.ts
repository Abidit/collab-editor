import type { ClientToServerEvents, ServerToClientEvents } from "@collab/shared";
import { io, type Socket } from "socket.io-client";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000");

