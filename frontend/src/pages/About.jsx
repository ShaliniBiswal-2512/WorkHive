import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Globe, Info, ShieldCheck, Zap, CheckCircle2, GitBranch, AtSign, Code2, Cpu, Database, Layout, BookOpen, Lock, ArrowUpRight, PlayCircle, Users, Star } from 'lucide-react';

export default function About() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSent(true);
    setMsg('');
    setTimeout(() => setSent(false), 3000);
  };

  const features = [
    { name: "Real-time Sync", icon: <Zap size={16} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Bank-grade Security", icon: <ShieldCheck size={16} />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { name: "Cross-Platform", icon: <Globe size={16} />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { name: "Smart Automation", icon: <Cpu size={16} />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { name: "Cloud Backup", icon: <Database size={16} />, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    { name: "Intuitive Design", icon: <Layout size={16} />, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" }
  ];



  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative group cursor-pointer">
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-3xl blur-xl group-hover:bg-brand-yellow/30 transition-colors"></div>
            <img src="/logo.png" alt="WorkHive Logo" className="w-16 h-16 object-contain relative z-10 drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">WorkHive</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-full border border-slate-700 shadow-sm">Version 2.4.0</span>
            <span className="px-3 py-1 bg-brand-yellow/10 text-brand-yellow text-xs font-bold rounded-full border border-brand-yellow/20 shadow-sm">Stable Channel</span>
          </div>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            The next-generation workspace collaboration platform. Engineered for teams who demand performance, aesthetic excellence, and real-time synchronization.
          </p>
        </div>
      </motion.div>

      {/* Grid: Features & Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-[2rem] p-8"
        >
          <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
            <Star className="text-brand-yellow" size={20} />
            Core Capabilities
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${feature.border} ${feature.bg} hover:scale-[1.02] transition-transform cursor-default`}>
                <div className={`p-2 rounded-lg bg-slate-900/50 ${feature.color} shadow-sm`}>
                  {feature.icon}
                </div>
                <span className="text-sm font-bold text-slate-200">{feature.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Our Story */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[2rem] p-8 flex flex-col"
        >
          <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
            <Info className="text-blue-400" size={20} />
            Our Story
          </h2>
          <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium relative z-10 mb-4">
              WorkHive was born out of a shared frustration with clunky, slow collaboration tools. We envisioned a platform that operated as fast as we think—with zero latency and an aesthetic that inspires creativity.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed font-medium relative z-10">
              Today, we're proud to power high-performing teams worldwide who refuse to compromise on design, security, or performance. We built this for you.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Support Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-[2rem] p-10 flex flex-col md:flex-row gap-10 border-t-4 border-t-brand-yellow/50"
      >
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-white mb-4">Need Help?</h2>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">
            Our support team is here for you 24/7. Reach out through the form or connect with us directly for fast resolutions.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                <Mail size={20} className="text-brand-yellow" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Email Support</p>
                <span className="font-bold">support@workhive.app</span>
              </div>
            </div>

          </div>
        </div>

        <div className="flex-1 bg-slate-900/50 p-8 rounded-[1.5rem] border border-slate-700/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-lg font-extrabold text-white mb-6 relative z-10">Send us a message</h3>
          <form onSubmit={handleContactSubmit} className="space-y-5 relative z-10">
            <div>
              <textarea 
                rows={4}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-5 py-4 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 resize-none shadow-inner transition-all"
                placeholder="How can we help you?"
              ></textarea>
            </div>
            <button 
              type="submit" 
              className={`w-full font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 hover:-translate-y-0.5 ${sent ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-brand-yellow text-slate-900 hover:bg-amber-400 shadow-brand-yellow/10'}`}
            >
              {sent ? (
                <>Message Sent! <CheckCircle2 size={18} /></>
              ) : (
                <>Send Message <Zap size={18} /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Footer / Copyright */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8"
      >
        <p className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
          Made with <span className="text-red-500">♥</span> by the WorkHive Team
        </p>
        <p className="text-slate-600 text-xs mt-2">© {new Date().getFullYear()} WorkHive Inc. All rights reserved.</p>
      </motion.div>
    </div>
  );
}
