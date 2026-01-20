export type RoomId = string;

export type User = { 
    id: string;
    name: string;
}

export type RoomJoinPayload = {
    roomId: RoomId;
    user: User;
}

export type RoomStatePayload = { 
    roomId: RoomId;
    code: string;
    version: number;    
    users: User[]
}

export interface ClientToServerEvents {
    "room:join" : (payload: RoomJoinPayload) => void;
}

export interface ServerToClientEvents {
    "room:joined": (payload: { roomId: RoomId }) => void;
    "room:state": (payload: RoomStatePayload) => void;
    "user:joined": (payload: { roomId: RoomId, user: User }) => void;
}

