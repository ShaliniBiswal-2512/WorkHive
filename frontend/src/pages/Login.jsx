import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center mesh-bg p-2 relative overflow-hidden">
      {/* Animated Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-yellow/10 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-accent/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-brand-success/10 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full glass-card rounded-[2rem] p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/20 relative border border-white/5 p-2">
            <img src="/logo.png" alt="WorkHive Logo" className="w-full h-full object-contain relative z-10" />
            <div className="absolute inset-0 bg-brand-yellow/5 rounded-2xl"></div>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-400 mt-2 font-medium">Log in to access your workspaces.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 shadow-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Email address</label>
            <input 
              type="email" 
              required
              className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all shadow-inner placeholder:text-slate-600/60 font-medium text-white"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-300">Password</label>
              <a href="#" className="text-sm font-semibold text-brand-yellow hover:text-amber-400 transition-colors">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all shadow-inner placeholder:text-slate-600/60 font-medium text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-brand-yellow text-slate-900 font-extrabold text-lg py-3 rounded-xl hover:bg-amber-400 transition-all shadow-xl shadow-brand-yellow/10 flex items-center justify-center group"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
              <span className="flex items-center gap-2">
                Sign In
                <motion.span className="inline-block transition-transform group-hover:translate-x-1">→</motion.span>
              </span>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-medium text-slate-400">
          New to WorkHive? <Link to="/signup" className="text-white font-bold hover:text-brand-yellow transition-colors">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
