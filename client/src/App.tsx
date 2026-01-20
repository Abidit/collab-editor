import { useEffect, useState } from "react";
import { socket } from "./socket";
import type { User } from "@collab/shared";
import Editor from "@monaco-editor/react";

export default function App() {
  const [status, setStatus] = useState("connecting...");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);
  const [roomId, setRoomId] = useState("room-1");


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
    });

    socket.on("code:update", ({ value, version }) => {
      setCode(value);
      setVersion(version);
    });


    socket.on("user:joined", ({ user }) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });


    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room:joined");
      socket.off("room:state");
      socket.off("user:joined");
      socket.off("code:update");
    };
  }, []);

  const join = () => {
    socket.emit("room:join", {
      roomId: "room-1",
      user: { id: "u1", name: "Dev" },
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Typed Socket Test</h2>
      <p>{status}</p>
      <button onClick={join}>Join room-1</button>
      <div style={{ height: "60vh", marginTop: 16, border: "1px solid #ddd" }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
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
