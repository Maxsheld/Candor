import { useRef } from "react";

interface MessageInputProps {
  input: string,
  status: "ready" | "submitted" | "streaming" | "error",
  isConversationEnded: boolean,  
  handleSendMessage : () => void,
  setInput: (input: string) => void
};

export default function MessageInput({ 
     input, status, isConversationEnded, handleSendMessage, setInput }: MessageInputProps) {

    const inputRef = useRef<HTMLTextAreaElement>(null);

    return(
        <div className="p-8">
          <div className="max-w-3xl mx-auto relative">
            {!isConversationEnded ? 
            <><textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { 
                    const value = e.target.value;
                    setInput(value);

                    const el = inputRef.current;
                    if (!el) return;

                    const maxHeight = 384; // matches max-h-96

                    // Reset to auto first so scrollHeight gives us the true content height,
                    // not the height we manually set on the previous keystroke.
                    el.style.height = "auto";

                    const scrollHeight = el.scrollHeight;

                    if (scrollHeight <= maxHeight) {
                        // If the content fits, grows the box to match it and hide the scrollbar.
                        el.style.height = scrollHeight + "px";
                        el.style.overflowY = "hidden";
                    } else {
                        // if the content exceeds the cap, lock the height and let it scroll.
                        el.style.height = maxHeight + "px";
                        el.style.overflowY = "auto";
                    }
                }}

              onKeyDown={(e) => {
                // Enter submits. Shift+Enter inserts a newline instead.
                if (e.key === "Enter" && !e.shiftKey && !(status === "submitted" || status === "streaming")) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Reflect on your day..."
              className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-3xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                          
            />            
            <button
              disabled={ status === "submitted" || status === "streaming" }
              onClick={handleSendMessage}
              className="absolute bottom-4 right-4 px-4 py-1.5 bg-amber-800 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button></> :
            <div className="max-w-3xl w-full bg-zinc-800 border border-zinc-700 p-4 rounded-3xl opacity-50 cursor-not-allowed text-center">This session has been ended and you can't send any new messages.</div>    
            }
          </div>
        </div>
    )}
