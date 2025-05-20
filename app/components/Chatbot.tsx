'use client';

import React, { useState, useEffect, useRef } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chatbot() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Msg = { role: "user", content: text };
    const newMsgs: Msg[] = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      const answer =
        data.choices?.[0]?.message?.content ?? "Sorry — no response.";

      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: answer },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: "Error contacting AI." },
      ]);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return (
    <div className="flex flex-col w-full max-w-md h-[500px] bg-white rounded shadow">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto text-sm">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-md whitespace-pre-line ${m.role === "user"
                ? "bg-blue-100 self-end text-gray-800"
                : "bg-gray-100 self-start"
              }`}
            dangerouslySetInnerHTML={{ __html: m.content }}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 p-2 bg-gray-50"
      >
        <input
          className="flex-1 border rounded px-3 py-2 outline-none"
          placeholder="Ask me for gift ideas…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-40"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
