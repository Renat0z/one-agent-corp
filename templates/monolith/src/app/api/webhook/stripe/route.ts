import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// Disable body parsing — Stripe needs the raw body to verify the signature
export const dynamic = 'force-dynamic';

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) return;

  // Retrieve the full subscription to get period details
  const { default: Stripe } = await import('stripe');
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

  await prisma.subscription.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      user: { connect: { id: session.client_reference_id! } },
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Upgrade user plan based on price metadata
  if (session.client_reference_id) {
    await prisma.user.update({
      where: { id: session.client_reference_id },
      data: { plan: 'PRO' },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Downgrade user if subscription is no longer active
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
    if (sub) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: { plan: 'FREE' },
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!sub) return;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: 'canceled', stripeSubscriptionId: null },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { plan: 'FREE' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        // Unhandled event types — safe to ignore
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, message);
    return NextResponse.json({ error: `Webhook handler failed: ${message}` }, { status: 500 });
  }
}
