export type RoomId = string;

export type User = {
  id: string;
  name: string;
};

export type RoomJoinPayload = {
  roomId: RoomId;
  user: User;
};

export type RoomStatePayload = {
  roomId: RoomId;
  code: string;
  version: number;
  users: User[];
};

export type CodeChangePayload = {
  roomId: RoomId;
  value: string;
  clientVersion: number;
};

export type CodeUpdatePayload = {
  roomId: RoomId;
  value: string;
  version: number;
};

export type CursorPosition = {
  lineNumber: number;
  column: number;
};

export type CursorSelection = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

export type CursorMovePayload = {
  roomId: RoomId;
  user: User;
  position: CursorPosition;
  selection: CursorSelection | null;
};

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload) => void;
  "code:change": (payload: CodeChangePayload) => void;
  "cursor:move": (payload: CursorMovePayload) => void;
}

export interface ServerToClientEvents {
  "room:joined": (payload: { roomId: RoomId }) => void;
  "room:state": (payload: RoomStatePayload) => void;
  "user:joined": (payload: { roomId: RoomId; user: User }) => void;
  "code:update": (payload: CodeUpdatePayload) => void;
  "cursor:update": (payload: CursorMovePayload) => void;
}
