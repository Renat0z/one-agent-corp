import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

async function getUserData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
}

const PLAN_LIMITS = {
  FREE: { projects: 5, api_calls: 1000, label: 'Free' },
  PRO: { projects: -1, api_calls: 50000, label: 'Pro' },
  ENTERPRISE: { projects: -1, api_calls: -1, label: 'Enterprise' },
};

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  const userId = (session.user as { id: string }).id;
  const user = await getUserData(userId);

  if (!user) {
    redirect('/auth/login');
  }

  const plan = PLAN_LIMITS[user.plan];
  const subscriptionActive =
    user.subscription?.status === 'active' || user.subscription?.status === 'trialing';
  const periodEnd = user.subscription?.currentPeriodEnd
    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-gray-900">{{PROJECT_NAME}}</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-red-600 hover:text-red-700"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name ?? user.email}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s an overview of your account and usage.
          </p>
        </div>

        {/* Plan Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
              Current Plan
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-gray-900">{plan.label}</span>
              {subscriptionActive && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Active
                </span>
              )}
            </div>
            {periodEnd && (
              <p className="text-sm text-gray-500 mt-1">Renews on {periodEnd}</p>
            )}
            {user.plan === 'FREE' && (
              <Link
                href="/dashboard/upgrade"
                className="mt-4 inline-block w-full text-center py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro
              </Link>
            )}
            {user.plan !== 'FREE' && (
              <Link
                href="/api/billing/portal"
                className="mt-4 inline-block w-full text-center py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Manage billing
              </Link>
            )}
          </div>

          {/* Usage Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Usage
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-medium text-gray-900">
                    0 / {plan.projects === -1 ? '∞' : plan.projects}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: plan.projects === -1 ? '5%' : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">API calls this month</span>
                  <span className="font-medium text-gray-900">
                    0 / {plan.api_calls === -1 ? '∞' : plan.api_calls.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Account
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Member since</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Email</dt>
                <dd className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                  {user.email}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="text-sm font-medium text-green-600">Active</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {user.plan === 'FREE' && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h2 className="text-xl font-bold mb-2">Unlock more with Pro</h2>
            <p className="text-blue-200 mb-6">
              Get unlimited projects, more API calls, and priority support.
            </p>
            <Link
              href="/dashboard/upgrade"
              className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Upgrade now — $29/month
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
