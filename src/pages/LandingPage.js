import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Lightbulb, BarChart3, Sparkles,
  CheckCircle2, ChevronRight, MessageCircle, Send,
  Wrench, Flag, Star, Shield, X, Bot,
} from 'lucide-react';

function Logo({ size = 'md' }) {
  const sizes = { sm: { box: 'w-8 h-8', icon: 16, text: 'text-base' }, md: { box: 'w-10 h-10', icon: 20, text: 'text-xl' }, lg: { box: 'w-12 h-12', icon: 24, text: 'text-2xl' } };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm`}>
        <Briefcase size={s.icon} className="text-white" strokeWidth={2.5} />
      </div>
      <p className={`${s.text} font-extrabold tracking-tight text-slate-900`}>
        Kidz<span className="text-brand-600">Biz</span>
      </p>
    </div>
  );
}

// ── Support chat responses ───────────────────────────────────
const SUPPORT_RESPONSES = {
  price:    `KidzBiz Family is $12/month for up to 10 kids — that's $1.20 per child. We keep it low by using AI for support instead of a live team. Cancel any time.`,
  trial:    `Yes! Every paid plan starts with a 14-day free trial. No credit card required to start.`,
  age:      `KidzBiz is designed for ages 8–18. Younger kids (8–11) usually work best with a parent alongside them. Teens can run their businesses almost independently.`,
  account:  `You create one parent account. Your kids sign in with a simple 4-digit PIN — no email address needed for kids.`,
  ai:       `The AI coach is powered by Claude (by Anthropic). It guides kids through each phase with questions — it won't just give answers, it helps them think. On paid plans the coach is included; on the free plan you bring your own Claude API key.`,
  fair:     `Any selling event works — a craft fair, school market, neighborhood sale, Etsy shop, or just selling to friends and family. The curriculum adapts to whatever your launch goal is.`,
  refund:   `We offer a full refund within 30 days, no questions asked. Just email hello@kidbiz.praxemy.com.`,
  cancel:   `Cancel any time from your account settings. No penalty, no runaround.`,
  class:    `Yes! The Class plan at $29/month is designed for teachers and program leaders running multiple families. Email hello@kidbiz.praxemy.com and we can set up a demo.`,
  default:  `Great question! I'm an AI assistant — I can answer most questions about KidzBiz. For anything I can't handle, email hello@kidbiz.praxemy.com and a human will get back to you within 1 business day.`,
};

function getResponse(input) {
  const l = input.toLowerCase();
  if (l.includes('price') || l.includes('cost') || l.includes('how much') || l.includes('$'))    return SUPPORT_RESPONSES.price;
  if (l.includes('trial') || l.includes('free'))       return SUPPORT_RESPONSES.trial;
  if (l.includes('age') || l.includes('old') || l.includes('young')) return SUPPORT_RESPONSES.age;
  if (l.includes('account') || l.includes('sign') || l.includes('login') || l.includes('pin')) return SUPPORT_RESPONSES.account;
  if (l.includes('ai') || l.includes('coach') || l.includes('claude')) return SUPPORT_RESPONSES.ai;
  if (l.includes('fair') || l.includes('craft') || l.includes('sell') || l.includes('market')) return SUPPORT_RESPONSES.fair;
  if (l.includes('refund') || l.includes('money back')) return SUPPORT_RESPONSES.refund;
  if (l.includes('cancel'))   return SUPPORT_RESPONSES.cancel;
  if (l.includes('class') || l.includes('teacher') || l.includes('school')) return SUPPORT_RESPONSES.class;
  return SUPPORT_RESPONSES.default;
}

function SupportChat() {
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: "Hi! I'm KidzBiz Support — an AI assistant. Ask me anything about pricing, how it works, or getting started." },
  ]);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now() + 1, role: 'assistant', content: getResponse(userMsg.content) }]);
      setLoading(false);
    }, 700);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition flex items-center justify-center"
        aria-label="Open support chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className="px-4 py-3 bg-brand-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <div>
                <p className="font-semibold text-sm leading-tight">KidzBiz Support</p>
                <p className="text-xs text-white/70">AI assistant · usually instant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/10 rounded-lg p-1 transition"><X size={18} /></button>
          </div>

          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-start gap-1.5">
            <Shield size={12} className="shrink-0 mt-0.5" />
            AI support only — no live agents. That keeps our price at $12/mo. Email us for urgent issues.
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-500">Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 p-2.5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything…"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
            <button onClick={handleSend} disabled={!input.trim() || loading} className="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Pricing tiers ────────────────────────────────────────────
const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the full curriculum with your own Claude API key.',
    highlight: false,
    features: [
      '1 child, unlimited businesses',
      'Full 5-phase curriculum',
      'AI coach (bring your own Claude API key)',
      'Per-project budget & launch date tracking',
      'Kanban task board',
      'Local browser storage',
    ],
    cta: 'Start free',
    ctaTo: '/login?plan=free',
    note: 'No credit card required.',
  },
  {
    name: 'Family',
    price: '$12',
    period: 'per month',
    description: 'Up to 10 kids. AI coach included — no API key needed.',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Up to 10 children',
      'Unlimited businesses per child',
      'Live AI coach — no setup required',
      'Cloud save (progress never lost)',
      'Parent dashboard & controls',
      'Per-project timelines & budgets',
      'Kids can request parent approvals',
      'Printable worksheets',
    ],
    cta: 'Start Family plan',
    ctaTo: '/login?plan=family',
    note: '14-day free trial. Cancel any time.',
  },
  {
    name: 'Class',
    price: '$29',
    period: 'per month',
    description: 'For teachers, coaches, and after-school programs.',
    highlight: false,
    features: [
      'Unlimited children',
      'Multi-family management',
      'Class-wide progress dashboard',
      'Bulk phase deadline control',
      'Live AI coach for all students',
      'Email support',
    ],
    cta: 'Contact us',
    ctaTo: 'mailto:hello@kidbiz.praxemy.com',
    isExternal: true,
    note: 'Custom invoicing available.',
  },
];

const HOW_IT_WORKS = [
  { Icon: Lightbulb, phase: 'Phase 0–1', title: 'Find the opportunity', body: "Start with an idea you already have, spot a problem worth solving, or plan around an upcoming event like a craft fair." },
  { Icon: BarChart3, phase: 'Phase 2',   title: 'Build the business model', body: 'Calculate costs, set a price, and forecast revenue. Real math, real decisions — at your pace.' },
  { Icon: Wrench,    phase: 'Phase 3',   title: 'Make the product', body: 'Prototype, collect feedback, and produce inventory. Parents set the budget; kids manage it.' },
  { Icon: Flag,      phase: 'Phase 4',   title: 'First sale', body: 'Design a booth, practice the pitch, and sell at your launch event. Craft fair, school market, or online — your call.' },
];

const TESTIMONIALS = [
  { name: 'Future student, ~age 14', quote: 'I made real money at my first craft fair — and my coach helped me figure out every single step before the day even arrived.', stars: 5 },
  { name: 'Future KidzBiz parent', quote: 'I set the budget and launch date in ten minutes. My kids ran the whole program themselves. I was honestly impressed.', stars: 5 },
  { name: 'Future student, ~age 11', quote: 'My coach kept asking me questions I had never thought about. It made my product so much better before I sold a single one.', stars: 5 },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: 'What age range is KidzBiz for?', a: 'Ages 8–18. Younger kids (8–11) usually do best with a parent working alongside them. Older kids (12+) can run their businesses almost independently.' },
    { q: 'Do my kids need their own accounts?', a: 'No — you create one parent account, then add your kids as profiles. Kids log in with a simple 4-digit PIN on your family device.' },
    { q: "What is the AI coach, exactly?", a: "It's a conversational AI (powered by Claude) that asks guiding questions at every phase of the curriculum. It doesn't just give answers — it helps kids think through each decision themselves." },
    { q: "Why is it so affordable?", a: "We use AI for customer support instead of a live team, and we price at roughly 3x our actual AI infrastructure cost. Our goal is to be accessible to every family, not just well-funded ones." },
    { q: "What if we don't have a craft fair?", a: 'Any launch works — a school market, neighborhood sale, Etsy shop, or even just selling to friends and neighbors. The phases stay the same; you set the launch date.' },
    { q: "Can kids run more than one business?", a: "Yes! Each child can have unlimited business projects. Each one has its own phases, budget, and coach session — completely separate." },
    { q: "What happens after the 14-day trial?", a: "You'll be asked to enter a card. If you decide it's not for you, cancel any time — no questions asked. We also offer a full 30-day money-back guarantee." },
  ];

  return (
    <div className="bg-white">
      {/* Support chat widget */}
      <SupportChat />

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition hidden sm:block">Pricing</a>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">Sign in</Link>
            <Link to="/login?plan=family"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition">
              Get started <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold ring-1 ring-brand-200 mb-6">
          <Sparkles size={12} /> Self-paced AI business curriculum for kids
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
          Your kid builds a{' '}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">real business</span>
          {' '}— at their own pace.
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          KidzBiz is a self-paced 5-phase program that takes kids ages 8–18 from idea to first sale — with an AI coach guiding every step. Parents set the timeline and budget. Kids do the work.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login?plan=family"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-base hover:bg-brand-700 transition shadow-lg shadow-brand-200">
            Start 14-day free trial <ChevronRight size={18} />
          </Link>
          <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 transition">
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-400">No credit card required. $12/month after trial. Cancel any time.</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> No third-party accounts required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> AI coach included on paid plan</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Kids aged 8–18</span>
        </div>
      </section>

      {/* Mock screenshot band */}
      <section className="bg-slate-900 py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-800 rounded-2xl p-6 ring-1 ring-white/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="ml-3 flex-1 h-6 rounded bg-slate-700 text-slate-400 text-xs flex items-center px-3">kidbiz.praxemy.com/app</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 bg-gradient-to-r from-brand-600 to-accent-600 rounded-xl p-4 text-white">
                <p className="text-xs font-medium opacity-80">Homemade Candles Co.</p>
                <p className="text-xl font-bold mt-0.5">Let's get to launch, Calvin.</p>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="bg-white/10 rounded-lg px-2 py-1">Budget: $47 of $100 left</span>
                  <span className="bg-white/10 rounded-lg px-2 py-1">23 days to launch</span>
                </div>
              </div>
              {['To do', 'In progress', 'Done'].map((col, i) => (
                <div key={col} className="bg-slate-700 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-2">{col}</p>
                  {i === 0 && ['Cost Breakdown', 'Pricing Strategy'].map(t => (
                    <div key={t} className="bg-slate-600 rounded-lg p-2 mb-1.5 text-xs text-slate-200 font-medium">{t}</div>
                  ))}
                  {i === 1 && <div className="bg-brand-900/50 border border-brand-700 rounded-lg p-2 text-xs text-brand-200 font-medium">Revenue Forecast</div>}
                  {i === 2 && ['Opportunity Spotting', 'Partnership Decision', 'Ideation Worksheet'].map(t => (
                    <div key={t} className="bg-emerald-900/40 border border-emerald-700 rounded-lg p-2 mb-1.5 text-xs text-emerald-200 font-medium line-through opacity-70">{t}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">How it works</h2>
          <p className="mt-3 text-lg text-slate-600">Five phases. Your timeline. One real business.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-slate-200 -translate-x-4 z-0" />
              )}
              <div className="relative z-10 bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <step.Icon size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{step.phase}</p>
                <h3 className="text-base font-bold text-slate-900 mt-1">{step.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coach callout */}
      <section className="bg-gradient-to-br from-brand-50 to-accent-50 border-y border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shrink-0">
            <MessageCircle size={36} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              The AI coach that actually teaches.
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Instead of just answering questions, the coach <em>asks</em> them. Every task card opens a guided conversation — 5–6 questions that walk the kid through completing that specific deliverable. Your child names the coach themselves (Claude, Alex, Sage… whatever fits).
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Asks, doesn't just tell", 'Specific to each task', 'Remembers their answers', 'Free-form Q&A too'].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={12} className="text-brand-500" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">What we hope families will say</h2>
          <p className="mt-2 text-slate-500 text-sm">No fake reviews — these are the outcomes we are building toward. Be one of our first families.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-slate-50 rounded-2xl p-6 ring-1 ring-slate-200 relative">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed italic">"{t.quote}"</p>
              <p className="mt-4 text-xs font-semibold text-slate-400">{t.name}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-brand-600 font-semibold">Your family could be first. <a href="#pricing" className="underline underline-offset-2">Start free today.</a></p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Simple, honest pricing</h2>
            <p className="mt-3 text-slate-600 text-lg">Priced at 3× our actual AI cost — not what the market will bear.</p>
          </div>

          {/* Low price disclaimer */}
          <div className="max-w-2xl mx-auto mb-10 bg-white rounded-xl p-4 ring-1 ring-slate-200 flex items-start gap-3 text-sm text-slate-600">
            <Shield size={18} className="text-brand-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Why so affordable?</span>{' '}
              We use AI for customer support (that's what the chat bubble is) instead of a live team. No live agents right now — that keeps your price at $12/mo instead of $40+. Email us for anything the AI can't handle.
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  tier.highlight
                    ? 'bg-brand-600 text-white ring-2 ring-brand-600 shadow-xl shadow-brand-200'
                    : 'bg-white ring-1 ring-slate-200'
                }`}
              >
                {tier.badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 self-start">
                    <Star size={10} className="fill-white" /> {tier.badge}
                  </span>
                )}
                <h3 className={`font-bold text-lg ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                  <span className={`text-sm ${tier.highlight ? 'text-white/70' : 'text-slate-500'}`}>/{tier.period}</span>
                </div>
                <p className={`mt-2 text-sm ${tier.highlight ? 'text-white/80' : 'text-slate-600'}`}>{tier.description}</p>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${tier.highlight ? 'text-white/80' : 'text-brand-500'}`} />
                      <span className={tier.highlight ? 'text-white/90' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {tier.isExternal ? (
                    <a href={tier.ctaTo}
                      className={`block w-full text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                        tier.highlight ? 'bg-white text-brand-600 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}>
                      {tier.cta}
                    </a>
                  ) : (
                    <Link to={tier.ctaTo}
                      className={`block text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                        tier.highlight ? 'bg-white text-brand-600 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}>
                      {tier.cta}
                    </Link>
                  )}
                  <p className={`text-center text-xs mt-2 ${tier.highlight ? 'text-white/60' : 'text-slate-400'}`}>{tier.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-10 tracking-tight">Questions & answers</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-50 rounded-xl ring-1 ring-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 font-semibold text-slate-900 flex items-center justify-between gap-3"
              >
                {faq.q}
                <ChevronRight size={18} className={`shrink-0 text-slate-400 transition ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-600 to-accent-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to build something real?</h2>
          <p className="mt-4 text-lg text-white/80">Start today — first two weeks are completely free.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?plan=family"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold text-base hover:bg-slate-50 transition shadow-lg">
              Start free trial <ChevronRight size={18} />
            </Link>
            <a href="mailto:hello@kidbiz.praxemy.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition">
              Talk to us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-slate-300">|</span>
            <span>© {new Date().getFullYear()} KidzBiz · Praxemy</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@kidbiz.praxemy.com" className="hover:text-slate-900 transition">Contact</a>
            <Link to="/login" className="hover:text-slate-900 transition">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
