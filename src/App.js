import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Clock, Send, Settings, LogOut, Plus, Trash2, Eye, EyeOff, Check, X, Link as LinkIcon } from 'lucide-react';

const CURRICULUM_TASKS = {
  phase0: {
    label: 'PHASE 0: Ideation',
    deadline: '2026-05-16',
    tasks: [
      { id: 'op-spot', title: 'Opportunity Spotting Lesson', type: 'lesson' },
      { id: 'part-decision', title: 'Partnership Decision', type: 'decision' },
      { id: 'idea-worksheet', title: 'Ideation Worksheet', type: 'deliverable' },
    ]
  },
  phase1: {
    label: 'PHASE 1: Market Discovery',
    deadline: '2026-05-31',
    tasks: [
      { id: 'interviews', title: 'Customer Interviews (5-8)', type: 'research' },
      { id: 'market-gap', title: 'Market Gap Document', type: 'deliverable' },
      { id: 'product-pitches', title: 'Product Pitch Ideas (3-5)', type: 'deliverable' },
    ]
  },
  phase2: {
    label: 'PHASE 2: Business Model',
    deadline: '2026-06-07',
    tasks: [
      { id: 'cost-breakdown', title: 'Cost Breakdown', type: 'worksheet' },
      { id: 'pricing-strategy', title: 'Pricing Strategy', type: 'worksheet' },
      { id: 'revenue-forecast', title: 'Revenue Forecast', type: 'worksheet' },
      { id: 'biz-plan', title: 'Business Plan Submission', type: 'milestone' },
    ]
  },
  phase3: {
    label: 'PHASE 3: Product Development',
    deadline: '2026-06-21',
    tasks: [
      { id: 'prototype', title: 'Prototype & Test (5 batches)', type: 'build' },
      { id: 'feedback-log', title: 'Customer Feedback Log', type: 'deliverable' },
      { id: 'production-ramp', title: 'Production Ramp (50-100 units)', type: 'build' },
    ]
  },
  phase4: {
    label: 'PHASE 4: Launch & Sales',
    deadline: '2026-06-30',
    tasks: [
      { id: 'booth-design', title: 'Booth Design & Signage', type: 'design' },
      { id: 'sales-pitch', title: 'Sales Pitch (30s)', type: 'practice' },
      { id: 'fair-execution', title: 'Craft Fair Execution', type: 'milestone' },
    ]
  }
};

// ============ PARENT ADMIN PANEL ============
function ParentAdminPanel({ config, onConfigChange, onLogout }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [editingTimeline, setEditingTimeline] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [budgetMin, setBudgetMin] = useState(config.budgetMin);
  const [budgetMax, setBudgetMax] = useState(config.budgetMax);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleUpdateBudget = () => {
    onConfigChange({
      ...config,
      budgetMin: parseFloat(budgetMin),
      budgetMax: parseFloat(budgetMax),
    });
  };

  const handleUpdateTimeline = (phase, newDate) => {
    const newTimelines = {
      ...config.timelines,
      [phase]: newDate,
    };
    onConfigChange({
      ...config,
      timelines: newTimelines,
    });
  };

  const handleIntegrationToggle = (service) => {
    onConfigChange({
      ...config,
      integrations: {
        ...config.integrations,
        [service]: !config.integrations[service],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🔧 Parent Configuration
          </h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {['timeline', 'budget', 'integrations', 'children'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'timeline' && '📅 Timeline'}
              {tab === 'budget' && '💰 Budget'}
              {tab === 'integrations' && '🔗 Integrations'}
              {tab === 'children' && '👶 Children'}
            </button>
          ))}
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Adjust Phase Deadlines</h2>
            {Object.entries(CURRICULUM_TASKS).map(([key, phase]) => (
              <div
                key={key}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">{phase.label}</p>
                  <p className="text-slate-400 text-sm">Current: {config.timelines[key]}</p>
                </div>
                <input
                  type="date"
                  defaultValue={config.timelines[key]}
                  onChange={(e) => handleUpdateTimeline(key, e.target.value)}
                  className="px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                />
              </div>
            ))}
            <p className="text-slate-400 text-sm mt-4">Changes apply immediately to kid dashboards</p>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Set Budget Range</h2>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Minimum Budget (startup)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl">$</span>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Maximum Budget (upper limit)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl">$</span>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                    placeholder="500"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateBudget}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                Save Budget Settings
              </button>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-blue-200 text-sm">
              📌 Budget range: ${budgetMin} – ${budgetMax}. Kids must keep spending within this limit.
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Data & AI Integrations</h2>
            <p className="text-slate-400 mb-4">Configure how the platform connects to external services</p>

            <div className="space-y-3">
              {/* Claude API */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Claude API</h3>
                    <p className="text-slate-400 text-sm">Coach Claude coaching & artifact generation</p>
                  </div>
                  <button
                    onClick={() => handleIntegrationToggle('claude')}
                    className={`px-4 py-2 rounded transition ${
                      config.integrations.claude
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    {config.integrations.claude ? '✓ Active' : 'Off'}
                  </button>
                </div>
                {config.integrations.claude && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-sm text-slate-300">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="sk-ant-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded"
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Drive */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Google Drive</h3>
                    <p className="text-slate-400 text-sm">Store artifacts & shared documents</p>
                  </div>
                  <button
                    onClick={() => handleIntegrationToggle('googleDrive')}
                    className={`px-4 py-2 rounded transition ${
                      config.integrations.googleDrive
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    {config.integrations.googleDrive ? '✓ Active' : 'Off'}
                  </button>
                </div>
              </div>

              {/* N8N */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">N8N Automation</h3>
                    <p className="text-slate-400 text-sm">Workflow automation & approvals</p>
                  </div>
                  <button
                    onClick={() => handleIntegrationToggle('n8n')}
                    className={`px-4 py-2 rounded transition ${
                      config.integrations.n8n
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    {config.integrations.n8n ? '✓ Active' : 'Off'}
                  </button>
                </div>
                {config.integrations.n8n && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-sm text-slate-300">Webhook URL</label>
                    <input
                      type="text"
                      placeholder="https://your-n8n.cloud/webhook/..."
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Obsidian */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Obsidian Sync</h3>
                    <p className="text-slate-400 text-sm">Export & edit notes in Obsidian vault</p>
                  </div>
                  <button
                    onClick={() => handleIntegrationToggle('obsidian')}
                    className={`px-4 py-2 rounded transition ${
                      config.integrations.obsidian
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    {config.integrations.obsidian ? '✓ Active' : 'Off'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-amber-200 text-sm mt-4">
              🔐 API keys are stored securely. Never share your keys with others.
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Manage Children</h2>
            <div className="space-y-3">
              {config.children.map((child) => (
                <div key={child.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">{child.name}</p>
                    <p className="text-slate-400 text-sm">Dashboard: {child.coachName}'s coaching</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Plus size={18} /> Add Another Child
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ KID DASHBOARD ============
function KidDashboard({ child, onLogout }) {
  const [tasks, setTasks] = useState({});
  const [activePhase, setActivePhase] = useState('phase0');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `👋 Hi ${child.name}! I'm ${child.coachName}, your business coach. Ask me anything about your product, pricing, customers, or how to solve any problem. What are you working on today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initialTasks = {};
    Object.entries(CURRICULUM_TASKS).forEach(([phase, data]) => {
      initialTasks[phase] = {
        todo: data.tasks.slice(0, 2),
        inprogress: data.tasks.length > 2 ? data.tasks.slice(2, 3) : [],
        done: [],
      };
    });
    setTasks(initialTasks);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDragStart = (e, taskId, phase) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('phase', phase);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourcePhase = e.dataTransfer.getData('phase');

    setTasks((prev) => {
      const newTasks = { ...prev };
      const sourceStatuses = Object.keys(newTasks[sourcePhase]);
      let sourceStatus = null;
      let taskIndex = -1;

      for (const status of sourceStatuses) {
        const idx = newTasks[sourcePhase][status].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          sourceStatus = status;
          taskIndex = idx;
          break;
        }
      }

      if (sourceStatus && taskIndex !== -1) {
        const task = newTasks[sourcePhase][sourceStatus].splice(taskIndex, 1)[0];
        newTasks[sourcePhase][targetStatus].push(task);
      }

      return newTasks;
    });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const responses = {
        cost: `Great question! Let's break it down:\n\n1. **Materials cost**: What raw materials?\n2. **Packaging**: How will you package it?\n3. **Labor**: Time per unit?\n\nOnce you tell me your product, I can help calculate. 📊`,
        price: `Smart pricing question!\n\n**Formula**: (Cost ÷ 0.40) = Selling Price\n\nIf cost is $5: ($5 ÷ 0.40) = $12.50\nThat gives you $7.50 profit per unit.\n\nBeat competitor prices? 💰`,
        help: `I can help with:\n• Cost & pricing\n• Writing your business plan\n• Customer feedback\n• Brainstorming ideas\n• Craft fair prep\n\nWhat do you need? 🚀`,
        default: `Great question! Let me help you think this through:\n\n1. What exactly are you trying to figure out?\n2. What do you already know?\n3. What's blocking you?\n\nShare more and I'll guide you! 💪`,
      };

      const response = input.toLowerCase().includes('cost')
        ? responses.cost
        : input.toLowerCase().includes('price')
        ? responses.price
        : input.toLowerCase().includes('help')
        ? responses.help
        : responses.default;

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 600);
  };

  const currentPhaseData = CURRICULUM_TASKS[activePhase];
  const phaseTasksState = tasks[activePhase] || { todo: [], inprogress: [], done: [] };

  const todoTasks = phaseTasksState.todo.map((t) => ({ ...t, phase: activePhase }));
  const inProgressTasks = phaseTasksState.inprogress.map((t) => ({ ...t, phase: activePhase }));
  const doneTasks = phaseTasksState.done.map((t) => ({ ...t, phase: activePhase }));

  const totalTasks = Object.values(CURRICULUM_TASKS).reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = Object.values(tasks).reduce((sum, phase) => sum + (phase.done?.length || 0), 0);
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const typeIcons = {
    lesson: '📚',
    decision: '🎯',
    deliverable: '📦',
    research: '🔍',
    worksheet: '📊',
    milestone: '🚀',
    build: '🛠️',
    design: '🎨',
    practice: '🎤',
  };

  const typeColors = {
    lesson: 'bg-blue-100 border-blue-300',
    decision: 'bg-purple-100 border-purple-300',
    deliverable: 'bg-orange-100 border-orange-300',
    research: 'bg-green-100 border-green-300',
    worksheet: 'bg-yellow-100 border-yellow-300',
    milestone: 'bg-red-100 border-red-300',
    build: 'bg-indigo-100 border-indigo-300',
    design: 'bg-teal-100 border-teal-300',
    practice: 'bg-cyan-100 border-cyan-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🚀 {child.name}'s Business Sprint</h1>
            <p className="text-blue-100 mt-1">Coach: {child.coachName}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
          >
            Switch User
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border-t-4 border-blue-600 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-bold text-gray-800">Progress to Launch</p>
              <p className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks completed</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${progressPercent >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                {progressPercent >= 50 ? '✓ On Track' : '⚠ Review'}
              </p>
              <p className="text-xs text-gray-500">49 days to fair</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className={`${progressPercent >= 50 ? 'bg-green-500' : 'bg-yellow-500'} h-full transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            >
              {progressPercent > 10 && <span className="text-white font-bold text-xs">{Math.round(progressPercent)}%</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Phase Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(CURRICULUM_TASKS).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setActivePhase(key)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activePhase === key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-blue-400'
              }`}
            >
              {data.label}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4">
          {['📋 To Do', '⚙️ In Progress', '✅ Done'].map((colTitle, idx) => {
            const status = ['todo', 'inprogress', 'done'][idx];
            const columnTasks = [todoTasks, inProgressTasks, doneTasks][idx];

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="flex-1 bg-gray-50 rounded-lg p-4 min-h-96 border-2 border-gray-200"
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-300">
                  <h3 className="font-bold text-lg text-gray-800">{colTitle}</h3>
                  <span className="bg-gray-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, task.phase)}
                      className={`${typeColors[task.type]} border-2 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{typeIcons[task.type]}</span>
                        <p className="font-semibold text-sm text-gray-800">{task.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat */}
        <div className="flex flex-col h-96 bg-white rounded-lg border-2 border-blue-200 overflow-hidden shadow-lg">
          <div className="bg-blue-600 text-white px-4 py-3 font-bold flex items-center gap-2">
            <MessageCircle size={20} />
            Ask {child.coachName}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 rounded-bl-none">
                  <p className="text-sm">⏳ {child.coachName} is thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t-2 border-gray-200 bg-white p-3 flex gap-2">
            <input
              type="text"
              placeholder={`Ask ${child.coachName} anything...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
              className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function EntrepreneurPlatform() {
  const [currentUser, setCurrentUser] = useState(null);
  const [coachName, setCoachName] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);

  const [config, setConfig] = useState({
    budgetMin: 50,
    budgetMax: 500,
    timelines: {
      phase0: '2026-05-16',
      phase1: '2026-05-31',
      phase2: '2026-06-07',
      phase3: '2026-06-21',
      phase4: '2026-06-30',
    },
    children: [
      { id: 'calvin', name: 'Calvin', coachName: 'Claude', age: 14 },
      { id: 'chase', name: 'Chase', coachName: 'Claude', age: 10 },
    ],
    integrations: {
      claude: true,
      googleDrive: true,
      n8n: false,
      obsidian: false,
    },
  });

  // Coach Name Selection Screen
  if (currentUser && !selectedChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {currentUser.name}! 👋</h1>
          <p className="text-gray-600 mb-6">Let's name your coach. Who will be your business mentor?</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Coach Name</label>
              <input
                type="text"
                placeholder="e.g., Coach Claude, Alex, Sage..."
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">This is who you'll ask questions to in the chat</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              💡 Popular choices: Claude, Alex, Sage, Coach Mike, Alex the Advisor
            </div>

            <button
              onClick={() => {
                if (coachName.trim()) {
                  const updated = {
                    ...config,
                    children: config.children.map((c) =>
                      c.id === currentUser.id ? { ...c, coachName } : c
                    ),
                  };
                  setConfig(updated);
                  setSelectedChild({ ...currentUser, coachName });
                }
              }}
              disabled={!coachName.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              Continue to Dashboard
            </button>

            <button
              onClick={() => setCurrentUser(null)}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kid Dashboard
  if (selectedChild) {
    return (
      <KidDashboard
        child={selectedChild}
        onLogout={() => {
          setSelectedChild(null);
          setCurrentUser(null);
          setCoachName('');
        }}
      />
    );
  }

  // Login Screen
  if (currentUser === 'parent') {
    return (
      <ParentAdminPanel
        config={config}
        onConfigChange={setConfig}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // Main Login
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">🚀 Youth Entrepreneur</h1>
        <p className="text-center text-gray-600 mb-8">Build a business this summer</p>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentUser('parent')}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition shadow-lg"
          >
            🔧 Parent Admin
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Kid Dashboard</p>
            {config.children.map((child) => (
              <button
                key={child.id}
                onClick={() => setCurrentUser(child)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                {child.name} (Age {child.age})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <p className="font-semibold mb-2">🎯 This is a demo of:</p>
          <ul className="space-y-1">
            <li>✓ Kanban task tracking</li>
            <li>✓ Custom coach naming</li>
            <li>✓ Parent configuration</li>
            <li>✓ Timeline & budget setup</li>
            <li>✓ AI integration options</li>
          </ul>
        </div>
      </div>
    </div>
  );
}