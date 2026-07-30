"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInterface({ 
  history, 
  onSend, 
  isLoading,
  onSelectMessage
}: { 
  history: any[], 
  onSend: (msg: string) => void,
  isLoading: boolean,
  onSelectMessage: (msg: any) => void
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "What are the top 5 highest values?",
    "Show me the overall trends.",
    "Are there any outliers in this dataset?",
    "Summarize the data by category."
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  // Select the latest AI message automatically when new history arrives
  useEffect(() => {
    if (history.length > 0 && !isLoading) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'ai') {
        onSelectMessage(lastMsg);
      }
    }
  }, [history, isLoading, onSelectMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AI Query Assistant</h3>
          <p className="text-[11px] text-slate-400">Natural language SQL analysis</p>
        </div>
      </div>

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] scrollbar-thin scrollbar-thumb-slate-800" ref={scrollRef}>
        {history.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-8">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="h-8 w-8" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">Ask any question about your dataset</p>
              <p className="text-xs text-slate-500 max-w-xs">Gemini AI will write and run SQL queries to retrieve exact answers.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
              {SUGGESTIONS.map(s => (
                <button 
                  key={s} 
                  onClick={() => onSend(s)}
                  className="w-full text-left px-3.5 py-2 text-xs bg-slate-950/80 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-indigo-300 transition-all flex items-center justify-between group focus-ring"
                >
                  <span className="truncate">{s}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg) => (
          <div
            key={msg.id}
            role={msg.role === 'ai' ? 'button' : undefined}
            tabIndex={msg.role === 'ai' ? 0 : undefined}
            className={`flex gap-3 rounded-xl transition-all ${msg.role === 'user' ? 'flex-row-reverse pl-8' : 'cursor-pointer hover:bg-slate-800/40 p-2.5 -mx-1 border border-transparent hover:border-indigo-500/20 focus-ring'}`}
            onClick={() => msg.role === 'ai' && onSelectMessage(msg)}
            onKeyDown={(e) => {
              if (msg.role === 'ai' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectMessage(msg);
              }
            }}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-700 text-indigo-400'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`min-w-0 max-w-[32rem] rounded-2xl px-3.5 py-2.5 ${msg.role === 'user' ? 'bg-indigo-600/90 text-white' : 'bg-slate-950/60 border border-slate-800'}`}>
              <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <span className="font-semibold text-xs text-slate-200">{msg.role === 'user' ? 'You' : 'Gemini AI'}</span>
                <span className={`text-[10px] font-mono ${msg.role === 'user' ? 'text-indigo-100/70' : 'text-slate-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className={`text-xs whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-indigo-50' : 'text-slate-300'}`}>
                {msg.role === 'ai' && msg.content.length > 140 ? msg.content.substring(0, 140) + "..." : msg.content}
              </p>
              {msg.role === 'ai' && (
                <p className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5 font-medium flex items-center gap-1">
                  <span>View SQL & Data Table</span>
                  <ArrowRight className="h-3 w-3" />
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Generating SQL query & processing...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            aria-label="Ask a question about your dataset"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 text-xs h-9 focus:border-indigo-500/60 rounded-xl"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 h-9 rounded-xl shadow-md"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

