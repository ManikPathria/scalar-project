"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  
  // These would typically be passed via URL params after the booking POST request
  const name = searchParams.get('name') || "Guest";
  const date = searchParams.get('date') || "Today";
  const time = searchParams.get('time') || "12:00 PM";
  const eventName = searchParams.get('event') || "Meeting";

  // FUNCTION TO OPEN GOOGLE CALENDAR
  const handleAddToCalendar = () => {
    const title = encodeURIComponent(`${eventName} with Manik Pathria`);
    const details = encodeURIComponent(`Meeting with ${name}.\nScheduled for: ${time}, ${date}\n\nWeb conferencing details to follow.`);
    
    // Google Calendar template URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    
    // Open in a new tab
    window.open(googleCalUrl, '_blank');
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-10 text-center">
      
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirmed</h1>
      <p className="text-slate-600 mb-8">
        You are scheduled with <span className="font-bold text-slate-900">Manik Pathria</span>.
      </p>

      {/* Meeting Details Box */}
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 text-left space-y-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 mt-1 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="font-bold text-slate-800">{eventName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-5 h-5 mt-1 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className="font-bold text-slate-800">{time}, {date}</p>
            <p className="text-sm text-slate-500">India Standard Time</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-5 h-5 mt-1 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.6v-1.8z"/><rect x="2" y="5" width="14" height="14" rx="2"/></svg>
          </div>
          <p className="text-sm text-slate-600 font-medium">Web conferencing details have been sent to your email.</p>
        </div>
      </div>

      <p className="text-slate-500 text-sm mb-6">
        A calendar invitation has been sent to your email address.
      </p>

      <div className="flex flex-col gap-3">
        {/* ATTACHED onClick HANDLER HERE */}
        <button 
          onClick={handleAddToCalendar}
          className="w-full py-3 border border-slate-200 rounded-full font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Add to Google Calendar
        </button>
        
        <Link href="/admin/dashboard" className="text-[#006bff] text-sm font-bold hover:underline mt-4">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// Wrap it in a Suspense boundary for the default export
export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-500 font-bold animate-pulse">Loading confirmation...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}