import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Calendar, UserPlus, ArrowLeft, X, LayoutTemplate, ShieldAlert, Trash2, CheckCircle2, Sparkles, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Tooltip = ({ children, content }) => (
  <div className="relative group/tooltip flex items-center justify-center">
    {children}
    <div className="absolute top-full mt-2 px-3 py-1.5 bg-slate-800 backdrop-blur-md text-slate-200 text-xs font-bold rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 scale-95 group-hover/tooltip:scale-100">
      {content}
    </div>
  </div>
);

export default function TaskBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState({
    'To Do': [],
    'In Progress': [],
    'Done': []
  });
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '', status: 'To Do' });
  
  const [showEdit, setShowEdit] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchTasksAndProject = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        axios.get(`/tasks?project_id=${projectId}`),
        axios.get('/projects')
      ]);
      
      const fetchedTasks = tasksRes.data;
      const proj = projRes.data.find(p => p._id === projectId);
      
      if (!proj) {
        navigate('/projects');
        return;
      }
      setProject(proj);

      const grouped = { 'To Do': [], 'In Progress': [], 'Done': [] };
      fetchedTasks.forEach(task => {
        if (grouped[task.status]) grouped[task.status].push(task);
        else grouped['To Do'].push(task);
      });
      setTasks(grouped);
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProject();
  }, [projectId]);

  const isAdmin = project?.admin_id === user?.id;

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...tasks[source.droppableId]];
    const destCol = [...tasks[destination.droppableId]];
    
    const [movedTask] = sourceCol.splice(source.index, 1);
    
    // Authorization Check for UI dragging (Backend also enforces this)
    // Removed because any member can drag
    // if (!isAdmin && movedTask.assigned_to !== user.id) {
    //   // Revert if unauthorized
    //   return;
    // }

    movedTask.status = destination.droppableId;
    destCol.splice(destination.index, 0, movedTask);

    setTasks(prev => ({
      ...prev,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol
    }));

    try {
      await axios.put(`/tasks/${draggableId}`, { status: destination.droppableId });
    } catch (err) {
      console.error(err);
      fetchTasksAndProject(); // Revert on failure
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', { ...newTask, project_id: projectId });
      setShowCreate(false);
      setNewTask({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '', status: 'To Do' });
      fetchTasksAndProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/tasks/${editingTask._id}`, editingTask);
      setShowEdit(false);
      setEditingTask(null);
      fetchTasksAndProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSprint = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setAiError('');
    try {
      await axios.post('/tasks/ai-sprint', { project_id: projectId, prompt: aiPrompt });
      setAiPrompt('');
      setShowAiModal(false);
      fetchTasksAndProject();
    } catch (err) {
      setAiError(err.response?.data?.error || 'Failed to generate tasks via AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleMarkDone = async (taskId, currentStatus) => {
    // Optimistically update UI
    const sourceCol = [...tasks[currentStatus]];
    const taskIndex = sourceCol.findIndex(t => t._id === taskId);
    if (taskIndex === -1) return;
    
    const [taskToMove] = sourceCol.splice(taskIndex, 1);
    taskToMove.status = 'Done';
    
    const destCol = [...tasks['Done'], taskToMove];
    
    setTasks(prev => ({
      ...prev,
      [currentStatus]: sourceCol,
      'Done': destCol
    }));

    try {
      await axios.put(`/tasks/${taskId}`, { status: 'Done' });
    } catch (err) {
      console.error(err);
      fetchTasksAndProject(); // Revert on failure
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setIsAddingMember(true);
    try {
      await axios.post(`/projects/${projectId}/add-member`, { email: newMemberEmail });
      setNewMemberEmail('');
      fetchTasksAndProject(); // Refresh project details
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.delete(`/projects/${projectId}/remove-member`, { data: { member_id: memberId } });
      fetchTasksAndProject();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColors = {
    'High': 'bg-red-900/40 text-red-400 border-red-500/30',
    'Medium': 'bg-amber-900/40 text-amber-400 border-amber-500/30',
    'Low': 'bg-blue-900/40 text-blue-400 border-blue-500/30'
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-brand-yellow/30 rounded-full"></div>
          <div className="text-slate-400 font-medium">Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 pt-2">
        <div className="flex items-center gap-4">
          <Tooltip content="Go back to projects list">
            <button 
              onClick={() => navigate('/projects')} 
              className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} className="text-slate-300" />
            </button>
          </Tooltip>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-0.5 uppercase tracking-wider">
              <LayoutTemplate size={14} /> Workspace
              {isAdmin ? (
                <span className="bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded text-[10px] ml-2 border border-brand-yellow/20">ADMIN</span>
              ) : (
                <span className="bg-emerald-900/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] ml-2 border border-emerald-500/30">MEMBER</span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{project?.name || 'Workspace'}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Tooltip content="Manage workspace members">
            <button 
              onClick={() => setShowMembers(true)}
              className="bg-slate-800 text-slate-200 font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
            >
              <UserPlus size={16} />
              Team
            </button>
          </Tooltip>
          <Tooltip content="Auto-generate tasks with AI">
            <button 
              onClick={() => setShowAiModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 border border-indigo-400/30 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <Sparkles size={16} className="relative z-10" />
              <span className="relative z-10">Smart Sprint</span>
            </button>
          </Tooltip>
          <Tooltip content="Create a new task manually">
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-brand-yellow text-slate-900 font-extrabold text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Add Task
            </button>
          </Tooltip>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 pb-6">
          <div className="flex flex-col lg:flex-row gap-6 h-full px-2">
            {Object.entries(tasks).map(([status, statusTasks]) => (
              <div key={status} className="flex-1 flex flex-col bg-slate-900/40 rounded-[2rem] border border-white/5 backdrop-blur-md relative overflow-hidden min-w-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-white text-lg tracking-tight">{status}</h3>
                    <span className="bg-slate-800 backdrop-blur-md text-xs font-bold text-slate-400 px-3 py-1 rounded-full border border-slate-700 shadow-sm">
                      {statusTasks.length}
                    </span>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === status ? null : status); }}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === status && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => {
                            setNewTask({ ...newTask, status });
                            setShowCreate(true);
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-700 text-sm font-bold text-slate-200 flex items-center gap-2 transition-colors"
                        >
                          <Plus size={16} />
                          Add Task Here
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-4 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''} transition-colors custom-scrollbar`}
                    >
                      {statusTasks.map((task, index) => {
                        const canDrag = true; // All members can drag
                        return (
                          <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!canDrag}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-slate-800 backdrop-blur-sm p-5 rounded-[1.25rem] border ${snapshot.isDragging ? 'shadow-2xl shadow-black/40 rotate-2 scale-105 border-brand-yellow ring-4 ring-brand-yellow/20 z-50' : 'shadow-sm border-slate-700 hover:border-slate-600 hover:shadow-md'} ${!canDrag && 'opacity-80 cursor-not-allowed'} transition-all group`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${priorityColors[task.priority] || priorityColors['Medium']}`}>
                                    {task.priority}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {!canDrag && <ShieldAlert size={14} className="text-slate-600" title="Locked" />}
                                    <button 
                                      onClick={() => {
                                        setEditingTask(task);
                                        setShowEdit(true);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-900/50 hover:bg-brand-yellow/20 rounded border border-slate-700 hover:border-brand-yellow/50 text-slate-400 hover:text-brand-yellow"
                                      title="Edit Task"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (window.confirm('Are you sure you want to delete this task?')) {
                                          try {
                                            await axios.delete(`/tasks/${task._id}`);
                                            fetchTasksAndProject();
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-900/50 hover:bg-red-500/20 rounded border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-500"
                                      title="Delete Task"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    {canDrag && task.status !== 'Done' && (
                                      <button 
                                        onClick={() => handleMarkDone(task._id, task.status)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-900/50 hover:bg-emerald-500/20 rounded border border-slate-700 hover:border-emerald-500/50 text-emerald-500 hover:text-emerald-400"
                                        title="Mark as Done"
                                      >
                                        <CheckCircle2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h4 className="font-extrabold text-white mb-2 leading-snug text-[15px]">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-slate-400 font-medium line-clamp-2 group-hover:line-clamp-none transition-all duration-300 mb-4 leading-relaxed">{task.description}</p>
                                )}
                                
                                <div className="flex items-center justify-between mt-4 text-xs font-bold text-slate-500 border-t border-slate-700/50 pt-3">
                                  {task.due_date ? (
                                    <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-700">
                                      <Calendar size={14} className="text-slate-400" />
                                      <span>{new Date(task.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                    </div>
                                  ) : <div />}
                                  {task.assignee_details && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-sm" title={task.assignee_details.name}>
                                      {task.assignee_details.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-white">New Task</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Title</label>
                  <input 
                    type="text" required autoFocus
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white placeholder:text-slate-500"
                    placeholder="What needs to be done?"
                    value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white placeholder:text-slate-500 resize-none"
                    placeholder="Add details..."
                    value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Priority</label>
                    <select 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white appearance-none"
                      value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Due Date</label>
                    <input 
                      type="date"
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white"
                      value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Assign To</label>
                  <select 
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white appearance-none"
                    value={newTask.assigned_to} onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {project?.member_details?.map(member => (
                      <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-xl bg-brand-yellow text-slate-900 font-extrabold hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 hover:-translate-y-0.5">
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEdit && editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-white">Edit Task</h3>
              <button onClick={() => {setShowEdit(false); setEditingTask(null);}} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Title</label>
                  <input 
                    type="text" required
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white"
                    value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white resize-none"
                    value={editingTask.description} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Priority</label>
                    <select 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white appearance-none"
                      value={editingTask.priority} onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Status</label>
                    <select 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white appearance-none"
                      value={editingTask.status} onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Due Date</label>
                    <input 
                      type="date"
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white"
                      value={editingTask.due_date || ''} onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Assign To</label>
                    <select 
                      className="w-full px-5 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 outline-none transition-all font-medium text-white appearance-none"
                      value={editingTask.assigned_to || ''} onChange={(e) => setEditingTask({...editingTask, assigned_to: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {project?.member_details?.map(member => (
                        <option key={member._id} value={member._id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => {setShowEdit(false); setEditingTask(null);}} className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-xl bg-brand-yellow text-slate-900 font-extrabold hover:bg-amber-400 transition-all shadow-lg shadow-brand-yellow/10 hover:-translate-y-0.5">
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Team Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-white">Manage Team</h3>
              <button onClick={() => setShowMembers(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            
            {isAdmin && (
              <form onSubmit={handleAddMember} className="mb-8 p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                  <div>
                    <label className="block text-sm font-bold text-slate-300">Workspace Invite Code</label>
                    <p className="text-xs text-slate-500 font-medium">Share this code with your team to let them join instantly.</p>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 rounded-xl border border-indigo-500/30">
                    <span className="font-black tracking-[0.2em] text-indigo-400 text-lg">{project.invite_code || '------'}</span>
                  </div>
                </div>

                <label className="block text-sm font-bold text-slate-300 mb-2">Or invite by email</label>
                <div className="flex gap-3">
                  <input 
                    type="email" required
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10 outline-none transition-all text-sm text-white placeholder:text-slate-500"
                    placeholder="colleague@company.com"
                    value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                  <button type="submit" disabled={isAddingMember} className="bg-brand-yellow text-slate-900 font-bold px-4 py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50">
                    Add
                  </button>
                </div>
                {memberError && <p className="text-red-400 text-xs font-bold mt-2">{memberError}</p>}
              </form>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Current Members</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {project?.member_details?.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm font-bold flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-200 truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    {project.admin_id === member._id ? (
                      <span className="text-[10px] font-bold bg-amber-900/40 text-amber-400 border border-amber-500/30 px-2 py-1 rounded uppercase tracking-wider">Admin</span>
                    ) : (
                      isAdmin && (
                        <button onClick={() => handleRemoveMember(member._id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                          <Trash2 size={16} />
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Smart Sprint Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-8 w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-indigo-500/20 relative overflow-hidden"
          >
            {aiLoading && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[2rem]">
                <div className="w-20 h-20 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <Sparkles size={24} className="text-indigo-400 animate-pulse" />
                </div>
                <p className="mt-6 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider">
                  GENERATING TASKS...
                </p>
                <p className="text-xs text-slate-500 font-bold mt-2">This usually takes about 3 seconds.</p>
              </div>
            )}
            
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Sparkles size={20} className="text-white" />
                  </span>
                  Smart Sprint
                </h3>
                <p className="text-slate-400 font-medium text-sm mt-2">Turn a high-level goal into an actionable Kanban board.</p>
              </div>
              <button onClick={() => setShowAiModal(false)} disabled={aiLoading} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors border border-white/5">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAiSprint} className="relative z-10">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-300 mb-2">Feature or Goal Description</label>
                <textarea 
                  rows={4} required autoFocus disabled={aiLoading}
                  className="w-full px-5 py-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-medium text-white placeholder:text-slate-500 resize-none shadow-inner"
                  placeholder="e.g. Build an authentication system with email/password and Google OAuth, including a forgot password flow."
                  value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                />
                {aiError && <p className="text-red-400 text-xs font-bold mt-3 bg-red-900/20 p-3 rounded-lg border border-red-500/20">{aiError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAiModal(false)} disabled={aiLoading} className="flex-1 px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={aiLoading || !aiPrompt.trim()} className="flex-1 px-4 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  Generate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
