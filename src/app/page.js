import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#006bff] rounded-lg flex items-center justify-center text-white font-extrabold text-lg">
            S
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Smart Slot</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="/admin/dashboard" className="hover:text-[#006bff]">Solutions</Link>
          <Link href="/admin/dashboard" className="hover:text-[#006bff]">Pricing</Link>
          <Link href="/admin/dashboard" className="hover:text-[#006bff]">Resources</Link>
        </div>
        <Link 
          href="/admin/dashboard" 
          className="text-sm font-bold text-slate-900 hover:text-[#006bff]"
        >
          Log In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 md:py-32 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-4xl">
          Easy scheduling <span className="text-[#006bff]">ahead</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
          Smart Slot is your hub for scheduling meetings professionally and efficiently. 
          Eliminate the back-and-forth emails so you can get more done.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            href="/admin/dashboard" 
            className="bg-[#006bff] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Open Admin Dashboard
          </Link>
          <Link 
            href="/book/coffee-chat" 
            className="bg-white text-slate-900 border-2 border-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all"
          >
            View Demo Booking Page
          </Link>
        </div>

        {/* Feature Teaser */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="space-y-4">
            <div className="text-[#006bff] text-2xl font-bold">01.</div>
            <h3 className="text-xl font-bold">Create Event Types</h3>
            <p className="text-slate-500">Set up your availability and meeting durations in seconds.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#006bff] text-2xl font-bold">02.</div>
            <h3 className="text-xl font-bold">Share Your Link</h3>
            <p className="text-slate-500">Send your personalized Smart Slot link to guests or clients.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#006bff] text-2xl font-bold">03.</div>
            <h3 className="text-xl font-bold">Get Booked</h3>
            <p className="text-slate-500">Meetings appear automatically in your dashboard and inbox.</p>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-sm font-medium">
          © 2026 Smart Slot by Manik Pathria Built for SDE Assignment.
        </p>
      </footer>
    </div>
  );
}