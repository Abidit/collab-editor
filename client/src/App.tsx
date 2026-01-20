import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

import { socket } from "./socket";
import type { CursorMovePayload, User } from "@collab/shared";

export default function App() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Store Monaco decoration IDs (so we can replace/remove them safely)
  const remoteDecorationIdsRef = useRef<string[]>([]);

  // Throttle cursor emits (ms)
  const lastCursorSentAtRef = useRef(0);

  const [status, setStatus] = useState("connecting...");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);

  // Room
  const [roomId, setRoomId] = useState("room-1");

  // Remote cursors keyed by user.id
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, CursorMovePayload>
  >({});

  // Current user for this tab
  const [me] = useState<User>(() => ({
    id: crypto.randomUUID(),
    name: `User-${Math.floor(Math.random() * 1000)}`,
  }));

  useEffect(() => {
    socket.on("connect", () => setStatus(`connected ✅ (${socket.id})`));
    socket.on("disconnect", () => setStatus("disconnected ❌"));

    socket.on("room:joined", ({ roomId }) => {
      console.log("joined room:", roomId);
      setRoomId(roomId);
    });

    socket.on("room:state", ({ code, version, users }) => {
      setCode(code);
      setVersion(version);
      setUsers(users);
      // Optional: clear remote cursors when switching rooms/state
      setRemoteCursors({});
    });

    socket.on("user:joined", ({ user }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on("code:update", ({ value, version }) => {
      setCode(value);
      setVersion(version);
    });

    socket.on("cursor:update", (payload) => {
      // Safety: ignore self
      if (payload.user.id === me.id) return;

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.user.id]: payload,
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room:joined");
      socket.off("room:state");
      socket.off("user:joined");
      socket.off("code:update");
      socket.off("cursor:update");
    };
  }, [me.id]);

  // Apply remote cursor/selection decorations whenever remote cursor state changes
  useEffect(() => {
    const editor = editorRef.current;
    const m = monacoRef.current;
    if (!editor || !m) return;

    const decorations = Object.values(remoteCursors).flatMap((c) => {
      // 1) caret-like indicator at position
      const cursorDeco = {
        range: new m.Range(
          c.position.lineNumber,
          c.position.column,
          c.position.lineNumber,
          c.position.column
        ),
        options: {
          afterContentClassName: "remote-cursor-after",
        },
      };

      // 2) selection highlight (if present)
      const sel = c.selection;
      const selectionDecos = sel
        ? [
            {
              range: new m.Range(
                sel.startLineNumber,
                sel.startColumn,
                sel.endLineNumber,
                sel.endColumn
              ),
              options: { className: "remote-selection" },
            },
          ]
        : [];

      return [cursorDeco, ...selectionDecos];
    });

    remoteDecorationIdsRef.current = editor.deltaDecorations(
      remoteDecorationIdsRef.current,
      decorations
    );
  }, [remoteCursors]);

  const join = () => {
    socket.emit("room:join", {
      roomId,
      user: me,
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Collaborative Editor (MVP)</h2>
      <p>{status}</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={join}>Join {roomId}</button>
        <span style={{ opacity: 0.8 }}>
          Me: <b>{me.name}</b>
        </span>
        <span style={{ opacity: 0.8 }}>
          Users: <b>{users.length}</b>
        </span>
        <span style={{ opacity: 0.8 }}>
          Version: <b>{version}</b>
        </span>
      </div>

      <div style={{ height: "60vh", marginTop: 16, border: "1px solid #ddd" }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Cursor / selection broadcasting
            editor.onDidChangeCursorSelection(() => {
              // throttle to avoid flooding
              const now = Date.now();
              if (now - lastCursorSentAtRef.current < 50) return; // ~20fps
              lastCursorSentAtRef.current = now;

              const pos = editor.getPosition();
              const sel = editor.getSelection();
              if (!pos) return;

              const payload: CursorMovePayload = {
                roomId,
                user: me,
                position: { lineNumber: pos.lineNumber, column: pos.column },
                selection: sel
                  ? {
                      startLineNumber: sel.startLineNumber,
                      startColumn: sel.startColumn,
                      endLineNumber: sel.endLineNumber,
                      endColumn: sel.endColumn,
                    }
                  : null,
              };

              socket.emit("cursor:move", payload);
            });
          }}
          onChange={(value) => {
            if (value === undefined) return;

            setCode(value);

            socket.emit("code:change", {
              roomId,
              value,
              clientVersion: version,
            });

            setVersion((v) => v + 1);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
