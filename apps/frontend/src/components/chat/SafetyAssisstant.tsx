import { useState } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { useSafetyChat, type ChatMessage } from '../../hooks/useSafetyChat';

export const SafetyAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const chat = useSafetyChat();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 left-4 z-100 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 dark:bg-slate-800 dark:border dark:border-gray-700 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle size={28} />
      </button>

      <div 
        className={`fixed bottom-0 left-0 z-110 w-full sm:w-96 h-[80vh] sm:h-150 sm:bottom-4 sm:left-4 flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-slate-50 dark:bg-gray-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-transparent dark:border-gray-800 transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
      >
        <ChatHeader onClose={() => setIsOpen(false)} />
        
        <MessageList 
          messages={chat.messages} 
          isLoading={chat.isLoading} 
          scrollRef={chat.messagesEndRef as React.RefObject<HTMLDivElement>} 
        />
        
        <ChatInput 
          input={chat.input} 
          setInput={chat.setInput} 
          isLoading={chat.isLoading} 
          handleSend={chat.handleSend} 
        />
      </div>
    </>
  );
};

const ChatHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between bg-slate-900 dark:bg-[#121212] px-5 py-4 text-white border-b dark:border-gray-800">
    <div className="flex items-center gap-3">
      <Bot size={24} className="text-blue-400" />
      <h2 className="text-lg font-bold tracking-wide">FearFree AI</h2>
    </div>
    <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
      <X size={20} />
    </button>
  </div>
);

const MessageList = ({ 
  messages, 
  isLoading, 
  scrollRef 
}: { 
  messages: ChatMessage[], 
  isLoading: boolean, 
  scrollRef: React.RefObject<HTMLDivElement> 
}) => (
  <div className="flex-1 overflow-y-auto p-5 space-y-4">
    {messages.map((msg, idx) => (
      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          msg.role === 'user' 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
        }`}>
          {msg.text}
        </div>
      </div>
    ))}
    
    {isLoading && (
      <div className="flex justify-start">
        <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Scanning live data...
        </div>
      </div>
    )}
    <div ref={scrollRef} />
  </div>
);

const ChatInput = ({ 
  input, 
  setInput, 
  isLoading, 
  handleSend 
}: { 
  input: string, 
  setInput: (v: string) => void, 
  isLoading: boolean, 
  handleSend: () => void 
}) => (
  <div className="border-t border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-[#121212]">
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-blue-500 dark:focus-within:bg-gray-800 dark:focus-within:ring-blue-900/30 transition-all">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Ask about route safety..."
        className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-gray-500"
      />
      <button 
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity disabled:opacity-50"
      >
        <Send size={16} className="ml-1" />
      </button>
    </div>
  </div>
);