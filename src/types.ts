// Shared types used across page.tsx and the components that receive conversations as props.

export type Conversation = {
    id: string
    title: string
    status: "active" | "ended"
}

// Mirrors the message shape the Vercel AI SDK uses internally.
// text is optional because not all message parts are text (e.g. tool calls).
export type ChatMessage = {
    id: string,
    role: string,
    parts: { type: string, text?: string }[]
}
