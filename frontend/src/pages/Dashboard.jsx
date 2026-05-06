import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ListTodo, AlertCircle, ArrowUpRight, Activity, Info, ChevronDown, Check, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const CatchMeUpBanner = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dashboard/catch-me-up');
      setSummary(res.data.summary);
    } catch (err) {
      setSummary("Oops! I couldn't connect to the HiveMind right now. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl p-3 mb-6 relative group border border-brand-yellow/20 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-brand-yellow/10"
          >
            <button 
              onClick={() => setIsVisible(false)} 
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors z-20"
            >
              <X size={14} />
            </button>
            
            <div className="absolute inset-0 bg-brand-yellow/5 group-hover:bg-brand-yellow/10 transition-colors duration-500 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 pr-6">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                  <Sparkles className="text-brand-yellow" size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white leading-tight">AI Catch Me Up</h2>
                  {!summary && !loading && (
                    <p className="text-slate-400 font-medium text-[11px] mt-0.5">
                      Summarize recent chat and task activity instantly.
                    </p>
                  )}
                </div>
              </div>

              {!summary && (
                <div className="sm:ml-auto pr-6">
                  <button 
                    onClick={fetchSummary}
                    disabled={loading}
                    className="w-full sm:w-auto px-3 py-1.5 bg-gradient-to-r from-brand-yellow to-brand-yellow/80 hover:to-brand-yellow/90 text-slate-900 text-xs font-bold rounded-lg shadow-sm shadow-brand-yellow/30 hover:shadow-brand-yellow/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Analyzing...' : 'Generate ✨'}
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(loading || summary) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  className="overflow-hidden relative z-10"
                >
                  {loading && (
                    <div className="space-y-2 w-full pt-3 border-t border-white/5">
                      <div className="h-2.5 bg-slate-800 rounded-md w-3/4 animate-pulse"></div>
                      <div className="h-2.5 bg-slate-800 rounded-md w-full animate-pulse"></div>
                      <div className="h-2.5 bg-slate-800 rounded-md w-5/6 animate-pulse"></div>
                    </div>
                  )}
                  
                  {summary && !loading && (
                    <div className="pt-3 border-t border-white/5 prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1 prose-strong:text-brand-yellow">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!isVisible && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 right-6 z-[100] flex flex-col items-end"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence>
            {isHovered && !isDragging && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                className="absolute right-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-800 border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xl pointer-events-none"
              >
                Catch Me Up
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-t border-r border-white/10 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => { 
              if (!isDragging) setIsVisible(true); 
            }}
            className="w-10 h-10 rounded-[14px] bg-slate-900/80 border border-brand-yellow/30 text-brand-yellow flex items-center justify-center shadow-[0_8px_30px_var(--tw-shadow-color)] shadow-brand-yellow/20 backdrop-blur-xl hover:bg-slate-800 transition-colors pointer-events-auto"
          >
            <Sparkles size={18} />
          </button>
        </motion.div>
      )}
    </>
  );
};


const WorkflowHealth = ({ stats }) => {
  const total = stats?.total_tasks || 0;
  const done = stats?.tasks_by_status?.["Done"] || 0;
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
      <h2 className="text-base font-extrabold text-white mb-4 w-full text-left z-10 flex items-center gap-2">
        <Info size={18} className="text-emerald-400" />
        Workflow Health
      </h2>
      <div className="relative z-10 flex flex-1 items-center justify-center w-full">
        <svg className="w-32 h-32 transform -rotate-90 filter drop-shadow-xl">
          <circle cx="64" cy="64" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
          <motion.circle 
            cx="64" cy="64" r="48" 
            stroke="url(#healthGradient)" 
            strokeWidth="12" 
            fill="transparent" 
            strokeDasharray={circumference} 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            strokeLinecap="round" 
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 drop-shadow-sm">{percentage}%</span>
        </div>
      </div>
      <p className="text-slate-400 font-medium text-xs mt-4 text-center z-10">
        {total === 0 ? "No tasks yet. Start planning!" : percentage === 100 ? "All caught up! Great job." : `${done} of ${total} tasks completed.`}
      </p>
    </div>
  );
};

const ActivityFeed = ({ activities }) => {
  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
      <div className="absolute bottom-[-50%] right-[-50%] w-[100%] h-[100%] rounded-full bg-brand-yellow/5 blur-3xl pointer-events-none"></div>
      <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2 relative z-10">
        <Activity size={18} className="text-brand-yellow" />
        Recent Activity
      </h2>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative z-10">
        {activities?.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="flex gap-3 relative"
          >
            {idx !== activities.length - 1 && (
              <div className="absolute top-8 left-[11px] bottom-[-16px] w-0.5 bg-slate-700/50"></div>
            )}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${item.type === 'system' ? 'bg-slate-700 text-slate-300' : item.type === 'complete' ? 'bg-emerald-500/20 text-emerald-400' : item.type === 'update' ? 'bg-blue-500/20 text-blue-400' : 'bg-brand-yellow/20 text-brand-yellow'}`}>
              <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]"></div>
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm font-bold text-slate-200">{item.user}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{item.action}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/projects');
        setProjects(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/dashboard?project_id=${selectedProjectId}`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-brand-yellow/30 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-brand-yellow rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="text-slate-500 font-medium">Loading hive mind...</div>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Tasks", value: stats?.total_tasks || 0, icon: <ListTodo size={20} className="text-blue-400" />, bg: "bg-blue-900/40", border: "border-blue-500/20" },
    { title: "To Do", value: stats?.tasks_by_status?.["To Do"] || 0, icon: <AlertCircle size={20} className="text-slate-400" />, bg: "bg-slate-800/40", border: "border-slate-600/30" },
    { title: "In Progress", value: stats?.tasks_by_status?.["In Progress"] || 0, icon: <Clock size={20} className="text-amber-400" />, bg: "bg-amber-900/40", border: "border-amber-500/20" },
    { title: "Done", value: stats?.tasks_by_status?.["Done"] || 0, icon: <CheckCircle2 size={20} className="text-emerald-400" />, bg: "bg-emerald-900/40", border: "border-emerald-500/20" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold text-white mb-2 tracking-tight"
          >
            The Hive Mind
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 font-medium"
          >
            Real-time insights and activity across your workspaces.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-white/5 shadow-sm relative z-50"
          ref={dropdownRef}
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Workspace:</span>
          
          <div className="relative min-w-[200px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-900/80 text-slate-200 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-700 hover:border-brand-yellow/50 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all"
            >
              <span className="truncate">
                {selectedProjectId === 'all' 
                  ? 'All Workspaces' 
                  : projects.find(p => p._id === selectedProjectId)?.name || 'Select Workspace'}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
                >
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setSelectedProjectId('all'); setIsDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${selectedProjectId === 'all' ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    >
                      <span>All Workspaces</span>
                      {selectedProjectId === 'all' && <Check size={16} />}
                    </button>
                    {projects.map(p => (
                      <button
                        key={p._id}
                        onClick={() => { setSelectedProjectId(p._id); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${selectedProjectId === p._id ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        {selectedProjectId === p._id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <CatchMeUpBanner />

      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div 
            key={idx}
            onClick={() => card.value > 0 && navigate('/projects')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 0.4, ease: "easeOut" }}
            className={`glass-card rounded-2xl p-4 relative overflow-hidden group ${card.value > 0 ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${card.bg} opacity-50 ${card.value > 0 ? 'group-hover:scale-150' : ''} transition-transform duration-500`}></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} border ${card.border} shadow-sm ${card.value > 0 ? 'group-hover:-translate-y-1' : ''} transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className={`w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 opacity-0 ${card.value > 0 ? 'group-hover:opacity-100' : ''} transition-opacity`}>
                  {card.value > 0 && <ArrowUpRight size={14} />}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{card.value}</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{card.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Row: Workflow Health, Overdue, Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 h-[320px]"
        >
          <WorkflowHealth stats={stats} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1 h-[320px]"
        >
          <div className="glass-card rounded-2xl p-6 h-full flex flex-col items-start justify-center bg-gradient-to-br from-red-900/20 to-orange-900/10 border border-red-500/20 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            <div className="w-12 h-12 mb-4 rounded-xl bg-red-900/40 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm flex-shrink-0 relative z-10">
              <AlertCircle size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-xl font-extrabold text-red-400 mb-2">Overdue Tasks</p>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                You have <strong className="text-red-400 text-base mx-1">{stats?.overdue_tasks || 0}</strong> tasks that require immediate attention.
              </p>
              {(stats?.overdue_tasks || 0) > 0 && (
                <button 
                  onClick={() => navigate('/projects')}
                  className="mt-6 px-4 py-2 w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
                >
                  Review Tasks Now
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1 h-[320px]"
        >
          <ActivityFeed activities={stats?.recent_activity || []} />
        </motion.div>
      </div>
    </div>
  );
}
