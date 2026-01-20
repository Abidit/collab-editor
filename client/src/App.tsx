import { useEffect, useRef, useState } from "react";
import type * as monaco from "monaco-editor";

import { socket } from "./socket";
import type { CursorMovePayload, User } from "@collab/shared";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import EditorArea from "./components/EditorArea";
import Toast from "./components/Toast";

interface ToastMessage {
  id: string;
  message: string;
}

export default function App() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  // Store Monaco decoration IDs (so we can replace/remove them safely)
  const remoteDecorationIdsRef = useRef<string[]>([]);

  // Throttle cursor emits (ms)
  const lastCursorSentAtRef = useRef(0);

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "offline">("offline");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);
  const [roomId, setRoomId] = useState("room-1");
  const [rooms] = useState<string[]>(["room-1", "room-2", "room-3"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSync, setLastSync] = useState<Date | undefined>(undefined);

  // Remote cursors keyed by user.id
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, CursorMovePayload>
  >({});

  // Current user for this tab
  const [me] = useState<User>(() => ({
    id: crypto.randomUUID(),
    name: `User-${Math.floor(Math.random() * 1000)}`,
  }));

  // Show toast notification
  const showToast = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus("connected");
      setLastSync(new Date());
    };

    const handleDisconnect = () => {
      setConnectionStatus("offline");
    };

    // Use socket.io's built-in connection state
    if (socket.connected) {
      handleConnect();
    } else {
      handleDisconnect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("room:joined", ({ roomId }) => {
      console.log("joined room:", roomId);
      setRoomId(roomId);
      setLastSync(new Date());
    });

    socket.on("room:state", ({ code, version, users }) => {
      setCode(code);
      setVersion(version);
      setUsers(users);
      setRemoteCursors({});
      setLastSync(new Date());
    });

    socket.on("user:joined", ({ user }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        showToast(`${user.name} joined the room`);
        return [...prev, user];
      });
    });

    socket.on("code:update", ({ value, version }) => {
      setCode(value);
      setVersion(version);
      setLastSync(new Date());
    });

    socket.on("cursor:update", (payload) => {
      // Safety: ignore self
      if (payload.user.id === me.id) return;

      setRemoteCursors((prev) => ({
        ...prev,
        [payload.user.id]: payload,
      }));
    });

    // Monitor connection state changes
    const checkConnection = () => {
      if (socket.connected) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("reconnecting");
      }
    };
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
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
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const colorBucketForUser = (userId: string) => {
      // deterministic hash -> 0..11
      let h = 0;
      for (let i = 0; i < userId.length; i++) {
        h = (h * 31 + userId.charCodeAt(i)) >>> 0;
      }
      return h % 12;
    };

    const decorations = Object.values(remoteCursors).flatMap((c) => {
      const bucket = colorBucketForUser(c.user.id);
      const colorClass = `remote-color-${bucket}`;

      // Caret + label at the cursor position
      const cursorDeco = {
        range: new monaco.Range(
          c.position.lineNumber,
          c.position.column,
          c.position.lineNumber,
          c.position.column
        ),
        options: {
          afterContentClassName: `remote-cursor-caret ${colorClass}`,
          after: {
            content: ` ${c.user.name}`,
            inlineClassName: `remote-cursor-label ${colorClass}`,
          },
        },
      };

      // Selection highlight (if any)
      const sel = c.selection;
      const selectionDecos = sel
        ? [
          {
            range: new monaco.Range(
              sel.startLineNumber,
              sel.startColumn,
              sel.endLineNumber,
              sel.endColumn
            ),
            options: {
              className: `remote-selection ${colorClass}`,
            },
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

  const joinRoom = (targetRoomId?: string) => {
    const room = targetRoomId || roomId;
    socket.emit("room:join", {
      roomId: room,
      user: me,
    });
  };

  const handleRoomNameChange = (newName: string) => {
    setRoomId(newName);
    // Optionally emit room rename event
  };

  const handleShare = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Share link copied to clipboard!");
    });
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    socket.emit("code:change", {
      roomId,
      value,
      clientVersion: version,
    });
    setVersion((v) => v + 1);
  };

  const handleCursorChange = (position: monaco.Position | null, selection: monaco.Selection | null) => {
    if (!position) return;

    // Throttle to avoid flooding
    const now = Date.now();
    if (now - lastCursorSentAtRef.current < 50) return; // ~20fps
    lastCursorSentAtRef.current = now;

    const payload: CursorMovePayload = {
      roomId,
      user: me,
      position: { lineNumber: position.lineNumber, column: position.column },
      selection: selection
        ? {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        }
        : null,
    };

    socket.emit("cursor:move", payload);
  };

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Auto-join on mount
    joinRoom();
  };

  return (
    <div className="app">
      <TopBar
        roomName={roomId}
        onRoomNameChange={handleRoomNameChange}
        users={users}
        status={connectionStatus}
        onShare={handleShare}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="main-layout">
        <Sidebar
          users={users}
          currentUser={me}
          roomId={roomId}
          rooms={rooms}
          status={connectionStatus}
          lastSync={lastSync}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onRoomSelect={(room) => {
            joinRoom(room);
            setSidebarOpen(false);
          }}
          onCreateRoom={() => {
            const newRoom = `room-${Date.now()}`;
            joinRoom(newRoom);
            showToast(`Created room: ${newRoom}`);
          }}
        />

        <EditorArea
          code={code}
          onChange={handleCodeChange}
          onCursorChange={handleCursorChange}
          onMount={handleEditorMount}
          language="javascript"
        />
      </div>

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}