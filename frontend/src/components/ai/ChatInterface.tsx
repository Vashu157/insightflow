"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
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
    <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-medium text-white">AI Assistant</h3>
      </div>

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {history.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Bot className="h-12 w-12 text-slate-700" />
            <p>Ask me anything about your dataset!</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTIONS.map(s => (
                <button 
                  key={s} 
                  onClick={() => onSend(s)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-full text-indigo-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'ai' ? 'cursor-pointer hover:bg-slate-800/30 p-2 -mx-2 rounded-lg transition-colors' : ''}`}
            onClick={() => msg.role === 'ai' && onSelectMessage(msg)}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-indigo-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-slate-200">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                <span className="text-xs text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {msg.role === 'ai' && msg.content.length > 150 ? msg.content.substring(0, 150) + "..." : msg.content}
              </p>
              {msg.role === 'ai' && (
                <p className="text-xs text-indigo-400 mt-2 font-medium">Click to view full results &rarr;</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 p-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Analyzing dataset...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
