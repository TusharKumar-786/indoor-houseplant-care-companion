import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, X, Sprout, RotateCcw } from 'lucide-react';
import { Drawer } from './ui/Drawer';
import api from '../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'leafy';
  text: string;
  timestamp: string;
  isError?: boolean;
  isFallback?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'leafy',
  text: 'Hello. I am Leafy, your botanical care companion. Ask me anything about watering, light, soil mixes, or symptoms your plants are experiencing.',
  timestamp: 'Just now',
};

const SESSION_KEY = 'leafy-chat';

function loadFromSession(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME_MESSAGE];
    return parsed;
  } catch {
    return [WELCOME_MESSAGE];
  }
}

export const AskLeafyDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadFromSession);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);
  const lastSentRef = useRef<string>('');

  const quickQuestions = [
    'Why are lower leaves turning yellow?',
    'How do I test if soil is dry 2 inches down?',
    'What window direction is best for Monsteras?',
    'How to prevent spider mites in dry seasons?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setMessages([WELCOME_MESSAGE]);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    if (!textToSend || isLoading || isSendingRef.current) return;
    isSendingRef.current = true;
    lastSentRef.current = textToSend;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Filter valid history to send (exclude welcome and transient error messages)
    const validHistory = messages
      .filter((m) => m.id !== 'welcome' && !m.isError && m.text.trim().length > 0)
      .slice(-10)
      .map((m) => ({
        sender: m.sender,
        text: m.text.trim(),
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.post('/leafy', {
        message: textToSend,
        history: validHistory,
      });

      const replyText =
        res.data?.data?.reply ||
        'I recommend ensuring your plant pot has drainage holes and allowing topsoil to dry before watering again.';

      const leafyMessage: ChatMessage = {
        id: `leafy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'leafy',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: res.data?.data?.is_fallback === true,
      };

      setMessages((prev) => [...prev, leafyMessage]);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message as string | undefined;
      const errorText =
        serverMsg || 'Unable to reach the botanical guide right now. Please check your connection and try again.';

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'leafy',
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1F3D2B] text-white shadow-lifted hover:bg-[#14291D] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
        aria-label="Ask Leafy Botanical Assistant"
      >
        <div className="w-6 h-6 rounded-full bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
          <Sprout className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold tracking-wide">Ask Leafy</span>
      </button>

      {/* Slide-in Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1F3D2B] text-[#E4EDB8] flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#1F3D2B]">Ask Leafy</span>
              <p className="text-[11px] text-[#736159] font-normal">Botanical Care Assistant</p>
            </div>
          </div>
        }
        width="md"
      >
        <div className="flex flex-col h-full justify-between space-y-4">
          {/* Chat Message Stream */}
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#1F3D2B] text-[#F5F1E6] rounded-br-xs'
                      : m.isError
                      ? 'bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/30 rounded-bl-xs shadow-xs'
                      : 'bg-white text-[#3B2F2A] border border-[#C9D8C5] rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-[#736159]/70">
                    {m.timestamp}
                  </span>
                  {m.isFallback && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#C8693F] bg-[#FBECE6] px-1.5 py-0.5 rounded font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8693F]" />
                      Botanical guide fallback
                    </span>
                  )}
                </div>
                {m.isError && (
                  <button
                    onClick={() => handleSend(lastSentRef.current)}
                    disabled={isLoading}
                    className="mt-1 px-2.5 py-1 rounded-lg border border-[#C8693F]/40 text-[#C8693F] text-[10px] hover:bg-[#FBECE6] transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl text-xs text-[#736159] w-fit border border-[#C9D8C5]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3E7B52] animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#3E7B52] animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#3E7B52] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Leafy is consulting botanical records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="space-y-1.5 pt-2">
              <p className="text-[11px] font-semibold text-[#736159]">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-[#C9D8C5] text-[#1F3D2B] hover:bg-[#E4EDB8]/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear chat link */}
          {messages.length > 2 && (
            <div className="flex justify-end pt-1">
              <button
                onClick={clearChat}
                className="text-[10px] text-[#736159]/60 hover:text-[#736159] transition-colors"
              >
                Clear conversation
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="pt-2 border-t border-[#C9D8C5]/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about soil, water, light, or pests..."
              className="input-botanical text-xs flex-1 py-2.5 bg-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-[#1F3D2B] text-white hover:bg-[#14291D] disabled:opacity-40 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Drawer>
    </>
  );
};
