import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

import type { ClientToServerEvents, ServerToClientEvents, User } from "@collab/shared";


const app = express();
app.use(cors());

const server = http.createServer(app);


const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: "*"
    }
});

type RoomState = {
    code: string;
    version: number;
    users: Map<string, User>;
}


const rooms = new Map<string, RoomState>();

const getOrCreateRoom = (roomId: string): RoomState => {
    const existing = rooms.get(roomId);

    if (existing) return existing;

    const newState: RoomState = {
        code: "// Start Typing... /n",
        version: 1,
        users: new Map<string, User>()
    };
    rooms.set(roomId, newState);
    return newState;
}

io.on("connection", socket => {
    console.log("a user connected", socket.id);

    socket.on("room:join", ({ roomId, user }) => {
        const room = getOrCreateRoom(roomId);

        socket.join(roomId);
        room.users.set(socket.id, user);

        socket.emit("room:joined", { roomId });

        socket.emit("room:state", {
            roomId,
            code: room.code,
            version: room.version,
            users: Array.from(room.users.values())
        });

        socket.to(roomId).emit("user:joined", { roomId, user });

    });

    socket.on("code:change", ({ roomId, value, clientVersion }) => {
        const room = rooms.get(roomId);

        if (!room) return;

        // last-write wins
        room.code = value;
        room.version = clientVersion + 1;

        socket.to(roomId).emit("code:update", {
            roomId,
            value: room.code,
            version: room.version
        })


    })

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
    })
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})