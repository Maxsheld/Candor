import { Trash2 } from "lucide-react";
import { Conversation } from "../types";

interface SidebarProps {
  pastConversations: Conversation[],
  conversation_id: string | null,
  isSidebarLoading: boolean,
  hasActiveConversation: boolean,
  handleNewChat: () => void,
  handleSelectConversation: (id: string) => void,
  handleDeleteConversation: (id: string) => void,
  handleSignOut: () => void
};

export default function Sidebar({ 
    pastConversations, conversation_id, isSidebarLoading, hasActiveConversation, handleNewChat, handleSelectConversation, handleDeleteConversation, handleSignOut }: SidebarProps) {
    return(
    <aside className="w-64 flex flex-col bg-zinc-800 border-r border-zinc-700 p-4">
        <h2 className="text-xl text-zinc-200 font-semibold"> Candor </h2>     
        <button
          // Disabled when any active conversation exists.
          // A user shouldn't be able to start a new reflection while one is still in progress.
          title={hasActiveConversation ? "End your current reflection before starting a new one" : undefined}
          disabled={ hasActiveConversation }
          onClick={handleNewChat}
          className="mt-4 px-4 py-1.5 bg-amber-800 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"> 
          + New Reflection         
        </button>

        <nav className="mt-10 overflow-y-auto relative h-full">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
            Past Reflections
          </p>
          {pastConversations.map((conversation) => (
            <div 
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation.id)} 
              className={`group flex items-center justify-between p-2 text-sm text-zinc-300 rounded-md hover:bg-zinc-700 hover:text-white cursor-pointer transition-colors ${
                conversation_id === conversation.id
                ? "bg-zinc-700 text-white hover:bg-zinc-600"
                : ""
              }`}
            >
              <span className="truncate">{conversation.title}</span>
              <button 
                onClick={(e) => {
                  // stopPropagation prevents this click from also triggering
                  // the parent div's onClick (which would load the conversation).
                  e.stopPropagation();
                  handleDeleteConversation(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {isSidebarLoading && (
            <div className="absolute inset-0 bg-zinc-800/70 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-600 border-t-zinc-200 animate-spin"></div>
            </div>
          )}
        </nav>

        {/* mt-auto pushes this to the bottom of the sidebar regardless of how many conversations are listed. */}
        <button
          onClick={handleSignOut}
          className="mt-auto px-4 py-1.5 bg-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-600 transition-colors"> 
          Sign out  
        </button>
      </aside>
    )}
