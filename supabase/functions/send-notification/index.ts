import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL        = 'KidzBiz <noreply@kidzbiz.app>';
const APP_URL           = 'https://kidzbiz.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotifType = 'ask_parent' | 'task_done' | 'summary';

interface NotifPayload {
  type: NotifType;
  childName: string;
  childAge?: number;
  businessName?: string;
  taskTitle?: string;
  message?: string;       // kid's message for ask_parent
  summaryText?: string;   // AI summary text for summary type
}

function buildEmail(payload: NotifPayload, toEmail: string): { subject: string; html: string } {
  const { type, childName, businessName, taskTitle, message, summaryText } = payload;

  const header = `
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:28px 32px;border-radius:12px 12px 0 0">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">Kidz<span style="color:#a5b4fc">Biz</span></p>
    </div>`;

  const footer = `
    <div style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 12px 12px">
      <p style="margin:0;font-size:12px;color:#94a3b8">
        <a href="${APP_URL}/app" style="color:#4F46E5;text-decoration:none;font-weight:600">Open KidzBiz →</a>
        &nbsp;·&nbsp; You're receiving this because you opted into KidzBiz parent notifications.
      </p>
    </div>`;

  if (type === 'ask_parent') {
    return {
      subject: `${childName} needs your help — KidzBiz`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          ${header}
          <div style="padding:28px 32px;background:#fff">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a">${childName} is asking for help</p>
            <p style="margin:0 0 20px;font-size:14px;color:#64748b">
              ${taskTitle ? `During: <strong>${taskTitle}</strong>` : `On their business: <strong>${businessName || 'their business'}</strong>`}
            </p>
            <div style="background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:15px;color:#1e293b;line-height:1.6">"${message || 'I need some help!'}"</p>
            </div>
            <a href="${APP_URL}/app" style="display:inline-block;background:#4F46E5;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
              Open Parent Console →
            </a>
          </div>
          ${footer}
        </div>`,
    };
  }

  if (type === 'task_done') {
    return {
      subject: `${childName} completed a task! 🎉 — KidzBiz`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          ${header}
          <div style="padding:28px 32px;background:#fff">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a">Task complete! 🎉</p>
            <p style="margin:0 0 20px;font-size:14px;color:#64748b">${childName} just finished a step in their business journey.</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px">Completed</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a">${taskTitle || 'A curriculum task'}</p>
              ${businessName ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b">${businessName}</p>` : ''}
            </div>
            <a href="${APP_URL}/app" style="display:inline-block;background:#4F46E5;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
              See their progress →
            </a>
          </div>
          ${footer}
        </div>`,
    };
  }

  if (type === 'summary') {
    const formattedSummary = (summaryText || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return {
      subject: `${childName}'s weekly progress summary — KidzBiz`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          ${header}
          <div style="padding:28px 32px;background:#fff">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a">Weekly progress — ${childName}</p>
            ${businessName ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b">Business: <strong>${businessName}</strong></p>` : '<div style="margin-bottom:20px"></div>'}
            <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:20px;margin-bottom:24px;font-size:14px;color:#1e293b;line-height:1.7">
              ${formattedSummary}
            </div>
            <a href="${APP_URL}/app" style="display:inline-block;background:#4F46E5;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
              Open Parent Console →
            </a>
          </div>
          ${footer}
        </div>`,
    };
  }

  return { subject: 'KidzBiz update', html: '<p>Something happened in KidzBiz.</p>' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) throw new Error('Unauthorized');

    const payload: NotifPayload = await req.json();

    // Load family notification prefs
    const { data: family } = await supabase
      .from('families')
      .select('notify_email, notify_on_request, notify_on_task_done, notify_on_summary')
      .eq('id', user.id)
      .single();

    if (!family?.notify_email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no email configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check per-type opt-in
    const shouldSend =
      (payload.type === 'ask_parent'  && family.notify_on_request !== false) ||
      (payload.type === 'task_done'   && family.notify_on_task_done === true) ||
      (payload.type === 'summary'     && family.notify_on_summary  === true);

    if (!shouldSend) {
      return new Response(JSON.stringify({ ok: true, skipped: 'not opted in for this type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, html } = buildEmail(payload, family.notify_email);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [family.notify_email],
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Resend error');

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
