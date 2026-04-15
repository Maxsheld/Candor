"use client"

import { useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: ChatMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
}

export default function MessageList({ messages, status }: MessageListProps) {

  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever the messages array updates.
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  // Empty state. Shown before the user sends anything.
  // Returning early here keeps this simple UI completely separate
  // from the message rendering logic below.
  if (messages.length === 0 && status === "ready") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-zinc-500">What's on your mind today?</p>
      </div>
    );
  }

  return (
    
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`p-4 rounded-2xl text-sm ${
              message.role === "assistant"
                ? "self-start"
                : "max-w-[75%] bg-zinc-800 rounded-tr-none ml-auto"
            }`}
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>
                {message.parts
                  .filter(part => part.type === 'text')
                  .map(part => part.text)
                  .join('')}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Spinner shown in the gap between the user sending and the stream starting. */}
        {status === "submitted" && (
          <div className="p-4 rounded-2xl text-sm self-start">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-600 border-t-zinc-200 animate-spin"></div>
          </div>
        )}

      </div>
      {/* Invisible anchor that auto-scroll targets. */}
      <div ref={bottomRef} />
    </div>
  );
}
