import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  Briefcase, MessageCircle, Send, LogOut, Plus, Trash2,
  Eye, EyeOff, Calendar, DollarSign,
  Sparkles, GripVertical, Search, Target, Wrench, Palette,
  Mic, Package, BookOpen, BarChart3, Flag, ChevronRight,
  X, CheckCircle2, Link as LinkIcon, Settings, ArrowLeft, Printer, Bell, BarChart2,
  Volume2, VolumeX, Lock, Unlock,
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

// ── Suggestion chips shown to kids when they might be stuck ───────────────
// Sentence-starters the kid can tap to pre-fill the input. Shown for the
// first 5 user messages so they're always handy early in a conversation.
// OpenAI TTS voices — much higher quality than browser SpeechSynthesis
const OPENAI_VOICES = [
  { id: 'nova',    label: 'Nova — friendly & clear'      },
  { id: 'shimmer', label: 'Shimmer — warm & gentle'      },
  { id: 'alloy',   label: 'Alloy — neutral & calm'       },
  { id: 'fable',   label: 'Fable — warm & expressive'    },
  { id: 'echo',    label: 'Echo — soft & conversational' },
  { id: 'onyx',    label: 'Onyx — deep & confident'      },
];

const STUCK_SUGGESTIONS = {
  'op-spot':         ["I already have an idea — I want to…", "I have a craft fair coming up", "I don't have an idea yet"],
  'part-decision':   ["I want to go solo", "I have a friend who might partner", "I'm not sure — help me think through it"],
  'idea-worksheet':  ["My product is…", "My customer would be…", "I'm stuck on what problem I solve"],
  'interviews':      ["I could ask my neighbors", "I know some parents I could interview", "I don't know who to talk to"],
  'market-gap':      ["The problem I found is…", "Customers said they wished…", "I'm not sure what the gap is"],
  'product-pitches': ["My first idea is…", "I could make or sell…", "I need help thinking of ideas"],
  'cost-breakdown':  ["I need supplies like…", "I'm not sure what things cost", "My main materials are…"],
  'pricing-strategy':["Similar things sell for about…", "I'm not sure what to charge", "I think the right price is…"],
  'revenue-forecast':["I think I could sell about ___ units", "I'm not sure how many I'd sell", "My low estimate is…"],
  'biz-plan':        ["My business summary is…", "I'm stuck on the market section", "Here's what I have so far:"],
  'prototype':       ["I made my first batch and…", "I'm not sure how to start making it", "My test result was…"],
  'feedback-log':    ["The first person I showed said…", "People liked…", "I haven't shown it to anyone yet"],
  'production-ramp': ["I can make about ___ per session", "I'm worried about running out of time", "My plan is…"],
  'booth-design':    ["I want my booth to look…", "I'm not sure where to start", "I was thinking of using…"],
  'sales-pitch':     ["Here's my pitch attempt:", "I get nervous when someone asks…", "I'm not sure how to start"],
  'fair-execution':  ["Everything is ready except…", "My goal for the fair is…", "I'm nervous about…"],
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

// ── Plan limits & info ────────────────────────────────────────────────────
const PLAN_LIMITS = { free: 1, family: 4, class: 30 };
const PLAN_INFO = {
  free:   { name: 'Free',        price: 'Free',    childLabel: '1 child',       features: ['1 child', 'Full curriculum', 'AI coach'] },
  family: { name: 'Family',      price: '$12/mo',  childLabel: 'Up to 4 kids',  features: ['Up to 4 children', 'Full curriculum', 'AI coach', '14-day free trial'], plan: 'family' },
  class:  { name: 'Classroom',   price: '$29/mo',  childLabel: 'Up to 30 kids', features: ['Up to 30 children', 'Full curriculum', 'AI coach', 'Class management', '14-day free trial'], plan: 'class' },
};

// ── Send email notification via Edge Function (fire-and-forget) ──────────
async function sendEmailNotification(payload) {
  if (!isConfigured || !supabase) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
    }).catch(() => {}); // truly fire-and-forget
  } catch (_) {}
}

// ── Checkout helpers (used in FamilyHub & ParentConsole) ──────────────────
async function getAccessToken() {
  if (!isConfigured || !supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
async function startCheckout(plan) {
  const token = await getAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, successUrl: `${window.location.origin}/app?activated=1`, cancelUrl: `${window.location.origin}/app` }),
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
  } catch (e) { console.error('checkout error', e); }
}
async function openBillingPortal() {
  const token = await getAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/app` }),
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else alert(json.error || 'Could not open billing portal.');
  } catch (e) { console.error('portal error', e); }
}

const DEFAULT_COACH_CONFIG = { seedIdeas: '', offLimitsTopics: 'adult content, violence, politics, anything inappropriate for kids', safeMode: true, parentApprovals: { purchases: true, transportation: true }, amazonLinks: false };
function getCoachConfig(familyId) {
  try { return { ...DEFAULT_COACH_CONFIG, ...JSON.parse(localStorage.getItem(`kb_coach_${familyId}`) || 'null') }; } catch { return DEFAULT_COACH_CONFIG; }
}
function saveCoachConfig(familyId, cfg) { localStorage.setItem(`kb_coach_${familyId}`, JSON.stringify(cfg)); }

// Per-child coaching profile (stored by childId)
const DEFAULT_CHILD_CONFIG = { grade: '', accommodations: '', sensitivities: '', focusAreas: '', learningStyle: '', parentNotes: '' };
function getChildConfig(childId) {
  try { return { ...DEFAULT_CHILD_CONFIG, ...JSON.parse(localStorage.getItem(`kb_child_cfg_${childId}`) || 'null') }; } catch { return DEFAULT_CHILD_CONFIG; }
}
function saveChildConfig(childId, cfg) { localStorage.setItem(`kb_child_cfg_${childId}`, JSON.stringify(cfg)); }

// Per-child TTS (text-to-speech) preferences
function getChildTtsEnabled(childId) { return localStorage.getItem(`kb_tts_on_${childId}`) === 'true'; }
function saveChildTtsEnabled(childId, v) { localStorage.setItem(`kb_tts_on_${childId}`, String(v)); }
function getChildVoiceName(childId) { return localStorage.getItem(`kb_tts_voice_${childId}`) || ''; }
function saveChildVoiceName(childId, name) { localStorage.setItem(`kb_tts_voice_${childId}`, name); }

// Per-business parent injection notes
function getBizNotes(bizId) {
  try { return localStorage.getItem(`kb_biz_notes_${bizId}`) || ''; } catch { return ''; }
}
function saveBizNotes(bizId, notes) { localStorage.setItem(`kb_biz_notes_${bizId}`, notes); }

// iOS detection — Chrome on iPhone is WebKit and blocks async speechSynthesis.speak()
const isIOSDevice = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Pitch / funding gate helpers (stored per business in localStorage)
const DEFAULT_PITCH_GATE = { gateType: 'none', budget: 50, criteria: '' };
function getPitchGate(bizId) {
  try { return { ...DEFAULT_PITCH_GATE, ...JSON.parse(localStorage.getItem(`kb_pitch_gate_${bizId}`) || 'null') }; }
  catch { return DEFAULT_PITCH_GATE; }
}
function savePitchGate(bizId, cfg) { localStorage.setItem(`kb_pitch_gate_${bizId}`, JSON.stringify(cfg)); }
function isPitchApproved(bizId) { return localStorage.getItem(`kb_pitch_approved_${bizId}`) === 'true'; }
function setPitchApproved(bizId) { localStorage.setItem(`kb_pitch_approved_${bizId}`, 'true'); }

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

// ============ UPGRADE MODAL ============
function UpgradeModal({ reason, onClose }) {
  const [loading, setLoading] = useState(null);
  const handle = async (plan) => {
    setLoading(plan);
    await startCheckout(plan);
    setLoading(null);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Unlock more kids</h2>
            <p className="text-sm text-slate-500 mt-1">{reason || 'Upgrade to add more children to your account.'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X size={18} /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {['family', 'class'].map((plan) => {
            const info = PLAN_INFO[plan];
            return (
              <div key={plan} className={`rounded-xl border-2 p-5 ${plan === 'family' ? 'border-brand-300 bg-brand-50' : 'border-slate-200'}`}>
                <p className="font-bold text-slate-900 text-lg">{info.name}</p>
                <p className="text-2xl font-extrabold text-brand-600 mt-1">{info.price}</p>
                <p className="text-xs text-slate-500 mb-4">{info.childLabel}</p>
                <ul className="space-y-1.5 mb-5">
                  {info.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => handle(plan)} disabled={!!loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">
                  {loading === plan ? 'Redirecting…' : '14-day free trial →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  const [showAskParent, setShowAskParent]   = useState(false);
  const [askParentMsg, setAskParentMsg]     = useState('');
  const [askParentSent, setAskParentSent]   = useState(false);
  const [ttsEnabled, setTtsEnabled]         = useState(() => getChildTtsEnabled(child.id));
  const [selectedVoice, setSelectedVoice]   = useState(() => {
    const saved = getChildVoiceName(child.id);
    // Validate — reject old browser voice names like "Samantha", fall back to nova
    return OPENAI_VOICES.find((v) => v.id === saved) ? saved : 'nova';
  });
  const [speaking, setSpeaking]             = useState(false);
  const [ttsLoading, setTtsLoading]         = useState(false);
  const [ttsError, setTtsError]             = useState('');
  const currentAudioRef                     = useRef(null);
  const [printing, setPrinting]             = useState(false);
  const [pitchSent, setPitchSent]           = useState(false);
  const [priorCheck, setPriorCheck]         = useState(null); // null | 'loading' | { status, summary }
  const [speakingMsgId, setSpeakingMsgId]   = useState(null);
  const isIOS     = isIOSDevice();
  const pitchGate = getPitchGate(businessId);
  const isBizPlan = task.id === 'biz-plan';
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // AI-generated printable artifacts — sends chat context to Claude, gets back printable HTML
  const generatePrintable = async (artifactType) => {
    if (!isConfigured || !supabase) return;
    setPrinting(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
          body: JSON.stringify({
            messages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            childName: child.name, childAge: child.age,
            coachName: child.coachName,
            taskTitle: task.title,
            priorContext: getPriorTaskContext(businessId, task.id),
            childId: child.id, businessId, taskId: task.id,
            callType: 'artifact', artifactType,
          }),
        }
      );
      const json = await res.json();
      if (json.html) {
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>${artifactType} — ${child.name}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  body { font-family: Georgia, serif; max-width: 680px; margin: 32px auto; font-size: 14px; line-height: 1.65; color: #1e293b; }
  h1, h2, h3 { font-family: sans-serif; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 700; font-size: 13px; }
  @page { margin: 0.8in; }
</style>
</head><body>${json.html}
<div class="no-print" style="margin-top:32px;text-align:center">
  <button onclick="window.print()" style="background:#4F46E5;color:#fff;font-weight:700;padding:10px 28px;border:none;border-radius:8px;font-size:14px;cursor:pointer">🖨️ Print</button>
</div>
</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 400);
      }
    } catch (_) {}
    finally { setPrinting(false); }
  };

  // Pitch submission — sends pitch notification to parent
  const handleSubmitPitch = () => {
    const gateLabel = { informal: 'Informal pitch', written: 'Written business plan', shark_tank: 'Shark Tank pitch' }[pitchGate.gateType] || 'Pitch';
    const msg = `${child.name} has submitted their ${gateLabel} and is ready for your review! Budget requested: $${pitchGate.budget}.${pitchGate.criteria ? ` Your criteria: "${pitchGate.criteria}"` : ''}`;
    addNotification(familyId, {
      childId: child.id, childName: child.name,
      businessId, businessName: '',
      taskId: task.id, taskTitle: task.title,
      message: msg,
      isPitch: true, pitchBudget: pitchGate.budget,
    });
    sendEmailNotification({
      type: 'ask_parent',
      childName: child.name, childAge: child.age,
      taskTitle: `${gateLabel} — ready for review`,
      message: msg,
    });
    setPitchSent(true);
  };

  // Stop audio when TTS is toggled off; clean up on unmount
  useEffect(() => {
    return () => { currentAudioRef.current?.pause(); };
  }, []);

  const stopAudio = () => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setSpeaking(false); setSpeakingMsgId(null); setTtsLoading(false);
  };
  const showTtsError = (msg) => { setTtsError(msg); setTimeout(() => setTtsError(''), 5000); };

  const toggleTts = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    saveChildTtsEnabled(child.id, next);
    if (!next) stopAudio();
  };

  const changeVoice = (id) => {
    setSelectedVoice(id);
    saveChildVoiceName(child.id, id);
    // Preview the new voice immediately so the kid can hear it
    playTTS(`Hi ${child.name}! Ready to build your business?`);
  };

  // OpenAI TTS — streams MP3 from edge function, plays via Audio element.
  // Falls back to browser SpeechSynthesis in demo/offline mode.
  const playTTS = async (text, msgId = null) => {
    if (!ttsEnabled) return;
    stopAudio();

    if (!isConfigured || !supabase) {
      // Demo fallback: browser synth (still robotic, but works offline)
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.88;
      u.onstart = () => { setSpeaking(true); setSpeakingMsgId(msgId); };
      u.onend   = () => { setSpeaking(false); setSpeakingMsgId(null); };
      synth.speak(u);
      return;
    }

    setTtsLoading(true);
    setSpeakingMsgId(msgId);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) { stopAudio(); return; }

      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/tts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
          body: JSON.stringify({ text, voice: selectedVoice }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const msg = errJson.error || `HTTP ${res.status}`;
        console.error('TTS error:', msg);
        showTtsError(msg.includes('OPENAI_API_KEY') ? 'Add OPENAI_API_KEY to Supabase secrets' : `Voice unavailable: ${msg}`);
        stopAudio();
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) { console.error('TTS: empty audio blob'); stopAudio(); return; }

      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onplay  = () => { setSpeaking(true); setTtsLoading(false); };
      audio.onended = () => { stopAudio(); URL.revokeObjectURL(url); };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        showTtsError('Audio failed to play — tap Hear to retry');
        stopAudio();
        URL.revokeObjectURL(url);
      };

      try {
        await audio.play();
      } catch (playErr) {
        // Browser autoplay policy blocks async audio — user must tap Hear
        console.error('audio.play() blocked:', playErr.name, playErr.message);
        showTtsError('Tap "Hear" on a message to hear the voice');
        stopAudio();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('playTTS error:', err);
      showTtsError(`Voice error: ${err.message || 'unknown'}`);
      stopAudio();
    }
  };

  // Persist chat after every exchange
  useEffect(() => { saveChatHistory(businessId, task.id, messages); }, [messages, businessId, task.id]);

  // Prior-work check — fires once on mount when task has no prior chat but has prior context
  // Asks Claude if the task appears to already be resolved from prior task conversations.
  useEffect(() => {
    if (!isConfigured || !supabase || hasUserMsg || !priorCtx || task.id === 'op-spot') return;
    let cancelled = false;
    const runCheck = async () => {
      setPriorCheck('loading');
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;
        const res = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
            body: JSON.stringify({
              messages: [],
              childName: child.name, childAge: child.age,
              taskTitle: task.title,
              priorContext: priorCtx,
              childId: child.id, businessId, taskId: task.id,
              callType: 'task-check',
            }),
          }
        );
        const json = await res.json();
        if (!cancelled && json.assessment && json.assessment.status !== 'unclear') {
          setPriorCheck(json.assessment);
        } else if (!cancelled) {
          setPriorCheck(null);
        }
      } catch (_) {
        if (!cancelled) setPriorCheck(null);
      }
    };
    runCheck();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    stopAudio(); // stop any ongoing coach speech when kid sends
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
                childConfig: getChildConfig(child.id),
                businessNotes: getBizNotes(businessId),
                childId: child.id,
                businessId,
                taskId: task.id,
                callType: 'chat',
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
      const newMsgId = Date.now() + 1;
      setMessages((p) => [...p, { id: newMsgId, role: 'assistant', content: reply }]);
      setLoading(false);
      // iOS blocks Audio.play() from async callbacks — iOS users tap the Hear button instead
      if (reply && !isIOS) playTTS(reply, newMsgId);
    }, reply === null ? 0 : 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">

        {/* Ask-parent overlay — sits on top of the task modal */}
        {showAskParent && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="font-bold text-slate-900 text-lg mb-1">Ask a parent</h2>
              <p className="text-sm text-slate-500 mb-4">
                During <strong>{task.title}</strong> — your parent will see this in Settings.
              </p>
              {askParentSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-900">Sent!</p>
                  <p className="text-sm text-slate-500 mt-1">Keep going — your parent will check in soon.</p>
                  <button
                    onClick={() => { setShowAskParent(false); setAskParentSent(false); setAskParentMsg(''); }}
                    className="mt-4 inline-flex items-center px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"
                  >
                    Back to task
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    value={askParentMsg}
                    onChange={(e) => setAskParentMsg(e.target.value)}
                    placeholder={`e.g. Can you take me to the store to check prices? I need to finish the ${task.title} step.`}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        const msg = askParentMsg.trim() || `Help needed on: ${task.title}`;
                        addNotification(familyId, {
                          childId: child.id, childName: child.name,
                          businessId, businessName: '',
                          taskId: task.id, taskTitle: task.title,
                          message: msg,
                        });
                        sendEmailNotification({
                          type: 'ask_parent',
                          childName: child.name, childAge: child.age,
                          taskTitle: task.title, message: msg,
                        });
                        setAskParentSent(true);
                      }}
                      disabled={!askParentMsg.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition"
                    >
                      Send to parent
                    </button>
                    <button
                      onClick={() => { setShowAskParent(false); setAskParentMsg(''); }}
                      className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
            <button onClick={() => setShowAskParent(true)} title="Ask a parent for help" className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition">
              <Bell size={18} />
            </button>
            {window.speechSynthesis && (
              <button onClick={toggleTts} title={ttsEnabled ? 'Mute coach voice' : 'Hear coach speak'} className={`shrink-0 p-1.5 rounded-lg transition ${ttsEnabled ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100 text-slate-500'}`}>
                {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            )}
            <button onClick={handlePrint} title="Print worksheet" className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><Printer size={18} /></button>
            <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X size={18} /></button>
          </div>
        </div>

        {/* Voice picker — shown when TTS is on */}
        {ttsEnabled && (
          <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-1.5">
              <Volume2 size={12} /> Voice:
            </span>
            <select
              value={selectedVoice}
              onChange={(e) => changeVoice(e.target.value)}
              className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
            >
              {OPENAI_VOICES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            {ttsError ? (
              <span className="text-xs text-rose-600 shrink-0 font-medium">{ttsError}</span>
            ) : isIOS ? (
              <span className="text-xs text-slate-400 shrink-0">Tap "Hear" on any message</span>
            ) : ttsLoading ? (
              <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" /> Loading…
              </span>
            ) : speaking ? (
              <span className="text-xs text-brand-600 font-semibold shrink-0 flex items-center gap-1 animate-pulse">
                <Volume2 size={12} /> Speaking…
              </span>
            ) : null}
          </div>
        )}

        {/* Prior-work check banner — appears when Claude detects the task was already done */}
        {priorCheck && priorCheck !== 'loading' && (
          <div className={`px-5 py-3 border-b flex items-start gap-3 ${
            priorCheck.status === 'done'
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-amber-50 border-amber-100'
          }`}>
            <CheckCircle2
              size={16}
              className={`shrink-0 mt-0.5 ${priorCheck.status === 'done' ? 'text-emerald-600' : 'text-amber-500'}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold mb-0.5 ${priorCheck.status === 'done' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {priorCheck.status === 'done'
                  ? 'Looks like you already finished this! 🎉'
                  : "You've already started this one"}
              </p>
              <p className={`text-xs leading-relaxed ${priorCheck.status === 'done' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {priorCheck.summary}
              </p>
              {priorCheck.status === 'done' && (
                <p className="text-xs text-emerald-600 mt-1">
                  Does that still hold? If so, just mark it done — no need to redo the whole thing.
                </p>
              )}
            </div>
            {priorCheck.status === 'done' && (
              <button
                onClick={() => { onMarkDone(task.id, phaseKey); onClose(); }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition whitespace-nowrap"
              >
                <CheckCircle2 size={12} /> Mark done
              </button>
            )}
          </div>
        )}
        {priorCheck === 'loading' && (
          <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shrink-0" />
            <p className="text-xs text-slate-400">Checking your prior work…</p>
          </div>
        )}

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
              <div className="flex flex-col items-start max-w-md">
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap w-full ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-card'}`}>
                  {msg.content}
                </div>
                {/* Per-message Hear button — primary on iOS (gesture required), convenience replay on desktop */}
                {msg.role === 'assistant' && ttsEnabled && (
                  <button
                    onClick={() => speakingMsgId === msg.id ? stopAudio() : playTTS(msg.content, msg.id)}
                    title={speakingMsgId === msg.id ? 'Stop' : 'Hear this message'}
                    className={`mt-1 ml-1 flex items-center gap-1 text-xs transition rounded-full px-2 py-0.5 ${
                      speakingMsgId === msg.id
                        ? ttsLoading
                          ? 'text-slate-400 bg-slate-100'
                          : 'text-brand-600 bg-brand-50 animate-pulse'
                        : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Volume2 size={12} />
                    {speakingMsgId === msg.id ? (ttsLoading ? 'Loading…' : 'Stop') : 'Hear'}
                  </button>
                )}
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
          {/* Task-specific printable helpers — appear once the kid has some context */}
          {messages.filter((m) => m.role === 'user').length >= 2 && (
            <div className="flex flex-wrap gap-2">
              {task.id === 'cost-breakdown' && (
                <button
                  onClick={() => isConfigured && supabase ? generatePrintable('price-check') : (() => {
                    const items = messages.filter((m) => m.role === 'user').map((m) => `<li>${m.content}</li>`).join('');
                    const w = window.open('', '_blank');
                    w.document.write(`<!DOCTYPE html><html><head><title>Price Check — ${child.name}</title><style>body{font-family:sans-serif;max-width:500px;margin:40px auto;font-size:14px}li{margin:8px 0}</style></head><body><h2>Price Check List</h2><p><em>${child.name}'s notes</em></p><ul>${items}</ul></body></html>`);
                    w.document.close(); w.print();
                  })()}
                  disabled={printing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <Printer size={14} /> {printing ? 'Generating…' : 'Print price-check list'}
                </button>
              )}
              {task.id === 'interviews' && (
                <button
                  onClick={() => generatePrintable('interview-sheet')}
                  disabled={printing || !isConfigured}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <Printer size={14} /> {printing ? 'Generating…' : 'Print interview sheet'}
                </button>
              )}
              {task.id === 'production-ramp' && (
                <button
                  onClick={() => generatePrintable('production-tracker')}
                  disabled={printing || !isConfigured}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <Printer size={14} /> {printing ? 'Generating…' : 'Print production tracker'}
                </button>
              )}
              {isBizPlan && (
                <button
                  onClick={() => generatePrintable('business-plan')}
                  disabled={printing || !isConfigured}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-300 text-violet-700 text-xs font-semibold hover:bg-violet-50 disabled:opacity-50 transition"
                >
                  <Printer size={14} /> {printing ? 'Generating…' : 'Print business plan'}
                </button>
              )}
              {coachCfg.amazonLinks && task.id === 'cost-breakdown' && (
                <button onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(child.name + ' craft supplies')}`, '_blank')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"><Search size={14} /> Search Amazon</button>
              )}
            </div>
          )}
          {/* Shark Tank pitch gate — submit button for biz-plan when parent has set a gate */}
          {isBizPlan && pitchGate.gateType !== 'none' && !isPitchApproved(businessId) && messages.filter((m) => m.role === 'user').length >= 3 && (
            <div className={`rounded-xl border p-4 ${pitchSent ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              {pitchSent ? (
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={16} />
                  <div>
                    <p className="font-semibold text-sm">Pitch submitted!</p>
                    <p className="text-xs mt-0.5">Your parent will review it and approve your funding. Keep working in the meantime!</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                    <Lock size={12} /> Funding locked — parent review required
                  </p>
                  <p className="text-xs text-amber-700 mb-3">
                    Your parent wants you to submit a{' '}
                    <strong>{{ informal: 'verbal pitch summary', written: 'written business plan', shark_tank: 'Shark Tank-style pitch' }[pitchGate.gateType]}</strong>{' '}
                    before releasing your ${pitchGate.budget} budget.
                  </p>
                  <div className="flex gap-2">
                    {isBizPlan && (
                      <button
                        onClick={() => generatePrintable('business-plan')}
                        disabled={printing || !isConfigured}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition"
                      >
                        <Printer size={12} /> {printing ? 'Generating…' : 'Preview plan first'}
                      </button>
                    )}
                    <button
                      onClick={handleSubmitPitch}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
                    >
                      🦈 Submit pitch to parents
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {isPitchApproved(businessId) && isBizPlan && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Unlock size={13} /> Parent approved — ${pitchGate.budget} funding unlocked! 🎉
            </div>
          )}
          {showDone && (
            <button onClick={() => { onMarkDone(task.id, phaseKey); onClose(); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition">
              <CheckCircle2 size={18} /> Mark as done — move to Done column
            </button>
          )}
          {/* Suggestion chips — shown for first 5 user messages so kids have starters handy */}
          {(() => {
            const userMsgCount = messages.filter((m) => m.role === 'user').length;
            const chips = STUCK_SUGGESTIONS[task.id] || [];
            if (userMsgCount >= 5 || chips.length === 0 || loading) return null;
            return (
              <div className="flex gap-2 overflow-x-auto pb-0.5 -mb-0.5" style={{ scrollbarWidth: 'none' }}>
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { setInput(chip); }}
                    className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-medium hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            );
          })()}
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
  const [sideTts, setSideTts]                     = useState(() => getChildTtsEnabled(child.id));
  const [sideVoices, setSideVoices]               = useState([]);
  const [sideVoiceName, setSideVoiceName]         = useState(() => getChildVoiceName(child.id));
  const [sideSpeaking, setSideSpeaking]           = useState(false);
  const messagesEndRef    = useRef(null);
  const sidebarRecRef     = useRef(null);

  // Load TTS voices for sidebar
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      const en = synth.getVoices().filter((v) => v.lang.startsWith('en'));
      setSideVoices(en);
      setSideVoiceName((prev) => {
        if (prev && en.find((v) => v.name === prev)) return prev;
        const def = en.find((v) => v.default) || en[0];
        if (def) { saveChildVoiceName(child.id, def.name); return def.name; }
        return prev;
      });
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => { synth.removeEventListener('voiceschanged', load); synth.cancel(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSideTts = () => {
    const next = !sideTts;
    setSideTts(next);
    saveChildTtsEnabled(child.id, next);
    if (!next) window.speechSynthesis?.cancel();
  };
  const changeSideVoice = (name) => {
    setSideVoiceName(name);
    saveChildVoiceName(child.id, name);
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(`Hi ${child.name}! Ask me anything.`);
    const v = sideVoices.find((vv) => vv.name === name);
    if (v) u.voice = v;
    u.rate = 0.88;
    synth.speak(u);
  };
  const speakSideReply = (text) => {
    const synth = window.speechSynthesis;
    if (!synth || !sideTts) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = sideVoices.find((vv) => vv.name === sideVoiceName) || sideVoices[0];
    if (v) u.voice = v;
    u.rate = 0.88;
    u.onstart = () => setSideSpeaking(true);
    u.onend   = () => setSideSpeaking(false);
    synth.speak(u);
  };

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
    const msg = parentRequestMsg.trim();
    addNotification(familyId, {
      childId: child.id, childName: child.name,
      businessId: business.id, businessName: business.name,
      message: msg,
    });
    sendEmailNotification({
      type: 'ask_parent',
      childName: child.name, childAge: child.age,
      businessName: business.name, message: msg,
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

  const handleMarkDone  = (taskId, phaseKey) => {
    updateTaskStatus(taskId, phaseKey, 'done');
    // Find the task title for the notification
    const taskObj = CURRICULUM_TASKS[phaseKey]?.tasks.find((t) => t.id === taskId);
    sendEmailNotification({
      type: 'task_done',
      childName: child.name, childAge: child.age,
      businessName: business.name,
      taskTitle: taskObj?.title || taskId,
    });
  };
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
    window.speechSynthesis?.cancel();
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
                childConfig: getChildConfig(child.id),
                businessNotes: getBizNotes(business.id),
                childId: child.id,
                businessId: business.id,
                taskId: null,
                callType: 'chat',
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
    if (reply) speakSideReply(reply);
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
            <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0"><MessageCircle size={16} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 leading-tight">Ask {child.coachName} anything</p>
              {sideTts && sideVoices.length > 0 ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Volume2 size={10} className="text-brand-500 shrink-0" />
                  <select
                    value={sideVoiceName}
                    onChange={(e) => changeSideVoice(e.target.value)}
                    className="text-xs px-1.5 py-0.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition w-full"
                  >
                    {sideVoices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                  {sideSpeaking && <span className="text-[10px] text-brand-600 font-semibold shrink-0 animate-pulse">Speaking…</span>}
                </div>
              ) : (
                <p className="text-xs text-slate-500">General questions, brainstorming, quick advice</p>
              )}
            </div>
            {window.speechSynthesis && (
              <button onClick={toggleSideTts} title={sideTts ? 'Mute coach voice' : 'Hear coach speak'} className={`shrink-0 p-1.5 rounded-lg transition ${sideTts ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100 text-slate-500'}`}>
                {sideTts ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            )}
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
                  {/* Funding gate status */}
                  {(() => {
                    const gate = getPitchGate(biz.id);
                    if (gate.gateType === 'none') return null;
                    const approved = isPitchApproved(biz.id);
                    return (
                      <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {approved ? <Unlock size={11} /> : <Lock size={11} />}
                        {approved ? `$${gate.budget} unlocked!` : `Pitch required for $${gate.budget}`}
                      </div>
                    );
                  })()}
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
  const [showAddChild, setShowAddChild]     = useState(false);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [newChildName, setNewChildName]     = useState('');
  const [newChildAge, setNewChildAge]       = useState('');
  const [newChildPin, setNewChildPin]       = useState('');
  const [newCoachName, setNewCoachName]     = useState('Claude');
  const [addingChild, setAddingChild]       = useState(false);
  const lsKey = `kb_children_${session?.user?.id || 'demo'}`;

  const planTier   = family?.plan_tier || 'free';
  const childLimit = PLAN_LIMITS[planTier] ?? 1;
  const atLimit    = children.length >= childLimit;

  const handleAddChildClick = () => {
    if (atLimit) setShowUpgradeGate(true);
    else setShowAddChild(true);
  };

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
      {showUpgradeGate && (
        <UpgradeModal
          reason={`The ${PLAN_INFO[planTier]?.name || 'Free'} plan supports ${childLimit} child${childLimit === 1 ? '' : 'ren'}. Upgrade to add more.`}
          onClose={() => setShowUpgradeGate(false)}
        />
      )}
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
          <button onClick={handleAddChildClick} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"><Plus size={16} /> Add child</button>
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
        ) : children.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-brand-200 p-12 text-center shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center mx-auto mb-4 text-3xl">🧒</div>
            <h3 className="font-bold text-slate-900 text-lg">Add your first child to get started</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Each child gets their own business, AI coach, and curriculum. You stay in control from Settings.</p>
            <button onClick={() => setShowAddChild(true)} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition">
              <Plus size={16} /> Add first child
            </button>
          </div>
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
  const { session, family, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [config, setConfig] = useState({ budgetMin: 50, budgetMax: 500, timelines: { phase0: '2026-05-16', phase1: '2026-05-31', phase2: '2026-06-07', phase3: '2026-06-21', phase4: '2026-06-30' }, integrations: { claude: false, googleDrive: false, n8n: false, obsidian: false } });
  const [budgetMin, setBudgetMin] = useState(50);
  const [budgetMax, setBudgetMax] = useState(500);
  const [apiKey, setApiKey]       = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications]   = useState([]);
  const [coachCfg, setCoachCfgState]        = useState(() => getCoachConfig(session?.user?.id || 'demo'));
  const [usageStats, setUsageStats]         = useState(null);
  const [progressData, setProgressData]     = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [expandedProfiles, setExpandedProfiles] = useState({});  // childId → bool
  const [expandedBizNotes, setExpandedBizNotes] = useState({});  // bizId → bool
  const [childCfgDraft, setChildCfgDraft]   = useState({});      // childId → cfg obj
  const [bizNotesDraft, setBizNotesDraft]   = useState({});      // bizId → string
  const [pitchGateDraft, setPitchGateDraft] = useState({});      // bizId → gate cfg
  const [summaries, setSummaries]           = useState({});      // bizId → { loading, text }

  const updateCoachCfg = (partial) => {
    const next = { ...coachCfg, ...partial };
    setCoachCfgState(next);
    saveCoachConfig(session?.user?.id || 'demo', next);
  };

  const generateSummary = async (child, business) => {
    setSummaries((prev) => ({ ...prev, [business.id]: { loading: true, text: null } }));
    try {
      if (!isConfigured || !supabase) {
        setSummaries((prev) => ({ ...prev, [business.id]: { loading: false, text: 'Summary requires a Supabase connection.' } }));
        return;
      }
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      // Collect chat excerpts for every task in this business
      const excerpts = Object.values(CURRICULUM_TASKS)
        .flatMap((p) => p.tasks)
        .map((t) => {
          const history = getChatHistory(business.id, t.id);
          if (!history) return null;
          const userMsgs = history.filter((m) => m.role === 'user');
          if (userMsgs.length === 0) return null;
          const lastAsst = [...history].reverse().find((m) => m.role === 'assistant');
          const kidLines = userMsgs.slice(0, 3).map((m) => `Kid: ${m.content.slice(0, 200)}`).join('\n');
          const coachLine = lastAsst ? `Coach: ${lastAsst.content.slice(0, 200)}` : '';
          return `[${t.title}]\n${kidLines}${coachLine ? '\n' + coachLine : ''}`;
        })
        .filter(Boolean)
        .join('\n\n');

      const childCfg = { ...DEFAULT_CHILD_CONFIG, ...(childCfgDraft[child.id] || getChildConfig(child.id)) };
      const bizNotes = bizNotesDraft[business.id] ?? getBizNotes(business.id);

      const summaryPrompt = `Write a warm, clear progress summary for the parents of ${child.name} (age ${child.age}${childCfg.grade ? `, grade ${childCfg.grade}` : ''}) about their business "${business.name}".${bizNotes ? `\n\nParent notes about this business: ${bizNotes}` : ''}${childCfg.accommodations ? `\nAccommodations / learning notes: ${childCfg.accommodations}` : ''}

COACHING SESSION EXCERPTS:
${excerpts || 'No coaching sessions have been completed yet for this business.'}

Format your response with these sections (use bold headers):
**📊 Progress Snapshot** — pace, overall status, how far along they are
**⭐ Highlights** — 2–3 specific things they did well or showed insight on
**💬 Memorable Moments** — something endearing, funny, or revealing they said (skip if nothing stands out)
**⚠️ Observations** — any concerns, blockers, or patterns worth noting (omit section entirely if none)
**💡 Parent Guidance** — 2–3 concrete things the parent can do to help right now

Keep it under 300 words. Be honest but encouraging.`;

      const res = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: summaryPrompt }],
          childName: child.name, childAge: child.age, coachName: 'Coach',
          taskTitle: '__PARENT_SUMMARY__',
          childId: child.id, businessId: business.id, taskId: null, callType: 'chat',
          summaryMode: true,
        }),
      });
      const json = await res.json();
      setSummaries((prev) => ({ ...prev, [business.id]: { loading: false, text: json.reply || 'Unable to generate summary. Please try again.' } }));
    } catch (e) {
      setSummaries((prev) => ({ ...prev, [business.id]: { loading: false, text: 'Error generating summary. Please try again.' } }));
    }
  };

  const [notifPrefs, setNotifPrefs]         = useState(null); // loaded from DB
  const [notifSaving, setNotifSaving]       = useState(false);
  const [notifSaved, setNotifSaved]         = useState(false);

  // Load notification prefs when tab opens
  useEffect(() => {
    if (activeTab !== 'notifications' || notifPrefs || !isConfigured || !supabase || !session) return;
    supabase.from('families')
      .select('notify_email, notify_on_request, notify_on_task_done, notify_on_summary')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setNotifPrefs({
          notify_email:        data?.notify_email        || session.user.email || '',
          notify_on_request:   data?.notify_on_request   ?? true,
          notify_on_task_done: data?.notify_on_task_done ?? false,
          notify_on_summary:   data?.notify_on_summary   ?? false,
        });
      });
  }, [activeTab, notifPrefs, session]);

  const saveNotifPrefs = async () => {
    if (!notifPrefs || !isConfigured || !supabase || !session) return;
    setNotifSaving(true);
    await supabase.from('families').update({
      notify_email:        notifPrefs.notify_email,
      notify_on_request:   notifPrefs.notify_on_request,
      notify_on_task_done: notifPrefs.notify_on_task_done,
      notify_on_summary:   notifPrefs.notify_on_summary,
    }).eq('id', session.user.id);
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  };

  const tabs = [
    { id: 'progress',      label: 'Progress',      Icon: BarChart3   },
    { id: 'requests',      label: 'Requests',       Icon: Bell        },
    { id: 'notifications', label: 'Notifications',  Icon: Bell        },
    { id: 'coach',         label: 'AI Coach',       Icon: Sparkles    },
    { id: 'timeline',      label: 'Timeline',       Icon: Calendar    },
    { id: 'budget',        label: 'Budget',         Icon: DollarSign  },
    { id: 'integrations',  label: 'Integrations',   Icon: LinkIcon    },
  ];

  // Load progress data when the tab is shown
  useEffect(() => {
    if (activeTab !== 'progress' || !isConfigured || !supabase || !session || progressData || loadingProgress) return;
    setLoadingProgress(true);
    const famId = session.user.id;
    const totalTasks = Object.values(CURRICULUM_TASKS).reduce((s, p) => s + p.tasks.length, 0);

    Promise.all([
      supabase.from('children').select('*').eq('family_id', famId).order('created_at'),
      supabase.from('businesses').select('*').eq('family_id', famId).order('created_at'),
      supabase.from('task_states').select('*').eq('family_id', famId),
    ]).then(([{ data: kids }, { data: bizzes }, { data: states }]) => {
      const allKids  = kids   || [];
      const allBizzes = bizzes || [];
      const allStates = states || [];

      const result = allKids.map((child) => {
        const childBizzes = allBizzes.filter((b) => b.child_id === child.id);
        return {
          child,
          businesses: childBizzes.map((biz) => {
            const bizStates = allStates.filter((s) => s.business_id === biz.id);
            const doneSet   = new Set(bizStates.filter((s) => s.status === 'done').map((s) => s.task_id));
            const phases = Object.entries(CURRICULUM_TASKS).map(([key, phase]) => {
              const done = phase.tasks.filter((t) => doneSet.has(t.id)).length;
              return {
                key, label: phase.label, short: phase.short, accent: phase.accent,
                total: phase.tasks.length, done,
                status: done === 0 ? 'todo' : done === phase.tasks.length ? 'done' : 'inprogress',
              };
            });
            const lastState = [...bizStates].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
            return {
              business: biz, phases,
              totalTasks, doneTasks: doneSet.size,
              pct: Math.round((doneSet.size / totalTasks) * 100),
              lastActivity: lastState?.updated_at || biz.created_at,
            };
          }),
        };
      });
      setProgressData(result);
      setLoadingProgress(false);
    });
  }, [activeTab, session, progressData, loadingProgress]);

  useEffect(() => {
    const famId = session?.user?.id || 'demo';
    setNotifications(getNotifications(famId));
    // Load usage stats from Supabase
    if (isConfigured && supabase && session) {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      supabase
        .from('usage_logs')
        .select('cost_usd, input_tokens, cached_tokens, output_tokens, call_type, created_at')
        .eq('family_id', famId)
        .then(({ data }) => {
          if (!data) return;
          const month = data.filter(r => new Date(r.created_at) >= monthStart);
          setUsageStats({
            totalMessages:  data.length,
            monthMessages:  month.length,
            totalCost:      data.reduce((s, r) => s + parseFloat(r.cost_usd), 0),
            monthCost:      month.reduce((s, r) => s + parseFloat(r.cost_usd), 0),
            totalTokens:    data.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0),
          });
        });
    }
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
        {/* Plan banner */}
        {(() => {
          const tier  = family?.plan_tier || 'free';
          const info  = PLAN_INFO[tier];
          const isPaid = tier !== 'free';
          return (
            <div className={`rounded-xl border p-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isPaid ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-200 shadow-card'}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isPaid ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{info.name} Plan</span>
                <p className="text-sm text-slate-600">{info.childLabel} · {isPaid ? info.price : 'Free forever'}</p>
              </div>
              <div className="flex gap-2">
                {isPaid ? (
                  <button onClick={openBillingPortal} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 font-semibold text-sm hover:bg-brand-100 transition">Manage billing</button>
                ) : (
                  <>
                    <button onClick={() => startCheckout('family')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition">Family — $12/mo</button>
                    <button onClick={() => startCheckout('class')}  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">Class — $29/mo</button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 mb-8">Configure timelines, budgets, and integrations for your family.</p>
        <div className="border-b border-slate-200 mb-8 flex gap-1 overflow-x-auto">
          {tabs.map((t) => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><t.Icon size={16} />{t.label}</button>)}
        </div>

        {activeTab === 'progress' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Child progress</h2>
                <p className="text-sm text-slate-500 mt-0.5">Phase-by-phase view of each child's business journey.</p>
              </div>
              <button onClick={() => setProgressData(null)} className="text-xs text-brand-600 hover:underline">Refresh</button>
            </div>

            {loadingProgress ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" /></div>
            ) : !progressData || progressData.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-card">
                <p className="text-2xl mb-2">🧒</p>
                <p className="font-semibold text-slate-700">No children added yet</p>
                <p className="text-sm text-slate-500 mt-1">Go back and add a child to get started.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {progressData.map(({ child, businesses }) => (
                  <div key={child.id}>
                    {/* Child header + coaching profile toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700 flex items-center justify-center font-bold text-lg ring-1 ring-brand-200">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{child.name}</p>
                          <p className="text-xs text-slate-500">Age {child.age} · Coach: {child.coach_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedProfiles((prev) => ({ ...prev, [child.id]: !prev[child.id] }))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        <Settings size={12} />
                        {expandedProfiles[child.id] ? 'Hide coaching profile' : 'Edit coaching profile'}
                      </button>
                    </div>

                    {/* Coaching profile form */}
                    {expandedProfiles[child.id] && (() => {
                      const cfg = childCfgDraft[child.id] ?? getChildConfig(child.id);
                      const update = (field, value) => {
                        const updated = { ...cfg, [field]: value };
                        setChildCfgDraft((prev) => ({ ...prev, [child.id]: updated }));
                        saveChildConfig(child.id, updated);
                      };
                      return (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 mb-4 space-y-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Settings size={14} className="text-sky-600" />
                            <p className="text-sm font-semibold text-sky-900">Coaching Profile — {child.name}</p>
                          </div>
                          <p className="text-xs text-sky-700 -mt-3">These details help the AI coach adapt its approach for {child.name}. Changes take effect on the next message.</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Grade level</label>
                              <input type="text" value={cfg.grade} onChange={(e) => update('grade', e.target.value)} placeholder="e.g. 4th grade" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Learning style</label>
                              <select value={cfg.learningStyle} onChange={(e) => update('learningStyle', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition bg-white">
                                <option value="">Not specified</option>
                                <option value="visual">Visual (diagrams, charts)</option>
                                <option value="auditory">Auditory (talking it through)</option>
                                <option value="reading">Reading / writing</option>
                                <option value="kinesthetic">Kinesthetic / hands-on</option>
                                <option value="mixed">Mixed</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Learning accommodations or disabilities</label>
                              <input type="text" value={cfg.accommodations} onChange={(e) => update('accommodations', e.target.value)} placeholder="e.g. ADHD — short tasks, frequent encouragement; dyslexia — simple words" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Sensitivities to avoid</label>
                              <input type="text" value={cfg.sensitivities} onChange={(e) => update('sensitivities', e.target.value)} placeholder="e.g. gets frustrated easily with math" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Skills to develop</label>
                              <input type="text" value={cfg.focusAreas} onChange={(e) => update('focusAreas', e.target.value)} placeholder="e.g. confidence, math, public speaking" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Parent notes (general)</label>
                              <textarea value={cfg.parentNotes} onChange={(e) => update('parentNotes', e.target.value)} placeholder="Anything else the coach should know about your child…" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none" />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {businesses.length === 0 ? (
                      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                        No businesses started yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {businesses.map(({ business, phases, totalTasks, doneTasks, pct, lastActivity }) => {
                          const relativeTime = (() => {
                            const diff = Math.floor((Date.now() - new Date(lastActivity)) / 60000);
                            if (diff < 2)   return 'Just now';
                            if (diff < 60)  return `${diff}m ago`;
                            if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
                            return `${Math.floor(diff / 1440)}d ago`;
                          })();

                          return (
                            <div key={business.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
                              {/* Business header row */}
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                  <p className="font-bold text-slate-900 text-base">{business.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">Last activity: {relativeTime}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-2xl font-extrabold text-brand-600">{pct}%</p>
                                  <p className="text-xs text-slate-500">{doneTasks}/{totalTasks} tasks</p>
                                </div>
                              </div>

                              {/* Overall progress bar */}
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
                                <div
                                  className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                                  style={{ width: `${Math.max(2, pct)}%` }}
                                />
                              </div>

                              {/* Phase chips */}
                              <div className="grid grid-cols-5 gap-2">
                                {phases.map((phase) => (
                                  <div key={phase.key} className={`rounded-lg p-2.5 text-center border ${
                                    phase.status === 'done'       ? 'bg-emerald-50 border-emerald-200' :
                                    phase.status === 'inprogress' ? 'bg-amber-50 border-amber-200' :
                                                                    'bg-slate-50 border-slate-200'
                                  }`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                                      phase.status === 'done'       ? 'text-emerald-700' :
                                      phase.status === 'inprogress' ? 'text-amber-700' :
                                                                      'text-slate-400'
                                    }`}>{phase.short}</p>
                                    <p className={`text-sm font-extrabold ${
                                      phase.status === 'done'       ? 'text-emerald-600' :
                                      phase.status === 'inprogress' ? 'text-amber-600' :
                                                                      'text-slate-400'
                                    }`}>{phase.done}/{phase.total}</p>
                                    {phase.status === 'done' && (
                                      <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">✓ Done</p>
                                    )}
                                    {phase.status === 'inprogress' && (
                                      <p className="text-[9px] text-amber-600 font-semibold mt-0.5">In progress</p>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Budget + launch date quick stats */}
                              {(business.budget || business.launch_date) && (
                                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                                  {business.budget && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <DollarSign size={12} className="text-slate-400" />
                                      Budget: <span className="font-semibold text-slate-700">${business.budget}</span>
                                    </div>
                                  )}
                                  {business.launch_date && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <Calendar size={12} className="text-slate-400" />
                                      Launch: <span className="font-semibold text-slate-700">{new Date(business.launch_date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Parent notes for this business */}
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-slate-500">Parent notes for AI coach</p>
                                  <button
                                    onClick={() => setExpandedBizNotes((prev) => ({ ...prev, [business.id]: !prev[business.id] }))}
                                    className="text-xs text-brand-600 hover:underline"
                                  >
                                    {expandedBizNotes[business.id] ? 'Collapse' : (getBizNotes(business.id) ? 'Edit notes' : 'Add notes')}
                                  </button>
                                </div>
                                {expandedBizNotes[business.id] ? (
                                  <textarea
                                    value={bizNotesDraft[business.id] ?? getBizNotes(business.id)}
                                    onChange={(e) => {
                                      setBizNotesDraft((prev) => ({ ...prev, [business.id]: e.target.value }));
                                      saveBizNotes(business.id, e.target.value);
                                    }}
                                    placeholder={`e.g. He's been really excited about this. Encourage him to think about pricing. She mentioned wanting to donate some profits.`}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                                  />
                                ) : (getBizNotes(business.id) || bizNotesDraft[business.id]) ? (
                                  <p className="text-xs text-slate-500 italic truncate">{bizNotesDraft[business.id] ?? getBizNotes(business.id)}</p>
                                ) : (
                                  <p className="text-xs text-slate-400">None — tap "Add notes" to guide the AI coach for this business.</p>
                                )}
                              </div>

                              {/* Funding gate config */}
                              {(() => {
                                const gate = pitchGateDraft[business.id] ?? getPitchGate(business.id);
                                const approved = isPitchApproved(business.id);
                                const updateGate = (field, value) => {
                                  const updated = { ...gate, [field]: value };
                                  setPitchGateDraft((prev) => ({ ...prev, [business.id]: updated }));
                                  savePitchGate(business.id, updated);
                                };
                                return (
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                        {approved ? <Unlock size={11} className="text-emerald-500" /> : <Lock size={11} className="text-amber-500" />}
                                        Funding gate
                                      </p>
                                      {approved && (
                                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Approved!</span>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={gate.gateType}
                                          onChange={(e) => updateGate('gateType', e.target.value)}
                                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                                        >
                                          <option value="none">No gate — just give the money</option>
                                          <option value="informal">Informal pitch — kid explains verbally</option>
                                          <option value="written">Written business plan — submitted via app</option>
                                          <option value="shark_tank">Full Shark Tank — formal pitch presentation</option>
                                        </select>
                                        {gate.gateType !== 'none' && (
                                          <div className="relative shrink-0 w-24">
                                            <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                              type="number"
                                              value={gate.budget}
                                              onChange={(e) => updateGate('budget', parseInt(e.target.value) || 0)}
                                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                                              placeholder="50"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      {gate.gateType !== 'none' && (
                                        <input
                                          type="text"
                                          value={gate.criteria}
                                          onChange={(e) => updateGate('criteria', e.target.value)}
                                          placeholder="Evaluation criteria (optional, e.g. 'must show at least 3 customer interviews')"
                                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* AI progress summary */}
                              <div className="mt-3">
                                {summaries[business.id]?.text ? (
                                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-violet-800 flex items-center gap-1"><Sparkles size={12} /> AI Progress Summary</p>
                                      <button onClick={() => generateSummary(child, business)} className="text-xs text-violet-600 hover:underline">Regenerate</button>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{summaries[business.id].text}</p>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => generateSummary(child, business)}
                                    disabled={summaries[business.id]?.loading}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-300 text-violet-700 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50 transition"
                                  >
                                    <Sparkles size={14} />
                                    {summaries[business.id]?.loading ? 'Generating summary…' : 'Generate AI progress summary'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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
                  <div key={n.id} className={`bg-white rounded-xl border p-4 shadow-card flex items-start justify-between gap-4 ${
                    n.status === 'pending' ? (n.isPitch ? 'border-violet-300' : 'border-amber-200') : 'border-slate-200 opacity-60'
                  }`}>
                    <div className="flex-1 min-w-0">
                      {n.isPitch && (
                        <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1 flex items-center gap-1">🦈 Shark Tank pitch submission</p>
                      )}
                      <p className="font-semibold text-slate-900">{n.childName}{n.taskTitle ? <span className="text-slate-500 font-normal"> — {n.taskTitle}</span> : ''}</p>
                      <p className="text-sm text-slate-700 mt-1">{n.message}</p>
                      {n.isPitch && n.pitchBudget && (
                        <p className="text-xs font-semibold text-violet-700 mt-1 flex items-center gap-1"><DollarSign size={11} /> Budget requested: ${n.pitchBudget}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    {n.status === 'pending' ? (
                      <div className="flex flex-col gap-2 shrink-0">
                        {n.isPitch ? (
                          <>
                            <button
                              onClick={() => {
                                if (n.businessId) setPitchApproved(n.businessId);
                                handleNotifAction(n.id, 'approved');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 transition"
                            >
                              Approve & unlock ${n.pitchBudget || ''}
                            </button>
                            <button onClick={() => handleNotifAction(n.id, 'denied')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition">Not yet</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleNotifAction(n.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition">Approve</button>
                            <button onClick={() => handleNotifAction(n.id, 'denied')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition">Deny</button>
                          </>
                        )}
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

        {activeTab === 'notifications' && (
          <section className="space-y-5 max-w-lg">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Email notifications</h2>
              <p className="text-slate-500 text-sm">Get notified without having to open the app. We'll never spam — only the events you choose.</p>
            </div>

            {!notifPrefs ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-card">
                <p className="text-slate-400 text-sm">Loading…</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-card divide-y divide-slate-100">

                {/* Email address */}
                <div className="p-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notification email</label>
                  <input
                    type="email"
                    value={notifPrefs.notify_email}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">We'll send notifications to this address.</p>
                </div>

                {/* Toggles */}
                {[
                  {
                    key: 'notify_on_request',
                    label: 'Child asks for help',
                    desc: 'Email me when my child taps "Ask a parent" mid-task.',
                    badge: 'Recommended',
                  },
                  {
                    key: 'notify_on_task_done',
                    label: 'Task completed',
                    desc: 'Email me each time my child marks a task as done.',
                    badge: null,
                  },
                  {
                    key: 'notify_on_summary',
                    label: 'Weekly AI progress summary',
                    desc: 'Receive an AI-written summary of each child\'s progress once a week.',
                    badge: null,
                  },
                ].map(({ key, label, desc, badge }) => (
                  <div key={key} className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                        {badge && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">{badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })}
                      role="switch"
                      aria-checked={notifPrefs[key]}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${notifPrefs[key] ? 'bg-brand-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 ${notifPrefs[key] ? 'left-5' : 'left-0.5'} h-5 w-5 rounded-full bg-white shadow transition-all`} />
                    </button>
                  </div>
                ))}

                {/* Save button */}
                <div className="p-5 flex items-center gap-3">
                  <button
                    onClick={saveNotifPrefs}
                    disabled={notifSaving}
                    className="px-5 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition"
                  >
                    {notifSaving ? 'Saving…' : 'Save preferences'}
                  </button>
                  {notifSaved && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 size={15} /> Saved!
                    </span>
                  )}
                </div>
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

// ============ WELCOME / ONBOARDING MODAL ============
function WelcomeModal({ trialStarted, onDone }) {
  const steps = [
    { emoji: '🧒', title: 'Add a child', desc: 'Create a profile with their name, age, and a PIN so they can log in independently.' },
    { emoji: '💼', title: 'Start a business', desc: 'Name it, set a startup budget, and pick a launch date. One business at a time.' },
    { emoji: '🤖', title: 'Get coached', desc: 'Work through 5 phases — from idea to craft fair day — guided by an AI business coach.' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 to-accent-600 px-8 py-7 text-white">
          <div className="flex justify-center mb-3"><Logo size="md" /></div>
          <h1 className="text-2xl font-extrabold text-center mt-2">
            {trialStarted ? '🎉 Your trial has started!' : 'Welcome to KidzBiz!'}
          </h1>
          <p className="text-brand-100 text-sm text-center mt-1">
            {trialStarted
              ? 'Your 14-day free trial is active. Here\'s how to get the most out of it.'
              : 'Help your child build a real business — from idea to first sale.'}
          </p>
        </div>

        {/* Steps */}
        <div className="px-8 py-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">How it works</p>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl shrink-0">{s.emoji}</div>
                <div>
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Parent tip:</strong> KidzBiz is parent-supervised. You control settings, approve requests, and watch progress — all from the Settings button in the top right.
          </div>
        </div>

        {/* CTA */}
        <div className="px-8 pb-7 flex flex-col gap-2">
          <button onClick={onDone} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition">
            Add my first child <ChevronRight size={16} />
          </button>
          <button onClick={onDone} className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition">
            I'll explore first
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PLATFORM ROUTER ============
export default function Platform() {
  const { session } = useAuth();
  const [showParent, setShowParent]     = useState(false);
  const [showWelcome, setShowWelcome]   = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);

  useLayoutEffect(() => {
    const search = window.location.search;
    const isWelcome   = search.includes('welcome=1');
    const isActivated = search.includes('activated=1');

    if (isWelcome || isActivated) {
      setShowWelcome(true);
      setTrialStarted(isActivated);
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  // Also show welcome on very first visit (no URL param needed if they navigated directly)
  useEffect(() => {
    if (!session?.user) return;
    const key = `kb_welcomed_${session.user.id}`;
    if (!localStorage.getItem(key) && !showWelcome) {
      // Only auto-show if they have no children yet (checked lazily — just show it)
      // We don't force it — only URL params trigger it. This is the safeguard.
    }
  }, [session, showWelcome]);

  const handleWelcomeDone = () => {
    if (session?.user) {
      localStorage.setItem(`kb_welcomed_${session.user.id}`, '1');
    }
    setShowWelcome(false);
  };

  return (
    <>
      {showWelcome && <WelcomeModal trialStarted={trialStarted} onDone={handleWelcomeDone} />}
      {showParent
        ? <ParentConsole onBack={() => setShowParent(false)} />
        : <FamilyHub onOpenParent={() => setShowParent(true)} />
      }
    </>
  );
}
