import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Users, ArrowRight, X, FolderKanban, Trash2, AlertTriangle, Key, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Tooltip = ({ children, content }) => (
  <div className="relative group/tooltip flex items-center justify-center">
    {children}
    <div className="absolute top-full mt-2 px-3 py-1.5 bg-slate-800 backdrop-blur-md text-slate-200 text-xs font-bold rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 scale-95 group-hover/tooltip:scale-100">
      {content}
    </div>
  </div>
);

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);
    try {
      await axios.post('/projects', { 
        name: newProjectName
      });
      setNewProjectName('');
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.error || 'Failed to create workspace. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      await axios.post('/projects/join', { invite_code: inviteCode });
      fetchProjects();
      setJoinSuccess(true);
      setTimeout(() => {
        setJoinSuccess(false);
        setInviteCode('');
        setShowJoin(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setJoinError(err.response?.data?.error || 'Failed to join workspace. Invalid code?');
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`/projects/${projectId}`);
      setShowDeleteConfirm(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = async (projectId) => {
    if (!editProjectName.trim()) return;
    try {
      await axios.put(`/projects/${projectId}`, { name: editProjectName });
      setEditingProjectId(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-brand-yellow/30 rounded-full"></div>
          <div className="text-slate-500 font-medium">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Workspaces</h1>
          <p className="text-slate-400 font-medium">Manage your team's projects and tasks.</p>
        </div>
        <div className="flex gap-3">
          <Tooltip content="Join an existing workspace using a code">
            <button 
              onClick={() => setShowJoin(true)}
              className="bg-slate-800 text-slate-200 font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              <Key size={16} />
              Join via Code
            </button>
          </Tooltip>
          <Tooltip content="Create a brand new workspace">
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-brand-yellow text-slate-900 font-extrabold text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 hover:-translate-y-0.5"
            >
              <Plus size={16} />
              New Project
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, idx) => (
          <motion.div 
            key={project._id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="glass-card rounded-2xl p-5 flex flex-col group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-yellow/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900/50 to-slate-800 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                {project.admin_id === user?.id ? (
                  <>
                    <span className="text-[10px] font-bold bg-amber-900/40 border border-amber-500/30 text-amber-400 px-2 py-1 rounded uppercase tracking-wider shadow-sm">Admin</span>
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setEditingProjectId(project._id); 
                        setEditProjectName(project.name);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20"
                      title="Rename Workspace"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(project); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                      title="Delete Workspace"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded uppercase tracking-wider shadow-sm">Member</span>
                )}
              </div>
            </div>
            
            {editingProjectId === project._id ? (
              <div className="mb-2 relative z-10 flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(project._id);
                    if (e.key === 'Escape') setEditingProjectId(null);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white font-bold"
                />
                <button 
                  onClick={() => handleRename(project._id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-indigo-400 transition-colors">{project.name}</h3>
            )}
            
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-6 flex-1 font-medium relative z-10 group/members">
              <div className="p-1 bg-slate-800 rounded-md"><Users size={14} /></div>
              <span className="cursor-default">{project.members?.length || 1} team member{project.members?.length !== 1 ? 's' : ''}</span>
              
              {/* Tooltip for member names */}
              {project.member_details && project.member_details.length > 0 && (
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/members:block z-20 w-max max-w-[200px]">
                  <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-2 text-xs text-slate-300">
                    <p className="font-bold text-white mb-1 border-b border-slate-700 pb-1">Team Members</p>
                    <ul className="space-y-1">
                      {project.member_details.map((m) => (
                        <li key={m._id} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                          <span className="truncate">{m.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <Link 
              to={`/projects/${project._id}`}
              className="flex items-center justify-between text-sm font-bold text-slate-300 group-hover:text-indigo-400 transition-colors pt-5 border-t border-slate-700/50 relative z-10"
            >
              Open Workspace
              <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors border border-transparent group-hover:border-indigo-500/30">
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 glass-card rounded-2xl border-2 border-dashed border-slate-700 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-yellow/5 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-yellow to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-lg shadow-brand-yellow/20 rotate-3">
              <FolderKanban size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">No workspaces yet</h3>
            <p className="text-slate-400 text-sm font-medium mb-6 max-w-xs mx-auto">Create your first project to start collaborating with your team.</p>
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-brand-yellow text-slate-900 font-extrabold px-6 py-3 rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 hover:-translate-y-1"
            >
              Create Workspace
            </button>
          </div>
        </motion.div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-white">New Workspace</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-300 mb-2">Project Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white placeholder:text-slate-500 mb-2"
                  placeholder="e.g. Marketing Campaign Q3"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />

                {createError && <p className="text-red-400 text-xs font-bold mt-2">{createError}</p>}
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-brand-yellow text-slate-900 font-extrabold hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 flex items-center justify-center disabled:opacity-50"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      {isCreating ? 'Creating...' : 'Create'}
                    </span>
                  ) : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-white flex items-center gap-3">
                <Key size={24} className="text-indigo-400" />
                Join Workspace
              </h3>
              <button onClick={() => setShowJoin(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleJoin}>
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-300 mb-2">Invite Code</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  maxLength={6}
                  className="w-full px-5 py-4 text-center tracking-[0.5em] uppercase text-2xl rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-black text-white placeholder:text-slate-600 shadow-inner"
                  placeholder="XXXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                />
                <p className="text-xs text-slate-500 font-medium mt-3 text-center">Ask your project admin for the 6-character invite code.</p>
                {joinError && <p className="text-red-400 text-xs font-bold mt-3 bg-red-900/20 p-3 rounded-lg border border-red-500/20 text-center">{joinError}</p>}
                {joinSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-400 text-sm font-bold mt-3 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20 text-center flex items-center justify-center gap-2"
                  >
                    <span className="animate-pulse">🎉</span> Successfully joined workspace!
                  </motion.p>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowJoin(false)}
                  disabled={joining}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={joining || inviteCode.length < 1 || joinSuccess}
                  className={`flex-1 px-4 py-3.5 rounded-xl font-extrabold transition-all shadow-lg ${joinSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20 hover:-translate-y-0.5'} disabled:opacity-50`}
                >
                  {joining ? 'Joining...' : joinSuccess ? 'Joined!' : 'Join Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-red-500/20"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">Delete Workspace?</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{showDeleteConfirm.name}"</strong>? This action will permanently erase the project and all of its tasks. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm._id)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-red-500 text-white font-extrabold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Delete Forever
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
