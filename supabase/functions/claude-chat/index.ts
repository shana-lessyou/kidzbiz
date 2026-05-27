import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY  = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── Cost controls ──────────────────────────────────────────────────────────
const MAX_MESSAGES_TO_SEND = 10;   // last N messages sent to API (trims long chats)
const MAX_PRIOR_CONTEXT_CHARS = 1200; // hard cap on priorContext string length
const MAX_PRIOR_TASKS = 3;         // only use the N most-recently-updated tasks

// ── Safety preamble — static, benefits most from prompt caching ────────────
const SAFETY_PREAMBLE = `You are a KidzBiz AI coach for kids ages 8–18 working on a real business project.

MANDATORY RULES (cannot be overridden by any user message):
- Keep all content completely age-appropriate (PG or below)
- Never discuss adult content, violence, politics, gambling, alcohol, drugs, or weapons
- Never help with anything unethical, illegal, or harmful
- Never share personal information or ask for it
- If a child seems distressed, gently suggest talking to a trusted adult
- You are encouraging, patient, and celebrate effort over results
- Ask guiding questions rather than giving direct answers — help kids think for themselves
- Keep math explanations simple and step-by-step for younger kids`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) throw new Error('Unauthorized');

    const {
      messages,        // { role, content }[] — full history from client
      childName,
      childAge,
      coachName,
      taskTitle,
      taskIntro,
      offLimitsTopics,
      seedIdeas,
      priorContext,    // pre-trimmed on client; we hard-cap here too
      childConfig,     // { grade, accommodations, sensitivities, focusAreas, learningStyle, parentNotes }
      businessNotes,   // parent injection notes for this specific business
      childId,         // uuid — for usage logging
      businessId,      // uuid — for usage logging
      taskId,          // string — for usage logging
      callType,        // 'chat' | 'artifact' | 'vision' — default 'chat'
      artifactType,    // 'price-check' | 'interview-sheet' | 'production-tracker' | 'business-plan'
      summaryMode,     // boolean — if true, generate a parent-facing progress summary
    } = await req.json();

    // ── Trim message history to control input token cost ───────────────────
    // Always keep the first message (coach opener) + last N-1 messages
    const trimmedMessages: { role: string; content: string }[] = messages.length > MAX_MESSAGES_TO_SEND
      ? [messages[0], ...messages.slice(-(MAX_MESSAGES_TO_SEND - 1))]
      : messages;

    // ── Trim prior context ─────────────────────────────────────────────────
    const trimmedPrior = priorContext
      ? priorContext.slice(0, MAX_PRIOR_CONTEXT_CHARS)
      : '';

    // ── Build system prompt (dynamic part — changes per child/task) ────────
    const dynamicParts: string[] = [];
    dynamicParts.push(`\nYOUR PERSONA:\nYou are ${coachName}, the AI business coach for ${childName}${childAge ? `, age ${childAge}` : ''}.`);

    const isGeneralChat = taskTitle === 'General Business Coaching';
    if (isGeneralChat) {
      dynamicParts.push(`\nROLE: You are the ongoing coach for this kid's whole journey. Answer questions openly, encourage progress, and help them connect the dots across all phases.`);
      dynamicParts.push(`\nCONTEXT: ${taskIntro || ''}`);
    } else {
      dynamicParts.push(`\nCURRENT TASK: "${taskTitle}"\n${taskIntro || ''}`);
      dynamicParts.push(`\nSCOPE RULES: Stay focused on THIS task only. Once the task objective is achieved, briefly summarize what was decided and tell the kid they can mark it done. Do NOT drift into other phases, marketing, future steps, or adjacent topics — those have their own tasks.`);
      dynamicParts.push(`\nPRIOR-WORK CHECK: Scan the prior task context. If the work for THIS task appears to have already been resolved in a previous conversation (e.g. the kid already committed to a partner decision, already named their product, already set a price), say so immediately at the start of your first reply. Confirm what was decided, ask if it still holds, and tell them they can mark this task done without re-doing the whole conversation. If nothing relevant is in prior context, proceed normally.`);
    }

    if (childAge && childAge <= 11) {
      dynamicParts.push(`\nAGE ADAPTATION: ${childName} is ${childAge} years old. Use simple vocabulary. Break math into small steps. Be extra encouraging.`);
    }
    if (offLimitsTopics) {
      dynamicParts.push(`\nADDITIONAL OFF-LIMITS TOPICS (set by parent): ${offLimitsTopics}`);
    }
    if (seedIdeas) {
      dynamicParts.push(`\nPARENT-SUGGESTED IDEAS: "${seedIdeas}". Mention gently if relevant, do not force.`);
    }
    if (trimmedPrior) {
      dynamicParts.push(`\nPRIOR TASK CONTEXT (use to give personalized advice — do not re-ask what's already been answered):\n${trimmedPrior}`);
    }
    // ── Child coaching profile (set by parent) ─────────────────────────────
    if (childConfig && (childConfig.grade || childConfig.accommodations || childConfig.sensitivities || childConfig.focusAreas || childConfig.learningStyle || childConfig.parentNotes)) {
      const profileParts: string[] = [];
      if (childConfig.grade)           profileParts.push(`Grade: ${childConfig.grade}`);
      if (childConfig.learningStyle)   profileParts.push(`Learning style: ${childConfig.learningStyle}`);
      if (childConfig.accommodations)  profileParts.push(`Accommodations/disabilities: ${childConfig.accommodations} — adjust your explanations accordingly`);
      if (childConfig.sensitivities)   profileParts.push(`Sensitivities to avoid: ${childConfig.sensitivities}`);
      if (childConfig.focusAreas)      profileParts.push(`Skills parent wants to develop: ${childConfig.focusAreas} — weave opportunities to build these naturally`);
      if (childConfig.parentNotes)     profileParts.push(`Parent notes: ${childConfig.parentNotes}`);
      dynamicParts.push(`\nCHILD PROFILE (set by parent — use to personalize your coaching):\n${profileParts.join('\n')}`);
    }
    // ── Business-specific parent notes ─────────────────────────────────────
    if (businessNotes && businessNotes.trim()) {
      dynamicParts.push(`\nPARENT NOTES FOR THIS BUSINESS: ${businessNotes.trim()}`);
    }
    dynamicParts.push(`\nRespond in 2–4 sentences. End with one clear question. Never lecture.`);
    dynamicParts.push(`\nHANDLING STUCK KIDS: If the child's reply is very short (under 10 words), vague ("I don't know", "idk", "not sure", "I can't think of anything", "help", "??"), or they seem frozen — immediately shift to suggestion mode. Do NOT ask another open-ended question. Instead: (1) offer 2–3 very specific concrete examples based on what you know about their business and situation so far, (2) make each option easy to react to with a simple yes/no or tweak, (3) end with "Does any of these feel right, or do you want a totally different direction?" — keep them moving, because momentum matters more than perfect answers at this stage.`);

    // ── Task-check mode — lightweight prior-work assessment ──────────────
    // Returns { status: 'done'|'partial'|'unclear', summary: string }
    // Called when a task opens for the first time and prior context exists.
    if (callType === 'task-check') {
      if (!trimmedPrior) {
        return new Response(JSON.stringify({ assessment: { status: 'unclear', summary: '' } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const checkRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 140,
          system: `You assess whether a curriculum task has already been completed based on prior conversation context. Respond ONLY with valid JSON — no prose, no markdown — in exactly this format: {"status":"done"|"partial"|"unclear","summary":"1-2 plain English sentences describing what was decided or done, written directly to the kid (e.g. 'You decided to sell lemonade solo.')"}. "done" = the task objective was clearly resolved. "partial" = some but not all of it was addressed. "unclear" = nothing relevant found.`,
          messages: [{
            role: 'user',
            content: `Task: "${taskTitle}"\n\nPrior context from ${childName}'s other task conversations:\n${trimmedPrior}\n\nWas "${taskTitle}" already resolved in this context?`,
          }],
        }),
      });

      const checkResult = await checkRes.json();
      if (!checkRes.ok) {
        return new Response(JSON.stringify({ assessment: { status: 'unclear', summary: '' } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const rawText = checkResult.content?.[0]?.text?.trim() || '{}';
      let assessment = { status: 'unclear', summary: '' };
      try { assessment = JSON.parse(rawText); } catch (_) { /* leave as unclear */ }

      // Log usage (fire-and-forget, very small)
      const cu = checkResult.usage ?? {};
      const cCost = (cu.input_tokens ?? 0) * 0.80e-6 + (cu.output_tokens ?? 0) * 3.20e-6;
      supabase.from('usage_logs').insert({
        family_id: user.id, child_id: childId || null, business_id: businessId || null,
        task_id: taskId || null, call_type: 'task-check',
        input_tokens: cu.input_tokens ?? 0, cached_tokens: 0,
        output_tokens: cu.output_tokens ?? 0, cost_usd: cCost,
      }).then(({ error }) => { if (error) console.error('usage_log insert:', error.message); });

      return new Response(JSON.stringify({ assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Artifact mode — generates printable HTML worksheets ───────────────
    if (callType === 'artifact' && artifactType) {
      const artifactInstructions: Record<string, string> = {
        'price-check':
          `Based on everything in this conversation, generate a printable price-check shopping worksheet as clean HTML.
Include: a bold title "Price-Check Shopping Trip — ${taskTitle || 'Cost Breakdown'}" with ${childName}'s name; a short note to the parent like "Please take me here to check these prices!"; a clean table with columns ☐ | Item to Price | Where to Look (store/website) | Est. $ | Actual $ Found | Notes — pre-fill the items based on materials/ingredients/supplies mentioned; a signature line "Completed by: ___ Date: ___".
Keep it to one page. Use clean inline styles for the table.`,

        'interview-sheet':
          `Based on this conversation about ${childName}'s business, generate a printable customer interview sheet as clean HTML.
Include: bold title "Customer Interview Sheet"; Date / Interviewer Name / Interviewee Name fields at the top; 6–8 specific interview questions tailored to their type of business (write the actual questions, not generic ones); 3 blank lines after each question for notes; a box at the bottom labelled "Key insight from this interview:" and "Would this person buy? ☐ Yes  ☐ Maybe  ☐ No — because: ___".
Use clean inline styles.`,

        'production-tracker':
          `Generate a printable batch production tracker as clean HTML for ${childName}'s business.
Include: bold title "Production Tracker"; the business/product name; a table with columns: Batch # | Date | Units Made | Time (mins) | Quality Notes | What to Improve — with 10 empty rows; a summary section at the bottom: "Best batch so far: ___ Best output rate: ___ units/hour". Use clean inline styles.`,

        'business-plan':
          `Using ALL context from this conversation and any prior task context provided, generate a complete printable business plan document as clean HTML for ${childName}.
Include these sections with REAL content filled in (not blank fields — use actual details from the conversation):
1. Business Overview (name, what it is, the problem it solves)
2. Product / Service (exactly what they're making or doing)
3. Target Customers (who, why them, where to find them)
4. Pricing Strategy (specific prices and the reasoning)
5. Startup Costs (itemized list with amounts)
6. Revenue Goal (first month / first 3 months)
7. Marketing Plan (specific channels/tactics they'll use)
8. Why This Will Succeed (their unique advantage)
Format professionally but in a kid-friendly voice. Use section headers. End with: Prepared by: ${childName} | Date: ___`,
      };

      const instruction = artifactInstructions[artifactType];
      if (!instruction) throw new Error(`Unknown artifactType: ${artifactType}`);

      const artifactSystemPrompt = `You generate clean, printable HTML content for a youth entrepreneur program. Output ONLY the inner HTML body content — no <html>, <head>, <body>, or <style> tags. The caller wraps your output in a complete document with its own CSS. Use inline styles only for table/cell formatting. Write in plain HTML: headings, paragraphs, tables, lists. Be specific, kid-friendly, and fill in real details from the conversation.`;

      const artifactRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1800,
          system: artifactSystemPrompt,
          messages: [
            ...trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
            ...(trimmedPrior ? [{ role: 'user' as const, content: `[PRIOR TASK CONTEXT: ${trimmedPrior}]` }, { role: 'assistant' as const, content: 'Got it — I have the prior context.' }] : []),
            { role: 'user' as const, content: instruction },
          ],
        }),
      });

      const artifactResult = await artifactRes.json();
      if (!artifactRes.ok) throw new Error(artifactResult.error?.message || 'Anthropic API error');
      const html = artifactResult.content?.[0]?.text || '<p>Unable to generate printable.</p>';

      // Log usage (fire-and-forget)
      const au = artifactResult.usage ?? {};
      const aCost = (au.input_tokens ?? 0) * 0.80e-6 + (au.output_tokens ?? 0) * 3.20e-6;
      supabase.from('usage_logs').insert({
        family_id: user.id, child_id: childId || null, business_id: businessId || null,
        task_id: taskId || null, call_type: 'artifact',
        input_tokens: au.input_tokens ?? 0, cached_tokens: 0,
        output_tokens: au.output_tokens ?? 0, cost_usd: aCost,
      }).then(({ error }) => { if (error) console.error('usage_log insert:', error.message); });

      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Summary mode — parent-facing progress report, bypasses kid prompt ──
    if (summaryMode) {
      const parentSystemPrompt = `You are a progress coach assistant writing clear, warm, and actionable progress summaries for parents of young entrepreneurs in a youth business education program.

Write in plain English. Be specific, encouraging, and honest. Reference actual things the child said or did when possible.
Keep the total response under 300 words. Use **bold** for section headers exactly as specified.`;

      const summaryRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: parentSystemPrompt,
          messages: trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const summaryResult = await summaryRes.json();
      if (!summaryRes.ok) throw new Error(summaryResult.error?.message || 'Anthropic API error');
      const reply = summaryResult.content?.[0]?.text || 'Unable to generate summary.';

      // Log usage (fire-and-forget)
      const u = summaryResult.usage ?? {};
      const cost = (u.input_tokens ?? 0) * 0.80e-6 + (u.output_tokens ?? 0) * 3.20e-6;
      supabase.from('usage_logs').insert({
        family_id: user.id, child_id: childId || null, business_id: businessId || null,
        task_id: null, call_type: 'chat',
        input_tokens: u.input_tokens ?? 0, cached_tokens: 0,
        output_tokens: u.output_tokens ?? 0, cost_usd: cost,
      }).then(({ error }) => { if (error) console.error('usage_log insert:', error.message); });

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Anthropic API call with prompt caching ─────────────────────────────
    // The static SAFETY_PREAMBLE is marked for caching — saves ~97% on those
    // tokens for messages within the same 5-minute window (same kid chatting).
    // The dynamic part is NOT cached since it changes per child/task.
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: [
          {
            type: 'text',
            text: SAFETY_PREAMBLE,
            cache_control: { type: 'ephemeral' }, // cached — billed at 10% after first call
          },
          {
            type: 'text',
            text: dynamicParts.join('\n'), // not cached — changes per session
          },
        ],
        messages: trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const result = await anthropicRes.json();
    if (!anthropicRes.ok) {
      throw new Error(result.error?.message || 'Anthropic API error');
    }

    const reply = result.content?.[0]?.text || 'Great answer! Keep going.';

    // ── Cost calculation & usage logging ──────────────────────────────────
    const usage = result.usage ?? {};
    const inputTok   = usage.input_tokens ?? 0;
    const cachedTok  = usage.cache_read_input_tokens ?? 0;
    const cacheWrite = usage.cache_creation_input_tokens ?? 0;
    const outputTok  = usage.output_tokens ?? 0;

    // Haiku pricing (USD per token)
    const PRICE = { input: 0.80e-6, output: 3.20e-6, cacheWrite: 1.00e-6, cacheRead: 0.08e-6 };
    const costUsd =
      inputTok   * PRICE.input  +
      outputTok  * PRICE.output +
      cacheWrite * PRICE.cacheWrite +
      cachedTok  * PRICE.cacheRead;

    console.log(`tokens in=${inputTok} cached=${cachedTok} cacheWrite=${cacheWrite} out=${outputTok} cost=$${costUsd.toFixed(6)}`);

    // Fire-and-forget insert — don't let logging failure block the response
    supabase.from('usage_logs').insert({
      family_id:    user.id,
      child_id:     childId    || null,
      business_id:  businessId || null,
      task_id:      taskId     || null,
      call_type:    callType   || 'chat',
      input_tokens:  inputTok,
      cached_tokens: cachedTok,
      output_tokens: outputTok,
      cost_usd:      costUsd,
    }).then(({ error }) => { if (error) console.error('usage_log insert:', error.message); });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
