"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navLinks = [
    { 
      name: 'Event Types', 
      href: '/admin/dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
      )
    },
    { 
      name: 'Scheduled Events', 
      href: '/admin/meetings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
      )
    },
    { 
      name: 'Availability', 
      href: '/admin/availability', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      )
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-slate-200 fixed h-full bg-white z-20 hidden md:block">
        <div className="p-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 w-fit hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-[#006bff] rounded-lg flex items-center justify-center text-white font-extrabold text-lg">
              S
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Smart Slot</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-[#006bff]' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-[#006bff]' : 'text-slate-400'}>
                    {link.icon}
                  </span>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account Section (Bottom) */}
        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
              MP
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">Manik Pathria</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Settings</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header (Mobile Only / Breadcrumbs) */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {pathname.split('/').pop().replace('-', ' ')}
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-8 md:p-12 bg-slate-50/50">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
