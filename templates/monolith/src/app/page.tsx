import Link from 'next/link';

const FEATURES = [
  {
    title: 'Feature One',
    description: 'Describe your first key feature and why it matters to users.',
    icon: '⚡',
  },
  {
    title: 'Feature Two',
    description: 'Describe your second key feature and the value it delivers.',
    icon: '🔒',
  },
  {
    title: 'Feature Three',
    description: 'Describe your third key feature and the problem it solves.',
    icon: '📊',
  },
];

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Up to 5 projects', 'Basic analytics', 'Email support'],
    cta: 'Get started',
    href: '/auth/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'API access'],
    cta: 'Start free trial',
    href: '/auth/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    features: ['Everything in Pro', 'SSO & SAML', 'Dedicated manager', 'SLA guarantee'],
    cta: 'Contact sales',
    href: '/contact',
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-gray-900">{{PROJECT_NAME}}</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight max-w-3xl">
          {{PROJECT_NAME}}
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl">
          {{TAGLINE}}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Start for free
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 bg-white text-gray-900 text-lg font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-start p-6 border border-gray-200 rounded-2xl hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-4">{feature.icon}</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            No hidden fees. Cancel anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col p-8 rounded-2xl border ${
                  plan.highlighted
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xl'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlighted ? 'text-blue-200' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center py-3 rounded-xl font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-blue-200 mb-8 max-w-xl mx-auto">
          Join thousands of users already using {{PROJECT_NAME}} to grow their business.
        </p>
        <Link
          href="/auth/register"
          className="inline-block px-8 py-3 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-colors"
        >
          Start for free today
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© {new Date().getFullYear()} {{PROJECT_NAME}}. All rights reserved.</p>
      </footer>
    </main>
  );
}
