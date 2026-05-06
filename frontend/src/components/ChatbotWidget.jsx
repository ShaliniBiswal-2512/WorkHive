import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const greeting = firstName ? `Hi ${firstName}! I'm HiveBot, your AI support assistant. How can I help you with WorkHive today?` : "Hi! I'm HiveBot, your AI support assistant. How can I help you with WorkHive today?";
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: greeting }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-hide the initial tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasOpened(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('/bot/chat', {
        message: userMessage.content,
        history: messages 
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I'm having trouble connecting to my servers right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      ref={widgetRef}
      drag 
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
      className="fixed bottom-6 right-6 z-[110] flex flex-col items-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Tooltip Bubble */}
      <AnimatePresence>
        {!isOpen && (!hasOpened || isHovered) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className="absolute bottom-[70px] right-2 bg-slate-800 text-slate-200 font-medium text-sm px-4 py-2.5 rounded-2xl rounded-br-sm border border-slate-700 shadow-xl pointer-events-auto whitespace-nowrap cursor-default"
          >
            How can I help you? 👋
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden w-[360px] mb-4 flex flex-col h-[550px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-white font-extrabold tracking-tight leading-tight">HiveBot</h3>
                  <p className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">AI Support</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-transparent hover:border-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand-yellow text-slate-900 rounded-br-none' 
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none prose prose-sm prose-invert prose-p:leading-snug prose-a:text-brand-yellow prose-a:no-underline hover:prose-a:underline'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-slate-800/80 border-t border-white/5">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask HiveBot anything..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-lg bg-brand-yellow text-slate-900 hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0"
                >
                  <Send size={16} className={isTyping ? "animate-pulse" : ""} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button 
        onClick={() => { 
          if (!isDragging) {
            setIsOpen(!isOpen); 
            setHasOpened(true); 
          }
        }}
        className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-yellow to-brand-yellow/80 rounded-2xl shadow-[0_8px_30px_var(--tw-shadow-color)] shadow-brand-yellow/30 hover:shadow-brand-yellow/50 transition-shadow text-slate-900 z-50 border border-brand-yellow/30 cursor-pointer"
      >
        {isOpen ? <Minus size={24} /> : <Bot size={28} strokeWidth={2.5} />}
      </button>

    </motion.div>
  );
}
