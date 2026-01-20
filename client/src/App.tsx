import { useEffect, useState } from "react";
import { socket } from "./socket";
import type { User } from "@collab/shared";

export default function App() {
  const [status, setStatus] = useState("connecting...");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    socket.on("connect", () => setStatus(`connected ✅ (${socket.id})`));
    socket.on("disconnect", () => setStatus("disconnected ❌"));

    socket.on("room:joined", ({ roomId }) => {
      console.log("joined room:", roomId);
    });

    socket.on("room:state", ({ code, version, users }) => {
      setCode(code);
      setVersion(version);
      setUsers(users);
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

      <pre>{JSON.stringify({ version, users }, null, 2)}</pre>
      <pre>{code}</pre>

    </div>
  );
}
