import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  Briefcase, MessageCircle, Send, LogOut, Plus, Trash2,
  Eye, EyeOff, Calendar, DollarSign,
  Sparkles, GripVertical, Search, Target, Wrench, Palette,
  Mic, Package, BookOpen, BarChart3, Flag, ChevronRight,
  X, CheckCircle2, Link as LinkIcon, Settings, ArrowLeft, Printer, Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isConfigured } from '../lib/supabase';

// ============ CURRICULUM DATA ============
const CURRICULUM_TASKS = {
  phase0: {
    label: 'Ideation', short: 'Phase 0', deadline: '2026-05-16',
    accent: 'bg-amber-100 text-amber-800 ring-amber-200',
    tasks: [
      { id: 'op-spot',        title: 'Opportunity Spotting',      type: 'lesson' },
      { id: 'part-decision',  title: 'Partnership Decision',      type: 'decision' },
      { id: 'idea-worksheet', title: 'Ideation Worksheet',        type: 'deliverable' },
    ],
  },
  phase1: {
    label: 'Market Discovery', short: 'Phase 1', deadline: '2026-05-31',
    accent: 'bg-sky-100 text-sky-800 ring-sky-200',
    tasks: [
      { id: 'interviews',      title: 'Customer Interviews (5–8)', type: 'research' },
      { id: 'market-gap',      title: 'Market Gap Document',       type: 'deliverable' },
      { id: 'product-pitches', title: 'Product Pitch Ideas (3–5)', type: 'deliverable' },
    ],
  },
  phase2: {
    label: 'Business Model', short: 'Phase 2', deadline: '2026-06-07',
    accent: 'bg-violet-100 text-violet-800 ring-violet-200',
    tasks: [
      { id: 'cost-breakdown',   title: 'Cost Breakdown',           type: 'worksheet' },
      { id: 'pricing-strategy', title: 'Pricing Strategy',         type: 'worksheet' },
      { id: 'revenue-forecast', title: 'Revenue Forecast',         type: 'worksheet' },
      { id: 'biz-plan',         title: 'Business Plan Submission', type: 'milestone' },
    ],
  },
  phase3: {
    label: 'Product Development', short: 'Phase 3', deadline: '2026-06-21',
    accent: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    tasks: [
      { id: 'prototype',       title: 'Prototype & Test (5 batches)',   type: 'build' },
      { id: 'feedback-log',    title: 'Customer Feedback Log',          type: 'deliverable' },
      { id: 'production-ramp', title: 'Production Ramp (50–100 units)', type: 'build' },
    ],
  },
  phase4: {
    label: 'Launch & Sales', short: 'Phase 4', deadline: '2026-06-30',
    accent: 'bg-rose-100 text-rose-800 ring-rose-200',
    tasks: [
      { id: 'booth-design',   title: 'Booth Design & Signage', type: 'design' },
      { id: 'sales-pitch',    title: 'Sales Pitch (30 sec)',   type: 'practice' },
      { id: 'fair-execution', title: 'Craft Fair Execution',   type: 'milestone' },
    ],
  },
};

const TYPE_META = {
  lesson:      { Icon: BookOpen,  tint: 'bg-blue-50 text-blue-700 ring-blue-100' },
  decision:    { Icon: Target,    tint: 'bg-purple-50 text-purple-700 ring-purple-100' },
  deliverable: { Icon: Package,   tint: 'bg-orange-50 text-orange-700 ring-orange-100' },
  research:    { Icon: Search,    tint: 'bg-green-50 text-green-700 ring-green-100' },
  worksheet:   { Icon: BarChart3, tint: 'bg-amber-50 text-amber-700 ring-amber-100' },
  milestone:   { Icon: Flag,      tint: 'bg-rose-50 text-rose-700 ring-rose-100' },
  build:       { Icon: Wrench,    tint: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  design:      { Icon: Palette,   tint: 'bg-teal-50 text-teal-700 ring-teal-100' },
  practice:    { Icon: Mic,       tint: 'bg-cyan-50 text-cyan-700 ring-cyan-100' },
};

const TASK_MODULES = {
  'op-spot': { headline: 'Spot your opportunity', intro: `Businesses come from all kinds of opportunities — an upcoming craft fair, a skill you love, a problem worth solving. Let's find yours.`, coachOpener: `Hey! Let's find your big idea.\n\nFirst question: do you already have an idea in mind — even a half-formed one — or are you starting from scratch?\n\n(An upcoming craft fair, a hobby you love, or something that bugs you all count as a starting point!)`, guidePrompts: [`Great! Tell me more. What would you sell or do, and who would want it?`, `What's the opportunity here? Is it a specific event like a craft fair, a skill or hobby you have, a problem you've noticed — or something else?`, `Who is your customer? Describe the person most likely to pay for this.`, `Name 2 or 3 different products or services you could offer. Even wild ideas are welcome — we'll narrow it down next.`, `Which of those ideas excites you most? Pick one and tell me why — your energy will show up in the booth.`], doneMessage: `You've spotted a real opportunity! These answers are the foundation of everything we build next. Ready to mark this done?` },
  'part-decision': { headline: 'Solo or team?', intro: `Working with a partner means more skills — but also means splitting everything. Let's figure out the right call.`, coachOpener: `Big decision ahead! Are you thinking about starting this business solo, or do you have someone in mind as a partner?\n\nTell me what you're leaning toward — and why.`, guidePrompts: [`If you're considering a partner, who is it? What skill do they bring that you don't have?`, `What happens if you two disagree on something important — like pricing, or the product?`, `How would you split the work? And how would you split the money?`, `Flip it around: what's the biggest advantage of going solo? What's the biggest risk?`, `Decision made? Write one sentence: "I will [solo/partner] because ___."` ], doneMessage: `Solid thinking! Partnership decisions are hard — you thought it through carefully. Mark it done when you're ready.` },
  'idea-worksheet': { headline: 'Lock in your idea', intro: `Time to put your concept on paper. Answer these questions and you'll have your official business idea.`, coachOpener: `Time to write your official business concept! We'll make sure it covers all five pieces: what you're selling, who your customer is, the problem you solve, who your competition is, and your business name.\n\nYou've been thinking about this — describe your business in 1–2 sentences so we can start sharpening it.`, guidePrompts: [`Good start! Who is your customer — describe the specific person most likely to buy from you.`, `What problem does your product solve for them? Why would they pay money for it?`, `Who else sells something similar? Name a competitor and one thing you'll do better.`, `What's your product actually made of, or how does your service work step-by-step?`, `Give your business a name. Doesn't have to be final — just something you like for now.`], doneMessage: `Your idea is documented! Product, customer, problem, competitor, name. That's a real business concept. Mark it done?` },
  'interviews': { headline: 'Talk to real customers', intro: `Your opinions don't matter — your customers' do. Let's plan and run 5–8 real interviews.`, parentHelp: 'You may need a parent to drive you to interview locations, or to help reach store owners or community contacts.', coachOpener: `This is the step most young entrepreneurs skip — and the ones who do it always build better products.\n\nWho are you going to interview? Name 3 people you could talk to this week who might be your customer.`, guidePrompts: [`Great list. Write your first question. No leading questions! Instead of "is this a good idea?" try "tell me about the last time you had [problem]."`, `Write 2 more open-ended questions. Goal: get them talking, not just saying yes/no.`, `After your first interview, what's one surprising thing you heard?`, `Did anyone say they'd actually pay for a solution? What did they say, exactly?`, `What's the biggest pattern across all your interviews?`], doneMessage: `Real-world research done! Mark complete once you've finished at least 5 interviews.` },
  'market-gap': { headline: 'Find the gap', intro: `A market gap is the space between what customers want and what currently exists. Let's find yours.`, coachOpener: `Based on your interviews, there's something people want that they can't easily get. That's your market gap.\n\nWhat did customers say they wished existed, or hated about current options?`, guidePrompts: [`Search for 2–3 existing products. What do customers complain about in the reviews?`, `What's missing from those options? What would make customers switch?`, `Write one sentence: "Customers need ___ but can only get ___, which falls short because ___."`, `How many people do you think have this problem? Rough estimate is fine.`, `Is this a one-time problem or recurring? Does that change how you'd sell?`], doneMessage: `You've identified a real market gap. Mark done when your document is written up.` },
  'product-pitches': { headline: 'Pitch 3–5 product ideas', intro: `You've found a gap. Now explore multiple ways to fill it before committing to one.`, coachOpener: `Before you lock in one product, let's look at options. Multiple ideas make your final pick stronger.\n\nPitch your first idea in 2–3 sentences: what it is, who it's for, and why someone would buy it.`, guidePrompts: [`Now a second idea — something genuinely different. Simpler, more premium, or completely different format.`, `One more! A third option that's different from both others.`, `Look at all 3 side by side. Which is easiest to make? Which could make the most money?`, `Which fits your $50–$500 budget? Which do you care about most personally?`, `Pick your winner and tell me why. What makes it the right choice?`], doneMessage: `You compared multiple ideas before choosing — that's what good entrepreneurs do. Mark done once all pitches are documented.` },
  'cost-breakdown': { headline: 'Know your numbers', intro: `Before pricing anything, you need to know exactly what it costs to make one unit.`, parentHelp: 'Ask a parent to help you look up material prices online and purchase your first batch of supplies.', coachOpener: `Money time! To price your product, you need your cost per unit — every dollar that goes into making one item.\n\nWhat materials do you need? List them all, even small stuff like bags or tape.`, guidePrompts: [`For each material: what's the batch cost, and how many units per batch? Let's calculate cost-per-unit.`, `Any tools or equipment to buy? How many units will you make before they wear out?`, `How long to make one unit? At $5–$10/hour labor, what's the labor cost per unit?`, `What does packaging cost per unit — bags, boxes, labels, ribbon?`, `Add it all up: materials + tools (spread out) + labor + packaging. What's your total cost per unit?`], doneMessage: `You know your real cost per unit. This number drives every pricing decision. Mark done when your breakdown is complete.` },
  'pricing-strategy': { headline: 'Set the right price', intro: `Too low and you lose money. Too high and nobody buys. Let's find the sweet spot.`, coachOpener: `You know your cost — now let's figure out what to charge.\n\nFirst: what are similar products selling for at craft fairs or on Etsy? Quick research — give me a price range.`, guidePrompts: [`Formula: Selling Price = Cost ÷ 0.40. Try it with your numbers — what price does that give?`, `How does that compare to competitors? Higher, lower, or about the same?`, `Would your target customer pay that? What did your interviewees say about price?`, `What could you do to feel worth the price — better packaging, a story, handwritten tag?`, `Final price? And profit per unit (selling price minus cost)?`], doneMessage: `You have a price and a profit margin. Mark done when your pricing strategy is documented.` },
  'revenue-forecast': { headline: 'Project your sales', intro: `How much money could you actually make? Let's build a simple forecast.`, coachOpener: `Fun math time — how much could this business make?\n\nHow many units could you realistically sell at the craft fair? Give me a low guess and a high guess.`, guidePrompts: [`At your price per unit, what would you make in the low vs high scenario?`, `What's your total startup cost — materials for first batch plus supplies?`, `At what number of units sold do you break even?`, `If you hit your high estimate, how much profit do you take home?`, `What would you do with the profit? Having a goal makes selling feel real.`], doneMessage: `You've built a real revenue model. Mark done when your forecast is written up.` },
  'biz-plan': { headline: 'Write your business plan', intro: `Your plan pulls everything together. It's your roadmap — and your pitch to any future investor.`, coachOpener: `This is a milestone — you're about to write your first real business plan!\n\nIt doesn't need to be long. Let's build it section by section.\n\nStart with your Business Summary: one short paragraph explaining what you sell, who you sell it to, and why they need it.`, guidePrompts: [`Next: The Problem & Solution. One paragraph each.`, `Your Market: who is your customer, how many exist, who are your competitors?`, `Business Model: cost per unit, selling price, break-even number.`, `Operations: how you make it, batch time, week-before-fair plan.`, `Goals: what does success look like for you at the craft fair?`], doneMessage: `Your business plan is done. Submit it to your parent/coach and mark this complete.` },
  'prototype': { headline: 'Build and test', intro: `Your first batch won't be perfect — and that's the point. Build 5 test batches and improve each time.`, coachOpener: `Time to make your product! The goal of a prototype is to learn what to fix.\n\nDescribe Batch 1: what you're making, how many, and one thing you want to test.`, guidePrompts: [`After Batch 1: what worked? What looked, tasted, or felt wrong?`, `What specific change for Batch 2? "Less sugar," "thinner straps," "smaller size."`, `After Batch 3, show it to someone who didn't help make it. What did they say?`, `What's the most important improvement across all 5 batches?`, `Is your final version something you'd proudly sell to a stranger? If not, what's the one last fix?`], doneMessage: `5 test batches done! Mark complete once you've finished all 5 rounds and have a version you're proud of.` },
  'feedback-log': { headline: 'Collect customer feedback', intro: `Real feedback from real people will make your product better. Track every comment.`, coachOpener: `Feedback is gold. Goal: at least 10 reactions from people who aren't your family.\n\nWho's the first non-family person you showed your product to? What did they say?`, guidePrompts: [`What was the most common positive comment?`, `What was the most common negative comment or concern?`, `Did anyone say they'd actually buy it? What did they say?`, `Did you change anything based on feedback? What, and why?`, `After all feedback, what's the one thing you're most proud of?`], doneMessage: `Feedback log complete. Mark done when you've documented at least 10 responses.` },
  'production-ramp': { headline: 'Make your inventory', intro: `Time to produce 50–100 units for the fair. Plan the full production run.`, parentHelp: 'You will likely need a parent to purchase bulk supplies and possibly help with larger production runs.', coachOpener: `Production time! You need 50–100 units ready before the fair.\n\nHow many can you realistically make in one session? How long is each session?`, guidePrompts: [`With that cadence, when do you finish? Work backwards from the fair date — do you have a cushion?`, `Do you have enough materials? Calculate: cost per unit × number of units. Does it fit the budget?`, `What's the biggest thing that could slow you down? How will you prevent it?`, `How will you track unit count — tally marks, spreadsheet, sticky note?`, `At 50 units, do a quality check. Pick 5 at random — do they all meet your standard?`], doneMessage: `Inventory built! Mark done once you've hit your unit goal.` },
  'booth-design': { headline: 'Design your booth', intro: `Your booth is your store. It needs to stop people walking by in 2 seconds.`, coachOpener: `Your booth is the first thing customers see. Before they talk to you or touch your product, they decide in about 2 seconds whether to stop.\n\nDescribe your dream booth — color, layout, signage, display.`, guidePrompts: [`What will your sign say? Show business name AND what you sell.`, `How will you display your product so customers can see it and pick it up easily?`, `What tablecloth, risers, or display items? Does the look match your brand?`, `How will you show the price? Big and clear, or small tags?`, `Walk me through setup step-by-step — from arrival to ready for customers.`], doneMessage: `Booth plan done! Practice setup at least once before the fair. Mark done when design and materials are ready.` },
  'sales-pitch': { headline: 'Perfect your 30-second pitch', intro: `When someone stops at your booth, you have about 30 seconds. Make them count.`, coachOpener: `Selling is a skill — and like any skill, it gets better with practice.\n\nWrite out your first 30-second pitch. Pretend I just walked up and said "what's this?" — what do you say?`, guidePrompts: [`Does your pitch cover: (1) what it is, (2) what makes it special, (3) the price?`, `Try this structure: "This is [product]. It's made with [thing]. Most people use it for [use]. It's $[price]." How does yours compare?`, `What's the hardest objection — "too expensive" or "don't need it"? How would you respond?`, `Practice out loud 5 times. What felt awkward or hard to say?`, `Say your pitch to someone who'll be honest. What did they say?`], doneMessage: `Pitch ready! Mark done once you've practiced at least 10 times and feel confident.` },
  'fair-execution': { headline: 'Craft Fair Day', intro: `This is what all five phases have been building toward.`, parentHelp: 'You will need a parent to help transport your booth, inventory, and supplies to the event — and ideally to be there on the day.', coachOpener: `Fair day is almost here!\n\nFinal readiness check: (1) all inventory, (2) payment method, (3) booth supplies, (4) sign. What's the status of each?`, guidePrompts: [`What time do you arrive to set up? How are you getting there with all your stuff?`, `Who's helping at the booth? What's their job?`, `What's your goal for the day — units sold, profit amount, or something else?`, `After the fair: write down everything — units sold, what people said, what you'd do differently.`, `How do you feel? Whatever the result — you built a real business. That makes you an entrepreneur.`], doneMessage: `You did it. Whatever the result, completing this program puts you in a very small group of kids who actually built and sold something real. Mark done and celebrate!` },
};

// ============ SHARED COMPONENTS ============
function Logo({ size = 'md' }) {
  const s = { sm: { box: 'w-8 h-8', icon: 16, text: 'text-base' }, md: { box: 'w-10 h-10', icon: 20, text: 'text-xl' }, lg: { box: 'w-12 h-12', icon: 24, text: 'text-2xl' } }[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm`}><Briefcase size={s.icon} className="text-white" strokeWidth={2.5} /></div>
      <p className={`${s.text} font-extrabold tracking-tight text-slate-900`}>Kidz<span className="text-brand-600">Biz</span></p>
    </div>
  );
}
function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>;
}
function Avatar({ name }) {
  return <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">{(name || '?').charAt(0).toUpperCase()}</div>;
}

// ============ DATA HELPERS ============
function buildInitialTasks() {
  const t = {};
  Object.entries(CURRICULUM_TASKS).forEach(([phase, data]) => {
    t[phase] = { todo: [...data.tasks], inprogress: [], done: [] };
  });
  return t;
}

function applyTaskStates(baseTaskState, dbRows) {
  const result = buildInitialTasks();
  // Remove all tasks from their default positions first
  Object.keys(result).forEach((phase) => {
    result[phase] = { todo: [], inprogress: [], done: [] };
  });
  // Re-add each task in the status from the DB
  dbRows.forEach((row) => {
    const phaseData = CURRICULUM_TASKS[row.phase_key];
    if (!phaseData) return;
    const task = phaseData.tasks.find((t) => t.id === row.task_id);
    if (task) result[row.phase_key][row.status].push(task);
  });
  // Any tasks not in DB get put back as 'todo'
  Object.entries(CURRICULUM_TASKS).forEach(([phase, data]) => {
    data.tasks.forEach((task) => {
      const inAny = ['todo', 'inprogress', 'done'].some((s) => result[phase][s].some((t) => t.id === task.id));
      if (!inAny) result[phase].todo.push(task);
    });
  });
  return result;
}

async function persistTaskStatus(businessId, familyId, taskId, phaseKey, status) {
  if (!isConfigured || !supabase) return;
  await supabase.from('task_states').upsert(
    { business_id: businessId, family_id: familyId, task_id: taskId, phase_key: phaseKey, status, updated_at: new Date().toISOString() },
    { onConflict: 'business_id,task_id' }
  );
}

const DEFAULT_COACH_CONFIG = { seedIdeas: '', offLimitsTopics: 'adult content, violence, politics, anything inappropriate for kids', safeMode: true, parentApprovals: { purchases: true, transportation: true }, amazonLinks: false };
function getCoachConfig(familyId) {
  try { return { ...DEFAULT_COACH_CONFIG, ...JSON.parse(localStorage.getItem(`kb_coach_${familyId}`) || 'null') }; } catch { return DEFAULT_COACH_CONFIG; }
}
function saveCoachConfig(familyId, cfg) { localStorage.setItem(`kb_coach_${familyId}`, JSON.stringify(cfg)); }

function getChatHistory(businessId, taskId) {
  try { return JSON.parse(localStorage.getItem(`kb_chat_${businessId}_${taskId}`) || 'null'); } catch { return null; }
}
function saveChatHistory(businessId, taskId, messages) {
  localStorage.setItem(`kb_chat_${businessId}_${taskId}`, JSON.stringify(messages));
}
function getPriorTaskContext(businessId, currentTaskId, maxTasks = 3, maxChars = 1200) {
  const allTasks = Object.values(CURRICULUM_TASKS).flatMap((p) => p.tasks);
  // Collect tasks that have real conversation, with their last-message timestamp
  const candidates = [];
  for (const t of allTasks) {
    if (t.id === currentTaskId) continue;
    const history = getChatHistory(businessId, t.id);
    if (!history) continue;
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const lastAsst = [...history].reverse().find((m) => m.role === 'assistant');
    if (lastUser && lastAsst) {
      const lastId = Math.max(...history.map((m) => m.id || 0));
      candidates.push({ title: t.title, lastId, lastUser: lastUser.content, lastAsst: lastAsst.content });
    }
  }
  // Use the N most recently active tasks (highest message id = most recent)
  const recent = candidates.sort((a, b) => b.lastId - a.lastId).slice(0, maxTasks);
  const joined = recent
    .map((c) => `[${c.title}]\nKid: ${c.lastUser.slice(0, 250)}\nCoach: ${c.lastAsst.slice(0, 250)}`)
    .join('\n\n');
  return joined.slice(0, maxChars);
}

function getNotifications(familyId) {
  try { return JSON.parse(localStorage.getItem(`kb_notifications_${familyId}`) || '[]'); } catch { return []; }
}
function addNotification(familyId, notif) {
  const updated = [...getNotifications(familyId), { id: crypto.randomUUID(), created_at: new Date().toISOString(), status: 'pending', ...notif }];
  localStorage.setItem(`kb_notifications_${familyId}`, JSON.stringify(updated));
}
function updateNotificationStatus(familyId, id, status) {
  const updated = getNotifications(familyId).map((n) => n.id === id ? { ...n, status } : n);
  localStorage.setItem(`kb_notifications_${familyId}`, JSON.stringify(updated));
}

// ============ TASK MODULE MODAL ============
function TaskModule({ task, phaseKey, child, businessId, familyId, onClose, onMarkDone }) {
  const mod = TASK_MODULES[task.id];
  const phase = CURRICULUM_TASKS[phaseKey];
  const meta = TYPE_META[task.type] || TYPE_META.deliverable;
  const Icon = meta.Icon;
  const coachCfg = getCoachConfig(familyId);
  const isMathTask = ['cost-breakdown', 'pricing-strategy', 'revenue-forecast'].includes(task.id);
  const isYoungKid = child.age && child.age <= 11;
  // Build prior context snapshot (synchronous — reads localStorage)
  const priorCtx = getPriorTaskContext(businessId, task.id);

  const freshMsgs = [];
  // If prior work exists and this isn't the first task, open with an acknowledgment
  if (priorCtx && task.id !== 'op-spot') {
    freshMsgs.push({ id: 0, role: 'assistant', content: `I've been keeping track of your work so far — I'll use that context as we go so we're building forward, not starting over.` });
  }
  freshMsgs.push({ id: 1, role: 'assistant', content: mod ? mod.coachOpener : `Let's work on "${task.title}"! Tell me where you're at with this step.` });
  if (task.id === 'op-spot' && coachCfg.seedIdeas) {
    freshMsgs.push({ id: 2, role: 'assistant', content: `Also, your parent shared some ideas they thought might work well for you:\n\n"${coachCfg.seedIdeas}"\n\nFeel free to use one of those as a starting point — or go with something totally different!` });
  }

  // Restore saved conversation for this task, or start fresh
  const savedHistory = getChatHistory(businessId, task.id);
  const hasUserMsg = savedHistory?.some((m) => m.role === 'user');
  const [messages, setMessages] = useState(hasUserMsg ? savedHistory : freshMsgs);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [showDone, setShowDone]   = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Persist chat after every exchange
  useEffect(() => { saveChatHistory(businessId, task.id, messages); }, [messages, businessId, task.id]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => { setInput((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const handlePrint = () => {
    const lines = messages.map((msg) => {
      const label = msg.role === 'assistant' ? (child.coachName || 'Coach') : child.name;
      return `<div style="margin:12px 0"><strong style="color:#4F46E5">${label}:</strong><br>${msg.content.replace(/\n/g, '<br>')}</div>`;
    }).join('');
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${task.title} — ${child.name}</title><style>body{font-family:sans-serif;max-width:620px;margin:40px auto;font-size:14px;line-height:1.6;color:#1e293b}h2{color:#1e293b}em{color:#64748b}hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0}</style></head><body><h2>${task.title}</h2><em>${mod?.intro || ''}</em><hr>${lines}</body></html>`);
    w.document.close();
    w.print();
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const guidePrompts = mod?.guidePrompts || [];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Try real Claude API via Edge Function; fall back to scripted prompts
    let reply = null;
    if (isConfigured && supabase) {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (authSession) {
          const res = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-chat`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authSession.access_token}`,
              },
              body: JSON.stringify({
                messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
                childName: child.name,
                childAge: child.age,
                coachName: child.coachName,
                taskTitle: task.title,
                taskIntro: mod?.intro,
                offLimitsTopics: coachCfg.offLimitsTopics,
                seedIdeas: task.id === 'op-spot' ? coachCfg.seedIdeas : '',
                priorContext: getPriorTaskContext(businessId, task.id),
              }),
            }
          );
          const json = await res.json();
          if (json.reply) reply = json.reply;
        }
      } catch (_) {
        // fall through to scripted responses
      }
    }

    // Scripted fallback (demo mode or API error)
    if (!reply) {
      if (promptIndex < guidePrompts.length) {
        const isLast = promptIndex === guidePrompts.length - 1;
        reply = guidePrompts[promptIndex] + (isLast && mod?.doneMessage ? `\n\n---\n\n${mod.doneMessage}` : '');
        setPromptIndex((i) => i + 1);
        if (isLast) setTimeout(() => setShowDone(true), 800);
      } else {
        reply = `Great answer! Keep going — you're doing the real work here. What else is on your mind?`;
      }
    } else {
      // With real AI, show Mark Done after 5 exchanges
      if (nextMessages.filter((m) => m.role === 'user').length >= 5) {
        setTimeout(() => setShowDone(true), 800);
      }
    }

    setTimeout(() => {
      setMessages((p) => [...p, { id: Date.now() + 1, role: 'assistant', content: reply }]);
      setLoading(false);
    }, reply === null ? 0 : 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-9 h-9 rounded-xl ring-1 ring-inset flex items-center justify-center ${meta.tint}`}><Icon size={18} /></div>
            <div>
              <div className="flex items-center gap-2 mb-0.5"><Badge className={phase.accent}>{phase.short}</Badge></div>
              <h2 className="font-bold text-slate-900 leading-tight">{task.title}</h2>
              {mod && <p className="text-xs text-slate-500 mt-0.5">{mod.intro}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handlePrint} title="Print worksheet" className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><Printer size={18} /></button>
            <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X size={18} /></button>
          </div>
        </div>
        {guidePrompts.length > 0 && (
          <div className="px-5 py-2 border-b border-slate-50 flex items-center gap-1.5">
            <p className="text-xs text-slate-400 mr-1">Step</p>
            {guidePrompts.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i < promptIndex ? 'bg-brand-500 w-5' : i === promptIndex ? 'bg-brand-200 w-5' : 'bg-slate-200 w-3'}`} />
            ))}
            <p className="text-xs text-slate-400 ml-1">{Math.min(promptIndex, guidePrompts.length)}/{guidePrompts.length}</p>
          </div>
        )}
        {mod?.parentHelp && (
          <div className="px-5 py-2.5 border-b border-amber-100 bg-amber-50 flex items-start gap-2">
            <Bell size={14} className="shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800"><strong>Needs a parent:</strong> {mod.parentHelp}</p>
          </div>
        )}
        {isMathTask && isYoungKid && (
          <div className="px-5 py-2.5 border-b border-sky-100 bg-sky-50 flex items-start gap-2">
            <BookOpen size={14} className="shrink-0 text-sky-600 mt-0.5" />
            <p className="text-xs text-sky-800"><strong>Math tip for you:</strong> If any of the numbers feel tricky, just type "help me with the math" and I will walk you through it step by step!</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0 mr-2 mt-0.5"><MessageCircle size={14} /></div>}
              <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-card'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0"><MessageCircle size={14} /></div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-slate-500 shadow-card">{child.coachName} is thinking…</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-slate-100 p-4 space-y-2">
          {task.id === 'cost-breakdown' && messages.length > 2 && (
            <div className="flex gap-2">
              <button onClick={() => {
                const items = messages.filter((m) => m.role === 'user').map((m) => `<li>${m.content}</li>`).join('');
                const w = window.open('', '_blank');
                w.document.write(`<!DOCTYPE html><html><head><title>Supply List — ${child.name}</title><style>body{font-family:sans-serif;max-width:500px;margin:40px auto;font-size:14px}li{margin:8px 0}</style></head><body><h2>Supply List</h2><p><em>${child.name}'s notes from Cost Breakdown</em></p><ul>${items}</ul></body></html>`);
                w.document.close(); w.print();
              }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"><Printer size={14} /> Print supply list</button>
              {coachCfg.amazonLinks && (
                <button onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(child.name + ' craft supplies')}`, '_blank')} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"><Search size={14} /> Search Amazon</button>
              )}
            </div>
          )}
          {showDone && (
            <button onClick={() => { onMarkDone(task.id, phaseKey); onClose(); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition">
              <CheckCircle2 size={18} /> Mark as done — move to Done column
            </button>
          )}
          <div className="flex gap-2">
            <input type="text" placeholder={listening ? '🎤 Listening…' : `Answer ${child.coachName}…`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} disabled={loading} className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition text-sm" />
            {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
              <button type="button" onClick={listening ? stopListening : startListening} className={`inline-flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm transition ${listening ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`} title="Speak your answer">
                🎤
              </button>
            )}
            <button onClick={handleSend} disabled={loading || !input.trim()} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ KID DASHBOARD ============
function KidDashboard({ child, business, familyId, config, onBack }) {
  const [tasks, setTasks]                   = useState(buildInitialTasks);
  const [activePhase, setActivePhase]       = useState('phase0');
  const [selectedTask, setSelectedTask]     = useState(null);
  const [selectedTaskPhase, setSelectedTaskPhase] = useState(null);
  const savedGeneralChat = getChatHistory(business.id, 'general');
  const hasGeneralHistory = savedGeneralChat?.some((m) => m.role === 'user');
  const [messages, setMessages] = useState(hasGeneralHistory ? savedGeneralChat : [
    { id: 1, role: 'assistant', content: `Hi ${child.name}! I'm ${child.coachName}, your coach for ${business.name}. Click any task card to start working through it, or ask me anything here!` },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showParentRequest, setShowParentRequest] = useState(false);
  const [parentRequestMsg, setParentRequestMsg]   = useState('');
  const [requestSent, setRequestSent]             = useState(false);
  const [sidebarListening, setSidebarListening]   = useState(false);
  const messagesEndRef    = useRef(null);
  const sidebarRecRef     = useRef(null);

  const startSidebarListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e) => { setInput((p) => (p ? p + ' ' : '') + e.results[0][0].transcript); };
    rec.onend = () => setSidebarListening(false);
    rec.onerror = () => setSidebarListening(false);
    sidebarRecRef.current = rec;
    rec.start();
    setSidebarListening(true);
  };
  const stopSidebarListening = () => { sidebarRecRef.current?.stop(); setSidebarListening(false); };

  const handleSendParentRequest = () => {
    addNotification(familyId, {
      childId: child.id, childName: child.name,
      businessId: business.id, businessName: business.name,
      message: parentRequestMsg.trim(),
    });
    setRequestSent(true);
  };

  // Load task states from Supabase (or localStorage fallback)
  useEffect(() => {
    const lsKey = `kb_tasks_${business.id}`;
    if (isConfigured && supabase) {
      supabase.from('task_states').select('*').eq('business_id', business.id)
        .then(({ data }) => {
          if (data && data.length > 0) setTasks(applyTaskStates(null, data));
          setLoadingTasks(false);
        });
    } else {
      const saved = localStorage.getItem(lsKey);
      if (saved) setTasks(JSON.parse(saved));
      setLoadingTasks(false);
    }
  }, [business.id]);

  // Persist to localStorage whenever tasks change (offline fallback)
  useEffect(() => {
    if (!loadingTasks) {
      localStorage.setItem(`kb_tasks_${business.id}`, JSON.stringify(tasks));
    }
  }, [tasks, business.id, loadingTasks]);

  useEffect(() => { saveChatHistory(business.id, 'general', messages); }, [messages, business.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const updateTaskStatus = useCallback((taskId, phaseKey, newStatus) => {
    setTasks((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const statuses = ['todo', 'inprogress', 'done'];
      for (const s of statuses) {
        const idx = next[phaseKey][s].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          const [task] = next[phaseKey][s].splice(idx, 1);
          if (s !== newStatus) next[phaseKey][newStatus].push(task);
          break;
        }
      }
      return next;
    });
    persistTaskStatus(business.id, familyId, taskId, phaseKey, newStatus);
  }, [business.id, familyId]);

  const handleMarkDone  = (taskId, phaseKey) => updateTaskStatus(taskId, phaseKey, 'done');
  const handleDragStart = (e, taskId, phase) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('taskId', taskId); e.dataTransfer.setData('phase', phase); };
  const handleDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop      = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const srcPhase = e.dataTransfer.getData('phase');
    updateTaskStatus(taskId, srcPhase, targetStatus);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    let reply = null;
    if (isConfigured && supabase) {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (authSession) {
          const coachCfg = getCoachConfig(familyId);
          // Build full prior context from ALL task conversations for this business
          const allTaskContext = Object.values(CURRICULUM_TASKS)
            .flatMap((p) => p.tasks)
            .map((t) => {
              const history = getChatHistory(business.id, t.id);
              if (!history) return null;
              const lastUser = [...history].reverse().find((m) => m.role === 'user');
              const lastAsst = [...history].reverse().find((m) => m.role === 'assistant');
              if (!lastUser || !lastAsst) return null;
              return `[${t.title}]\nKid: ${lastUser.content.slice(0, 300)}\nCoach: ${lastAsst.content.slice(0, 300)}`;
            })
            .filter(Boolean)
            .join('\n\n');

          const res = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-chat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
              body: JSON.stringify({
                messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
                childName: child.name,
                childAge: child.age,
                coachName: child.coachName || 'Coach',
                taskTitle: 'General Business Coaching',
                taskIntro: `You are the ongoing coach for ${child.name}'s business "${business.name}". Answer questions, help them think through problems, and encourage them to keep making progress. Be personal and reference their specific business.`,
                offLimitsTopics: coachCfg.offLimitsTopics,
                priorContext: allTaskContext,
              }),
            }
          );
          const json = await res.json();
          if (json.reply) reply = json.reply;
        }
      } catch (_) {}
    }

    if (!reply) {
      reply = `Good question! Click a task card to work through it step by step, or keep asking me here — I'm here to help ${business.name} succeed.`;
    }
    setMessages((p) => [...p, { id: Date.now() + 1, role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const currentPhase = CURRICULUM_TASKS[activePhase];
  const phaseState   = tasks[activePhase] || { todo: [], inprogress: [], done: [] };
  const todoTasks       = phaseState.todo.map((t) => ({ ...t, phase: activePhase }));
  const inProgressTasks = phaseState.inprogress.map((t) => ({ ...t, phase: activePhase }));
  const doneTasks       = phaseState.done.map((t) => ({ ...t, phase: activePhase }));

  const totalTasks     = Object.values(CURRICULUM_TASKS).reduce((s, p) => s + p.tasks.length, 0);
  const completedTasks = Object.values(tasks).reduce((s, p) => s + (p.done?.length || 0), 0);
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const launchDate   = business.launch_date || config?.timelines?.phase4 || '2026-06-30';
  const daysToLaunch = Math.max(0, Math.ceil((new Date(launchDate) - new Date()) / 86400000));

  return (
    <div className="min-h-screen bg-slate-50">
      {selectedTask && (
        <TaskModule key={selectedTask.id} task={selectedTask} phaseKey={selectedTaskPhase} child={child} businessId={business.id} familyId={familyId} onClose={() => { setSelectedTask(null); setSelectedTaskPhase(null); }} onMarkDone={(id, pk) => { handleMarkDone(id, pk); setSelectedTask(null); setSelectedTaskPhase(null); }} />
      )}

      {showParentRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-1">Ask a parent</h2>
            <p className="text-sm text-slate-500 mb-4">Send a request — your parent will see it in Settings.</p>
            {requestSent ? (
              <div className="text-center py-4">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-900">Request sent!</p>
                <button onClick={() => { setShowParentRequest(false); setRequestSent(false); setParentRequestMsg(''); }} className="mt-4 inline-flex items-center px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition">Done</button>
              </div>
            ) : (
              <>
                <textarea value={parentRequestMsg} onChange={(e) => setParentRequestMsg(e.target.value)} placeholder="e.g. Can I have $20 more for extra supplies? My launch date is coming up fast!" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none" />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSendParentRequest} disabled={!parentRequestMsg.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">Send request</button>
                  <button onClick={() => { setShowParentRequest(false); setParentRequestMsg(''); }} className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft size={18} /></button>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-500">{child.name}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{business.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowParentRequest(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"><Bell size={13} /> Ask a parent</button>
            <Badge className="bg-accent-50 text-accent-700 ring-accent-200"><Sparkles size={12} /> Coach {child.coachName}</Badge>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-100">{business.name}</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Let's get to launch, {child.name}.</h1>
              <p className="text-brand-100 mt-2">Click any task card to start working through it with {child.coachName}.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 ring-1 ring-white/20">
                <p className="text-xs font-medium text-brand-100">Done</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 ring-1 ring-white/20">
                <p className="text-xs font-medium text-brand-100">Budget</p>
                <p className="text-2xl font-bold">{business.budget ? `$${business.budget}` : '—'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 ring-1 ring-white/20">
                <p className="text-xs font-medium text-brand-100">Days to launch</p>
                <p className="text-2xl font-bold">{daysToLaunch}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-brand-100 mb-2"><span>Progress</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progressPercent)}%` }} />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Phase selector */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Phases</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.entries(CURRICULUM_TASKS).map(([key, data]) => (
              <button key={key} onClick={() => setActivePhase(key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition border ${activePhase === key ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
                <Badge className={data.accent}>{data.short}</Badge>{data.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">{currentPhase.label}</h2>
            <p className="text-sm text-slate-500">Due {currentPhase.deadline}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[['To do', 'todo', 'border-slate-200', todoTasks], ['In progress', 'inprogress', 'border-brand-200', inProgressTasks], ['Done', 'done', 'border-emerald-200', doneTasks]].map(([title, status, accent, colTasks]) => (
              <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className={`bg-white rounded-xl border border-slate-200 border-t-2 ${accent} p-4 min-h-[16rem] shadow-card`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const meta = TYPE_META[task.type] || TYPE_META.deliverable;
                    const Icon = meta.Icon;
                    const mod  = TASK_MODULES[task.id];
                    return (
                      <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id, task.phase)} onClick={() => { setSelectedTask(task); setSelectedTaskPhase(task.phase); }} className={`group bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-cardHover hover:border-brand-300 transition ${status === 'done' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`shrink-0 w-7 h-7 rounded-md ring-1 ring-inset flex items-center justify-center ${meta.tint}`}><Icon size={14} /></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-slate-800 leading-snug ${status === 'done' ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
                            {mod && status !== 'done' && <p className="text-xs text-slate-400 mt-0.5 truncate">{mod.headline}</p>}
                          </div>
                          {status !== 'done' ? <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-brand-500 transition mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 text-emerald-500 mt-0.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><GripVertical size={14} /> Drag between columns, or click a card to work through it.</p>
        </div>

        {/* Coach chat */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-80 shadow-card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center"><MessageCircle size={16} /></div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">Ask {child.coachName} anything</p>
              <p className="text-xs text-slate-500">General questions, brainstorming, quick advice</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md border border-slate-200 whitespace-pre-wrap'}`}>{msg.content}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white text-slate-500 text-sm rounded-2xl rounded-bl-md border border-slate-200 px-3.5 py-2.5">{child.coachName} is thinking…</div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-slate-100 p-3 flex gap-2">
            <input type="text" placeholder={sidebarListening ? '🎤 Listening…' : `Ask ${child.coachName} anything…`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} disabled={loading} className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition text-sm" />
            {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
              <button type="button" onClick={sidebarListening ? stopSidebarListening : startSidebarListening} className={`inline-flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm transition ${sidebarListening ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`} title="Speak your question">
                🎤
              </button>
            )}
            <button onClick={handleSendMessage} disabled={loading || !input.trim()} className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition"><Send size={16} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============ BUSINESS HUB (per child) ============
function BusinessHub({ child, familyId, config, onBack }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newName, setNewName]           = useState('');
  const [newBudget, setNewBudget]       = useState('100');
  const [newLaunchDate, setNewLaunchDate] = useState('');
  const [creating, setCreating]         = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [activeBiz, setActiveBiz]       = useState(null);
  const [createError, setCreateError]   = useState('');

  const lsKey = `kb_businesses_${child.id}`;

  useEffect(() => {
    if (isConfigured && supabase) {
      supabase.from('businesses').select('*').eq('child_id', child.id).order('created_at')
        .then(({ data }) => { setBusinesses(data || []); setLoading(false); });
    } else {
      const saved = localStorage.getItem(lsKey);
      setBusinesses(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
  }, [child.id, lsKey]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    const biz = { id: crypto.randomUUID(), child_id: child.id, family_id: familyId, name: newName.trim(), description: '', budget: parseInt(newBudget) || 100, launch_date: newLaunchDate || null, created_at: new Date().toISOString() };
    if (isConfigured && supabase) {
      const { data, error } = await supabase.from('businesses').insert(biz).select().single();
      if (error) {
        setCreateError(error.message || 'Save failed — please try again.');
        setCreating(false);
        return;
      }
      if (data) setBusinesses((p) => [...p, data]);
    } else {
      const updated = [...businesses, biz];
      setBusinesses(updated);
      localStorage.setItem(lsKey, JSON.stringify(updated));
    }
    setNewName(''); setNewBudget('100'); setNewLaunchDate('');
    setShowCreate(false);
    setCreating(false);
  };

  const handleDelete = async (bizId) => {
    if (!window.confirm('Delete this business and all its data? This cannot be undone.')) return;
    if (isConfigured && supabase) {
      await supabase.from('businesses').delete().eq('id', bizId);
    }
    const updated = businesses.filter((b) => b.id !== bizId);
    setBusinesses(updated);
    if (!isConfigured) localStorage.setItem(lsKey, JSON.stringify(updated));
  };

  if (activeBiz) {
    return <KidDashboard child={child} business={activeBiz} familyId={familyId} config={config} onBack={() => setActiveBiz(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft size={18} /></button>
            <span className="text-slate-300">/</span>
            <Avatar name={child.name} />
            <span className="text-sm font-semibold text-slate-900">{child.name}'s Businesses</span>
          </div>
          <Badge className="bg-accent-50 text-accent-700 ring-accent-200"><Sparkles size={12} /> Coach {child.coachName}</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{child.name}'s Businesses</h1>
            <p className="text-slate-500 mt-1">Each business has its own curriculum, tasks, and coach session.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition">
            <Plus size={16} /> New business
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl border-2 border-brand-200 p-5 mb-6 shadow-card">
            <h3 className="font-semibold text-slate-900 mb-4">Start a new business</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Business name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} placeholder="e.g. Homemade Candles Co." autoFocus className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Startup budget ($)</label>
                <input type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="100" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Launch / first sale date</label>
                <input type="date" value={newLaunchDate} onChange={(e) => setNewLaunchDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
              </div>
            </div>
            {createError && <p className="text-xs text-rose-600 mb-2">{createError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={creating || !newName.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">{creating ? 'Creating…' : 'Create business'}</button>
              <button onClick={() => { setShowCreate(false); setNewName(''); setNewBudget('100'); setNewLaunchDate(''); }} className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Business list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" /></div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-brand-100"><Briefcase size={24} /></div>
            <h3 className="font-semibold text-slate-900">No businesses yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Create your first business to start the 5-phase program.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition">
              <Plus size={16} /> Start first business
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {businesses.map((biz) => {
              const savedTasks = (() => { try { return JSON.parse(localStorage.getItem(`kb_tasks_${biz.id}`) || 'null'); } catch { return null; } })();
              const done = savedTasks ? Object.values(savedTasks).reduce((s, p) => s + (p.done?.length || 0), 0) : 0;
              const total = Object.values(CURRICULUM_TASKS).reduce((s, p) => s + p.tasks.length, 0);
              const pct = Math.round((done / total) * 100);
              return (
                <div key={biz.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-cardHover hover:border-brand-300 transition group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700 flex items-center justify-center font-bold text-lg ring-1 ring-brand-200">
                      {biz.name.charAt(0).toUpperCase()}
                    </div>
                    <button onClick={() => handleDelete(biz.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition"><Trash2 size={15} /></button>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate">{biz.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Started {new Date(biz.created_at).toLocaleDateString()}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{done}/{total} tasks done</span><span>{pct}%</span></div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.max(2, pct)}%` }} /></div>
                  </div>
                  <button onClick={() => setActiveBiz(biz)} className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:border-brand-300 hover:bg-brand-50/50 transition group-hover:border-brand-300">
                    Open dashboard <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ============ FAMILY HUB (child selector + PIN) ============
function FamilyHub({ onOpenParent }) {
  const { session, family, signOut } = useAuth();
  const [children, setChildren]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pinEntry, setPinEntry]     = useState(null); // child object awaiting PIN
  const [pin, setPin]               = useState('');
  const [pinError, setPinError]     = useState('');
  const [config] = useState({ timelines: { phase0: '2026-05-16', phase1: '2026-05-31', phase2: '2026-06-07', phase3: '2026-06-21', phase4: '2026-06-30' }, budgetMin: 50, budgetMax: 500 });
  const [activeChild, setActiveChild] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge]   = useState('');
  const [newChildPin, setNewChildPin]   = useState('');
  const [newCoachName, setNewCoachName] = useState('Claude');
  const [addingChild, setAddingChild]   = useState(false);
  const lsKey = `kb_children_${session?.user?.id || 'demo'}`;

  useEffect(() => {
    const famId = session?.user?.id || 'demo';
    setPendingCount(getNotifications(famId).filter((n) => n.status === 'pending').length);
  }, [session]);

  useEffect(() => {
    if (isConfigured && supabase && session) {
      supabase.from('children').select('*').eq('family_id', session.user.id).order('created_at')
        .then(({ data }) => { setChildren(data || []); setLoading(false); });
    } else {
      const saved = localStorage.getItem(lsKey);
      if (saved) { setChildren(JSON.parse(saved)); }
      else {
        const defaults = [{ id: crypto.randomUUID(), family_id: 'demo', name: 'Calvin', age: 14, pin: '1234', coach_name: 'Claude', created_at: new Date().toISOString() }, { id: crypto.randomUUID(), family_id: 'demo', name: 'Chase', age: 10, pin: '1234', coach_name: 'Claude', created_at: new Date().toISOString() }];
        setChildren(defaults);
        localStorage.setItem(lsKey, JSON.stringify(defaults));
      }
      setLoading(false);
    }
  }, [session, lsKey]);

  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildPin.trim()) return;
    setAddingChild(true);
    const child = { id: crypto.randomUUID(), family_id: session?.user?.id || 'demo', name: newChildName.trim(), age: parseInt(newChildAge) || null, pin: newChildPin.trim(), coach_name: newCoachName.trim() || 'Claude', created_at: new Date().toISOString() };
    if (isConfigured && supabase && session) {
      const { data } = await supabase.from('children').insert(child).select().single();
      if (data) setChildren((p) => [...p, data]);
    } else {
      const updated = [...children, child];
      setChildren(updated);
      localStorage.setItem(lsKey, JSON.stringify(updated));
    }
    setNewChildName(''); setNewChildAge(''); setNewChildPin(''); setNewCoachName('Claude');
    setShowAddChild(false); setAddingChild(false);
  };

  const handlePinSubmit = () => {
    if (pin === pinEntry.pin || pin === (pinEntry.pin_hash || pinEntry.pin)) {
      setActiveChild({ ...pinEntry, coachName: pinEntry.coach_name });
      setPinEntry(null); setPin(''); setPinError('');
    } else {
      setPinError('Wrong PIN. Try again.');
      setPin('');
    }
  };

  if (activeChild) {
    return <BusinessHub child={activeChild} familyId={session?.user?.id || 'demo'} config={config} onBack={() => setActiveChild(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PIN modal */}
      {pinEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-7">
            <div className="flex justify-center mb-4"><Avatar name={pinEntry.name} /></div>
            <h2 className="text-center font-bold text-slate-900 text-lg">{pinEntry.name}</h2>
            <p className="text-center text-sm text-slate-500 mt-1">Enter your 4-digit PIN</p>
            <div className="mt-5 space-y-3">
              <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()} autoFocus className="w-full px-3.5 py-3 rounded-lg border border-slate-300 bg-white text-center text-2xl font-bold text-slate-900 tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition" placeholder="••••" />
              {pinError && <p className="text-center text-xs text-rose-600">{pinError}</p>}
              <button onClick={handlePinSubmit} disabled={pin.length < 4} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">Continue <ChevronRight size={16} /></button>
              <button onClick={() => { setPinEntry(null); setPin(''); setPinError(''); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
            </div>
            {!isConfigured && <p className="text-center text-xs text-slate-400 mt-3">Demo PIN: 1234</p>}
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <button onClick={onOpenParent} className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 transition">
              <Settings size={16} /> Settings
              {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingCount}</span>}
            </button>
            <button onClick={signOut} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 transition"><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500">{family?.email || 'Demo mode'}</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-1">Who's working today?</h1>
          </div>
          <button onClick={() => setShowAddChild(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"><Plus size={16} /> Add child</button>
        </div>

        {showAddChild && (
          <div className="bg-white rounded-xl border-2 border-brand-200 p-6 mb-6 shadow-card">
            <h3 className="font-semibold text-slate-900 mb-4">Add a child</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Name</label><input type="text" value={newChildName} onChange={(e) => setNewChildName(e.target.value)} placeholder="Alex" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Age</label><input type="number" value={newChildAge} onChange={(e) => setNewChildAge(e.target.value)} placeholder="12" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">4-digit PIN</label><input type="text" maxLength={4} value={newChildPin} onChange={(e) => setNewChildPin(e.target.value)} placeholder="1234" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Coach name</label><input type="text" value={newCoachName} onChange={(e) => setNewCoachName(e.target.value)} placeholder="Claude" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddChild} disabled={addingChild || !newChildName.trim() || !newChildPin.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">{addingChild ? 'Adding…' : 'Add child'}</button>
              <button onClick={() => setShowAddChild(false)} className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {children.map((child) => (
              <button key={child.id} onClick={() => setPinEntry(child)} className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-brand-300 hover:shadow-cardHover transition group shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700 flex items-center justify-center text-xl font-bold ring-1 ring-brand-200">{child.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="font-bold text-slate-900">{child.name}</p>
                    <p className="text-xs text-slate-500">Age {child.age}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Sparkles size={11} /> Coach {child.coach_name}</p>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-600 transition" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ============ PARENT CONSOLE ============
function ParentConsole({ onBack }) {
  const { session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [config, setConfig] = useState({ budgetMin: 50, budgetMax: 500, timelines: { phase0: '2026-05-16', phase1: '2026-05-31', phase2: '2026-06-07', phase3: '2026-06-21', phase4: '2026-06-30' }, integrations: { claude: false, googleDrive: false, n8n: false, obsidian: false } });
  const [budgetMin, setBudgetMin] = useState(50);
  const [budgetMax, setBudgetMax] = useState(500);
  const [apiKey, setApiKey]       = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [coachCfg, setCoachCfgState] = useState(() => getCoachConfig(session?.user?.id || 'demo'));
  const updateCoachCfg = (partial) => {
    const next = { ...coachCfg, ...partial };
    setCoachCfgState(next);
    saveCoachConfig(session?.user?.id || 'demo', next);
  };
  const tabs = [{ id: 'timeline', label: 'Timeline', Icon: Calendar }, { id: 'budget', label: 'Budget', Icon: DollarSign }, { id: 'coach', label: 'AI Coach', Icon: Sparkles }, { id: 'integrations', label: 'Integrations', Icon: LinkIcon }, { id: 'requests', label: 'Requests', Icon: Bell }];

  useEffect(() => {
    const famId = session?.user?.id || 'demo';
    setNotifications(getNotifications(famId));
  }, [session]);

  const handleNotifAction = (id, status) => {
    const famId = session?.user?.id || 'demo';
    updateNotificationStatus(famId, id, status);
    setNotifications(getNotifications(famId));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><ArrowLeft size={18} /></button>
            <Logo size="sm" />
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-600">Parent Console</span>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 transition"><LogOut size={16} /> Sign out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 mb-8">Configure timelines, budgets, and integrations for your family.</p>
        <div className="border-b border-slate-200 mb-8 flex gap-1 overflow-x-auto">
          {tabs.map((t) => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><t.Icon size={16} />{t.label}</button>)}
        </div>

        {activeTab === 'timeline' && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Phase deadlines</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-card">
              {Object.entries(CURRICULUM_TASKS).map(([key, phase]) => (
                <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge className={phase.accent}>{phase.short}</Badge>
                    <div><p className="font-semibold text-slate-900">{phase.label}</p><p className="text-xs text-slate-500">Current: {config.timelines[key]}</p></div>
                  </div>
                  <input type="date" defaultValue={config.timelines[key]} onChange={(e) => setConfig({ ...config, timelines: { ...config.timelines, [key]: e.target.value } })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'budget' && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Startup budget</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl shadow-card space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Minimum</label><div className="relative"><DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Maximum</label><div className="relative"><DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /></div></div>
              <button onClick={() => setConfig({ ...config, budgetMin, budgetMax })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition">Save changes</button>
            </div>
          </section>
        )}

        {activeTab === 'coach' && (
          <section className="space-y-6 max-w-2xl">
            {/* Safe mode — always on */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Safe mode — always on</p>
                <p className="text-sm text-slate-600 mt-0.5">The AI coach is pre-configured to be age-appropriate, encouraging, and free of adult content. This setting cannot be turned off.</p>
              </div>
            </div>

            {/* Seed ideas */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
              <h3 className="font-semibold text-slate-900 mb-1">Starter ideas for your child</h3>
              <p className="text-sm text-slate-500 mb-3">Optional. If you have ideas that suit your child's interests or skills, add them here. The coach will mention them during Opportunity Spotting.</p>
              <textarea value={coachCfg.seedIdeas} onChange={(e) => updateCoachCfg({ seedIdeas: e.target.value })} placeholder="e.g. She loves baking and has been making cupcakes for family for years. He is really good at drawing and could sell art prints." rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none" />
            </div>

            {/* Off-limits topics */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
              <h3 className="font-semibold text-slate-900 mb-1">Additional off-limits topics</h3>
              <p className="text-sm text-slate-500 mb-3">The coach already avoids adult content by default. Add anything else specific to your family — products, themes, or subjects you want excluded.</p>
              <textarea value={coachCfg.offLimitsTopics} onChange={(e) => updateCoachCfg({ offLimitsTopics: e.target.value })} placeholder="e.g. anything involving animals, political messaging, fast food" rows={2} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none" />
            </div>

            {/* Parent approval required */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
              <h3 className="font-semibold text-slate-900 mb-1">Parent approval required for</h3>
              <p className="text-sm text-slate-500 mb-4">The coach will flag these steps and prompt your child to ask you before proceeding.</p>
              <div className="space-y-3">
                {[
                  { key: 'purchases', label: 'Purchasing supplies', desc: 'Coach will show a "needs parent" notice on the Cost Breakdown task.' },
                  { key: 'transportation', label: 'Transportation to interviews or events', desc: 'Coach will flag tasks like Customer Interviews and Craft Fair Execution.' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={coachCfg.parentApprovals?.[key] ?? true} onChange={(e) => updateCoachCfg({ parentApprovals: { ...coachCfg.parentApprovals, [key]: e.target.checked } })} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Supply ordering */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Show Amazon search links in supply lists</h3>
                  <p className="text-sm text-slate-500 mt-1">After the Cost Breakdown task, your child will see a button to search Amazon for their supplies. No account connection needed — just a quick search link.</p>
                </div>
                <button onClick={() => updateCoachCfg({ amazonLinks: !coachCfg.amazonLinks })} role="switch" aria-checked={coachCfg.amazonLinks} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${coachCfg.amazonLinks ? 'bg-brand-600' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 ${coachCfg.amazonLinks ? 'left-5' : 'left-0.5'} h-5 w-5 rounded-full bg-white shadow transition-all`} />
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'requests' && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Kids' requests</h2>
            <p className="text-slate-500 text-sm mb-5">When a child taps "Ask a parent," their message shows up here.</p>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-card">
                <Bell size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...notifications].reverse().map((n) => (
                  <div key={n.id} className={`bg-white rounded-xl border p-4 shadow-card flex items-start justify-between gap-4 ${n.status === 'pending' ? 'border-amber-200' : 'border-slate-200 opacity-60'}`}>
                    <div>
                      <p className="font-semibold text-slate-900">{n.childName} — <span className="text-slate-500 font-normal">{n.businessName}</span></p>
                      <p className="text-sm text-slate-700 mt-1">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    {n.status === 'pending' ? (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleNotifAction(n.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition">Approve</button>
                        <button onClick={() => handleNotifAction(n.id, 'denied')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition">Deny</button>
                      </div>
                    ) : (
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${n.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{n.status}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'integrations' && (
          <section className="space-y-5">
            <div className="bg-white rounded-xl border border-brand-200 p-5 bg-gradient-to-br from-brand-50 to-accent-50">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">KidzBiz works without any third-party accounts</p>
                  <p className="text-sm text-slate-600 mt-1">Your kids can start the curriculum right now. The integrations below are optional for families who want to connect their own tools.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['AI coach included', 'No accounts needed', 'Progress auto-saved'].map((f) => <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-brand-200 text-xs font-semibold text-brand-700"><CheckCircle2 size={11} /> {f}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {[
              { key: 'claude', title: 'Claude API (your own key)', desc: 'Connect your own Anthropic key for live AI coaching instead of the built-in demo responses.', extra: config.integrations.claude ? (<div className="mt-3"><label className="block text-xs font-semibold text-slate-600 mb-1">API key</label><div className="flex gap-2"><input type={showApiKey ? 'text' : 'password'} placeholder="sk-ant-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" /><button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition">{showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>) : null },
              { key: 'googleDrive', title: 'Google Drive', desc: 'Auto-save worksheets and deliverables to a shared family folder.' },
            ].map(({ key, title, desc, extra }) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div><h3 className="font-semibold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div>
                  <button onClick={() => setConfig({ ...config, integrations: { ...config.integrations, [key]: !config.integrations[key] } })} role="switch" aria-checked={config.integrations[key]} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${config.integrations[key] ? 'bg-brand-600' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 ${config.integrations[key] ? 'left-5' : 'left-0.5'} h-5 w-5 rounded-full bg-white shadow transition-all`} />
                  </button>
                </div>
                {extra}
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Advanced</p>
              {[{ key: 'n8n', title: 'n8n Automation', desc: 'Custom approval workflows via your own n8n instance.' }, { key: 'obsidian', title: 'Obsidian Sync', desc: 'Export notes and deliverables to your local Obsidian vault.' }].map(({ key, title, desc }) => (
                <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card mb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-semibold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div>
                    <button onClick={() => setConfig({ ...config, integrations: { ...config.integrations, [key]: !config.integrations[key] } })} role="switch" aria-checked={config.integrations[key]} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${config.integrations[key] ? 'bg-brand-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 ${config.integrations[key] ? 'left-5' : 'left-0.5'} h-5 w-5 rounded-full bg-white shadow transition-all`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ============ MAIN PLATFORM ROUTER ============
export default function Platform() {
  const [showParent, setShowParent] = useState(false);
  const [activated, setActivated]   = useState(false);

  useLayoutEffect(() => {
    if (window.location.search.includes('activated=1')) {
      setActivated(true);
      // Clean the URL without triggering a re-render
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  return (
    <>
      {activated && (
        <div className="fixed top-0 inset-x-0 z-50 bg-emerald-600 text-white flex items-center justify-between px-6 py-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} />
            <span className="font-semibold text-sm">Your plan is active — welcome to KidzBiz! Your 14-day trial has started.</span>
          </div>
          <button onClick={() => setActivated(false)} className="p-1 rounded hover:bg-emerald-700 transition"><X size={16} /></button>
        </div>
      )}
      {showParent
        ? <ParentConsole onBack={() => setShowParent(false)} />
        : <FamilyHub onOpenParent={() => setShowParent(true)} />
      }
    </>
  );
}
