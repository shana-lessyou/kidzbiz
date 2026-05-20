import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY    = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Stripe signature verification (HMAC-SHA256)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(expectedBytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

serve(async (req) => {
  const body = await req.text();
  const sigHeader = req.headers.get('stripe-signature') || '';

  const valid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // metadata is on the subscription, not the session — always look it up
      if (session.subscription) {
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const sub = await subRes.json();
        const familyId = sub.metadata?.family_id;
        const plan     = sub.metadata?.plan || 'family';

        console.log('Webhook: familyId=', familyId, 'plan=', plan, 'sub.metadata=', JSON.stringify(sub.metadata));

        if (familyId) {
          // Get customer email so we can upsert even if the families row is missing
          const custRes = await fetch(`https://api.stripe.com/v1/customers/${session.customer}`, {
            headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
          });
          const customer = await custRes.json();
          const email = customer.email || '';

          const { error: upsertErr } = await supabase
            .from('families')
            .upsert({
              id: familyId,
              email,
              plan_tier: plan,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            }, { onConflict: 'id' });
          console.log('Upsert result:', upsertErr ? upsertErr.message : 'ok — plan_tier=' + plan);
        } else {
          console.error('No family_id in subscription metadata — cannot update plan');
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const familyId = sub.metadata?.family_id;
      if (familyId) {
        await supabase.from('families').update({ plan_tier: 'free', stripe_subscription_id: null }).eq('id', familyId);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const familyId = sub.metadata?.family_id;
      const plan = sub.metadata?.plan;
      if (familyId && plan && sub.status === 'active') {
        await supabase.from('families').update({ plan_tier: plan }).eq('id', familyId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Webhook handler error', { status: 500 });
  }
});
