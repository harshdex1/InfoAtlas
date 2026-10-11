import React, { useState } from "react";
import { X, Sparkles, Send, Bot, User as UserIcon, RefreshCw } from "lucide-react";
import { askGemini } from "../services/api";

interface AiAssistantModalProps {
  onClose: () => void;
  isDark: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose, isDark }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your InfoAtlas AI knowledge assistant. Ask me anything about science, history, space, technology, or any complex topic!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    const historyContext = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
    const aiRes = await askGemini(userMsg, historyContext, "You are InfoAtlas AI, an expert research and educational assistant. Provide clear, well-structured, and accurate answers.");

    setMessages([...newMessages, { role: "assistant", content: aiRes }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className={`w-full max-w-2xl h-[600px] rounded-3xl border flex flex-col shadow-2xl relative overflow-hidden ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">InfoAtlas AI Knowledge Companion</h2>
              <span className="text-[10px] text-indigo-400">Powered by Gemini</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white'
              }`}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : isDark ? 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${isDark ? 'bg-slate-950/80 border border-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800/60 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any question about any topic..."
            className={`w-full text-xs sm:text-sm px-4 py-3 rounded-xl border transition-all ${
              isDark ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
