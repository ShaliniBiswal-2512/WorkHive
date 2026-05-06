import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Bell, CheckCircle2, MessageSquare, Send, HelpCircle, Paperclip, FileText, Check, CheckCheck, Edit2, Trash2, RotateCcw, MoreHorizontal, X, Wand2 } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatbotWidget from './ChatbotWidget';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(/^\/projects\/([a-zA-Z0-9]+)/);
  const projectId = match ? match[1] : null;
  const projectIdRef = useRef(projectId);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'chat'
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'default');
  const notifRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const showNotifsRef = useRef(showNotifs);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    showNotifsRef.current = showNotifs;
    activeTabRef.current = activeTab;
  }, [showNotifs, activeTab]);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.remove('theme-pink', 'theme-green', 'theme-blue');
    if (theme !== 'default') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = (notif) => {
    setToasts(prev => [...prev, notif]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t._id !== notif._id));
    }, 5000); // 5 seconds
  };

  // Chat advanced features state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, showNotifs]);

  useEffect(() => {
    projectIdRef.current = projectId;
    
    if (socketRef.current) {
      if (projectId) {
        socketRef.current.emit('join_workspace', { 
          project_id: projectId, 
          token: localStorage.getItem('token') 
        });
      }
    }

    if (projectId) {
      fetchMessages(projectId);
    } else {
      setMessages([]);
    }

    return () => {
      if (socketRef.current && projectId) {
        socketRef.current.emit('leave_workspace', { project_id: projectId });
      }
    };
  }, [projectId]);

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 30s
    const notifInterval = setInterval(fetchNotifications, 30000);
    
    // Connect WebSockets for Real-Time Chat
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');
    const socket = io(socketUrl);
    socketRef.current = socket;
    
    socket.on('connect', () => {
      if (projectIdRef.current) {
        socket.emit('join_workspace', { 
          project_id: projectIdRef.current, 
          token: localStorage.getItem('token') 
        });
      }
    });
    
    socket.on('new_message', (msg) => {
      // Only process message if it belongs to the active workspace
      if (projectIdRef.current && msg.project_id === projectIdRef.current) {
        setMessages(prev => {
          // Prevent optimistic duplicate
          if (prev.some(m => m._id === msg._id || (m.content === msg.content && m.sender_id === msg.sender_id && Date.now() - new Date(m.created_at).getTime() < 5000))) {
            return prev;
          }
          return [...prev, msg];
        });
        
        const isChatOpen = showNotifsRef.current && activeTabRef.current === 'chat' && document.visibilityState === 'visible' && !document.hidden;
        
        // If chat is open and we received a message, mark as read
        if (isChatOpen) {
          markMessagesAsRead(projectIdRef.current);
        } else if (user && msg.sender_id !== user.id) {
          addToast({
            _id: 'chat_' + msg._id,
            type: 'message',
            sender_name: msg.sender_name,
            message: msg.content || (msg.has_attachment ? `Sent a file: ${msg.filename}` : 'Sent a message')
          });
        }
      }
    });

    socket.on('message_updated', (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    socket.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(m => m._id !== data._id));
    });

    socket.on('messages_read', (data) => {
      if (projectIdRef.current && data.project_id === projectIdRef.current) {
        setMessages(prev => prev.map(m => {
          if (m.sender_id !== data.user_id && !m.read_by?.includes(data.user_id)) {
            return { ...m, read_by: [...(m.read_by || []), data.user_id] };
          }
          return m;
        }));
      }
    });

    socket.on('new_notification', (notif) => {
      // Ensure the notification is for the current user
      if (user && notif.user_id === user.id) {
        setNotifications(prev => {
          if (prev.some(n => n._id === notif._id)) return prev;
          return [notif, ...prev];
        });
        addToast(notif);
      }
    });

    return () => {
      clearInterval(notifInterval);
      socket.disconnect();
    };
  }, []);

  const fetchMessages = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`/messages?project_id=${id}`);
      setMessages(res.data);
      if (res.data.length > 0) {
        markMessagesAsRead(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markMessagesAsRead = async (id) => {
    try {
      await axios.post('/messages/read', { project_id: id });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && projectId) {
      markMessagesAsRead(projectId);
    }
  }, [activeTab, projectId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!projectId) return;
    if (!newMessage.trim() && !selectedFile) return;
    try {
      // Optimistic update
      const tempMsg = { 
        _id: Date.now().toString(), 
        project_id: projectId,
        sender_id: user.id, 
        sender_name: user.name, 
        content: newMessage.trim(), 
        created_at: new Date(),
        has_attachment: !!selectedFile,
        filename: selectedFile?.name,
        read_by: [],
        is_edited: false,
        is_deleted: false
      };
      
      setMessages([...messages, tempMsg]);
      setNewMessage('');
      setSelectedFile(null);
      
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('content', tempMsg.content);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const res = await axios.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data : m));
    } catch (err) {
      console.error(err);
      fetchMessages(projectId); // revert on fail
    }
  };

  const handlePolishMessage = async () => {
    if (!newMessage.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await axios.post('/bot/polish', { text: newMessage });
      if (res.data.polished_text) {
        setNewMessage(res.data.polished_text);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: "Failed to polish message." });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editMessageContent.trim()) {
      setEditingMessageId(null);
      return;
    }
    try {
      const res = await axios.put(`/messages/${msgId}`, { content: editMessageContent });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      setEditingMessageId(null);
      setHoveredMessageId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await axios.delete(`/messages/${msgId}`);
      fetchMessages(projectIdRef.current);
      setHoveredMessageId(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = messages.filter(m => m.sender_id !== user?.id && !m.read_by?.includes(user?.id)).length;
  const totalUnreadCount = unreadCount + unreadMessagesCount;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban size={20} /> },
  ];

  return (
    <div className="flex h-screen mesh-bg p-4 gap-4">
      {/* Floating Glass Sidebar */}
      <aside className="w-64 glass-panel rounded-3xl flex flex-col relative z-20">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-yellow/10 to-transparent pointer-events-none"></div>
        
        <div className="h-20 flex items-center px-8 relative z-10">
          <div className="flex items-center gap-3 text-white font-extrabold text-2xl tracking-tight">
            <div className="relative flex items-center justify-center w-10 h-10">
              <img src="/logo.png" alt="WorkHive Logo" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
              <div className="absolute inset-0 bg-brand-yellow/20 blur-md rounded-full -z-10"></div>
            </div>
            WorkHive
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm ${
                  isActive 
                    ? 'bg-white/10 text-brand-yellow shadow-lg shadow-black/20 translate-x-1 border border-white/5' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1 border border-transparent'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1 border border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MessageSquare size={20} className={totalUnreadCount > 0 ? "text-brand-yellow animate-pulse" : ""} />
                  {totalUnreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></div>
                  )}
                </div>
                Hub
              </div>
              {totalUnreadCount > 0 && (
                <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-lg text-xs font-bold">{totalUnreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute left-full top-0 ml-4 w-96 h-[500px] flex flex-col bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                {/* Header & Tabs */}
                <div className="flex border-b border-white/5 bg-slate-900/50">
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'notifications' ? 'text-brand-yellow border-b-2 border-brand-yellow bg-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <Bell size={16} />
                    Alerts
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-brand-yellow border-b-2 border-brand-yellow bg-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <MessageSquare size={16} />
                    Team Chat
                    {unreadMessagesCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMessagesCount}</span>}
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  {activeTab === 'notifications' ? (
                    <div className="p-2 space-y-1">
                      {unreadCount > 0 && (
                        <div className="px-4 py-2 flex justify-end">
                          <button onClick={markAllAsRead} className="text-xs text-brand-yellow hover:text-amber-400 font-bold">Mark all read</button>
                        </div>
                      )}
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm font-medium">No alerts yet.</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif._id} className={`p-4 rounded-xl flex gap-3 transition-colors ${notif.read ? 'opacity-60 hover:bg-white/5' : 'bg-brand-yellow/5 border border-brand-yellow/10'}`}>
                            <div className="mt-0.5">
                              {!notif.read ? (
                                <div className="w-2 h-2 rounded-full bg-brand-yellow shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                              ) : (
                                <CheckCircle2 size={12} className="text-emerald-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-200 font-medium leading-snug mb-1">{notif.message}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                            {!notif.read && (
                              <button onClick={() => markAsRead(notif._id)} className="text-slate-500 hover:text-white transition-colors self-start">
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {!projectId ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center h-full space-y-3">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-2">
                            <FolderKanban size={24} />
                          </div>
                          <p className="text-slate-300 font-bold">No Workspace Selected</p>
                          <p className="text-slate-500 text-sm font-medium">Please open a workspace to chat with your team.</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm font-medium">Start the conversation!</div>
                      ) : (
                        messages.map((msg, i) => {
                          const isMine = msg.sender_id === user.id;
                          const canDelete = isMine && (Date.now() - new Date(msg.created_at).getTime()) <= 10000;
                          
                          return (
                            <div 
                              key={msg._id || i} 
                              className={`flex flex-col group/msg relative ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              {/* ACTION MENU */}
                              {isMine && !msg.is_deleted && !editingMessageId && (
                                <div className="absolute -top-2 right-4 flex items-center z-20 opacity-0 group-hover/msg:opacity-100 transition-opacity pointer-events-none group-hover/msg:pointer-events-auto">
                                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                                    <button onClick={() => { setEditingMessageId(msg._id); setEditMessageContent(msg.content); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700" title="Edit">
                                      <Edit2 size={12} />
                                    </button>
                                    {canDelete && (
                                      <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500" title="Delete">
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {!isMine && <span className="text-[10px] text-slate-400 font-bold ml-2 mb-1">{msg.sender_name}</span>}
                              
                              <div className={`px-4 py-2.5 max-w-[85%] rounded-2xl text-sm font-medium shadow-sm ${
                                msg.is_deleted 
                                  ? 'bg-slate-800/50 text-slate-500 italic border border-slate-700/50' 
                                  : isMine 
                                    ? 'bg-brand-yellow text-slate-900 rounded-br-none' 
                                    : 'bg-slate-700/50 text-slate-200 border border-white/5 rounded-bl-none'
                              }`}>
                                {msg.has_attachment && (
                                  <a 
                                    href={msg.file_url || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download={msg.filename}
                                    className={`flex items-center gap-2 p-2 rounded-lg mb-2 hover:opacity-80 transition-opacity ${msg.is_deleted ? 'hidden' : isMine ? 'bg-amber-400/20' : 'bg-slate-800'}`}
                                  >
                                    <FileText size={16} />
                                    <span className="text-xs font-bold underline decoration-brand-yellow/30">{msg.filename}</span>
                                  </a>
                                )}
                                
                                {editingMessageId === msg._id ? (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      value={editMessageContent} 
                                      onChange={e => setEditMessageContent(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleEditMessage(msg._id); if(e.key === 'Escape') setEditingMessageId(null); }}
                                      autoFocus
                                      className="bg-black/10 border-b border-slate-900/30 px-1 py-0.5 outline-none text-slate-900 placeholder:text-slate-800/50"
                                    />
                                    <button onClick={() => handleEditMessage(msg._id)}><Check size={14} className="text-slate-900 hover:scale-110" /></button>
                                  </div>
                                ) : (
                                  msg.content && msg.content !== `Sent a file: ${msg.filename}` && <div>{msg.content}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 mt-1 px-1">
                                <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {msg.is_edited && !msg.is_deleted && <span className="opacity-70">(edited)</span>}
                                </span>
                                {isMine && !msg.is_deleted && (
                                  <span className="text-slate-500">
                                    {msg.read_by?.length > 0 ? (
                                      <CheckCheck size={12} className="text-blue-400" />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input (Only shown on Chat tab) */}
                {activeTab === 'chat' && projectId && (
                  <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/80 border-t border-white/5 flex flex-col gap-2 relative">
                    {selectedFile && (
                      <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs text-indigo-300 font-medium">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} />
                          <span className="truncate">{selectedFile.name}</span>
                        </div>
                        <button type="button" onClick={() => setSelectedFile(null)} className="hover:text-white"><X size={14} /></button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="chat-file-upload" 
                        className="hidden" 
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                      <label 
                        htmlFor="chat-file-upload" 
                        className="flex items-center justify-center p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white text-slate-400 cursor-pointer transition-colors"
                      >
                        <Paperclip size={18} />
                      </label>
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
                      />
                      <button 
                        type="button"
                        onClick={handlePolishMessage}
                        disabled={!newMessage.trim() || isPolishing}
                        className="flex items-center justify-center p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-brand-yellow/20 hover:text-brand-yellow hover:border-brand-yellow/50 text-slate-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                        title="AI Polish Message"
                      >
                        <Wand2 size={18} className={isPolishing ? "animate-pulse text-brand-yellow" : ""} />
                        <span className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 whitespace-nowrap">
                          {isPolishing ? "Polishing..." : "AI Polish ✨"}
                        </span>
                      </button>
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim() && !selectedFile}
                        className="bg-brand-yellow text-slate-900 p-2.5 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
          
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm ${
                isActive 
                  ? 'bg-white/10 text-brand-yellow shadow-lg shadow-black/20 translate-x-1 border border-white/5' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1 border border-transparent'
              }`
            }
          >
            <HelpCircle size={20} />
            About
          </NavLink>
        </nav>

        <div className="p-4 relative z-10 flex flex-col gap-3">
          {/* Theme Selector */}
          <div className="flex justify-center gap-3 px-4 py-2.5 bg-slate-800/20 rounded-2xl border border-white/5">
            {[
              { id: 'default', color: 'bg-[#FACC15]' },
              { id: 'pink', color: 'bg-[#E81CFF]' },
              { id: 'green', color: 'bg-[#10B981]' },
              { id: 'blue', color: 'bg-[#3B82F6]' }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-5 h-5 rounded-full ${t.color} ${theme === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-110'} transition-all`}
                title={`Switch to ${t.id} theme`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/40 border border-white/5 shadow-sm backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-yellow to-brand-yellow/80 text-slate-900 flex items-center justify-center font-extrabold text-lg shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate font-medium">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-2xl text-slate-400 font-semibold hover:bg-red-500/10 hover:text-red-400 hover:shadow-sm transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative glass-panel rounded-3xl">
        <div className="absolute top-[-50%] left-[-10%] w-[80%] h-[80%] rounded-full bg-brand-yellow/5 blur-3xl pointer-events-none"></div>
        <div className="flex-1 overflow-auto p-8 relative z-10 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast._id} className="pointer-events-auto bg-slate-800/95 backdrop-blur-xl border border-brand-yellow/30 shadow-2xl shadow-brand-yellow/10 rounded-2xl p-4 flex gap-3 items-start max-w-sm animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
              {toast.type === 'message' ? <MessageSquare size={16} /> : <Bell size={16} />}
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm text-slate-200 font-bold leading-snug">
                {toast.type === 'message' ? `New message from ${toast.sender_name}` : 'New Alert'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t._id !== toast._id))} className="text-slate-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
