"use client";
import React, { useState, useEffect, use } from 'react'; 
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfToday, parse, addMinutes, isBefore, isEqual, getDay } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PublicBookingPage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [availability, setAvailability] = useState([]);
  
  // Date and Time selection state
  const [selectedDateObject, setSelectedDateObject] = useState(null);
  const [dynamicTimeSlots, setDynamicTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate an array of the next 30 days starting from today
  const today = startOfToday();
  const next30Days = Array.from({ length: 30 }).map((_, i) => addDays(today, i));

  // 1. FETCH EVENT & AVAILABILITY ON LOAD
  useEffect(() => {
    async function fetchData() {
      // Fetch Event details
      const { data: eventData } = await supabase
        .from('event_types')
        .select('*')
        .eq('slug', slug)
        .single();
        
      // Fetch user's weekly availability rules
      const { data: availData } = await supabase
        .from('availability')
        .select('*')
        .eq('is_active', true);

      setEvent(eventData);
      setAvailability(availData || []);
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  // 2. GENERATE TIME SLOTS WHEN A DATE IS CLICKED
  const handleDateSelect = (date) => {
    setSelectedDateObject(date);
    setSelectedTime(null);
    setShowForm(false);

    if (!event || !availability.length) {
      setDynamicTimeSlots([]);
      return;
    }

    const dayOfWeekIndex = getDay(date); // 0 = Sunday, 1 = Monday, etc.
    
    // Find availability rules for this specific day of the week
    const dayRules = availability.filter(rule => rule.day_of_week === dayOfWeekIndex);
    
    let generatedSlots = [];

    // Loop through each interval rule for that day (e.g. 09:00-12:00)
    dayRules.forEach(rule => {
      // Parse the DB time strings into actual Date objects for math
      let currentSlotTime = parse(rule.start_time.substring(0, 5), 'HH:mm', date);
      const endTime = parse(rule.end_time.substring(0, 5), 'HH:mm', date);

      // Keep adding slots based on event duration until we hit the end time
      while (isBefore(currentSlotTime, endTime) || isEqual(currentSlotTime, endTime)) {
        const slotEndTime = addMinutes(currentSlotTime, event.duration);
        
        // Ensure the full meeting fits before the shift ends
        if (isBefore(slotEndTime, endTime) || isEqual(slotEndTime, endTime)) {
          generatedSlots.push(format(currentSlotTime, 'HH:mm'));
        }
        currentSlotTime = addMinutes(currentSlotTime, event.duration); // Move forward by duration
      }
    });

    setDynamicTimeSlots(generatedSlots);
  };

  // 3. HANDLE FINAL SUBMISSION
  const handleScheduleEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Format final timestamp for Supabase (YYYY-MM-DDTHH:mm:ss)
    const bookingDateStr = format(selectedDateObject, 'yyyy-MM-dd');
    const timestamp = `${bookingDateStr}T${selectedTime}:00`;

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        guestName,
        guestEmail,
        startTime: timestamp
      })
    });

    if (res.ok) {
      const displayDate = format(selectedDateObject, 'EEEE, MMMM do, yyyy');
      router.push(`/book/${slug}/success?name=${encodeURIComponent(guestName)}&date=${encodeURIComponent(displayDate)}&time=${encodeURIComponent(selectedTime)}&event=${encodeURIComponent(event.title)}`);
    } else {
      alert("Failed to book the event. Ensure the /api/bookings route exists.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!event) return <div className="text-center py-20 font-bold">Event not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* --- LEFT COLUMN: EVENT INFO --- */}
        <div className="w-full md:w-[350px] p-8 border-b md:border-b-0 md:border-r border-slate-100 relative">
          <button 
            onClick={() => showForm ? setShowForm(false) : router.push('/admin/dashboard')} 
            className="mb-8 text-[#006bff] hover:text-blue-800 transition-colors w-10 h-10 flex items-center justify-center rounded-full border border-blue-100 hover:bg-blue-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <div className="space-y-4">
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Manik Pathria</p>
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
            
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{event.duration} min</span>
              </div>
              
              {showForm && selectedDateObject && (
                <div className="flex items-center gap-2 text-[#006bff] font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{selectedTime}, {format(selectedDateObject, 'EEEE, MMMM d')}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.6v-1.8z"/><rect x="2" y="5" width="14" height="14" rx="2"/></svg>
                <span>Web conferencing details provided upon confirmation.</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: SCHEDULER OR FORM --- */}
        <div className="flex-1 p-8">
          
          {!showForm ? (
            /* PHASE 1: DATE AND TIME PICKER */
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Select a Date & Time</h2>
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* CALENDAR GRID */}
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                      <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                    ))}
                  </div>
                  
                  {/* Dynamic Days mapped from today */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty slots to align the first day to the correct weekday column */}
                    {Array.from({ length: getDay(next30Days[0]) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    
                    {next30Days.map((date, i) => {
                      const isSelected = selectedDateObject && format(selectedDateObject, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                      // Check if this day is actually enabled in availability
                      const hasAvailability = availability.some(a => a.day_of_week === getDay(date));

                      return (
                        <button
                          key={i}
                          disabled={!hasAvailability}
                          onClick={() => handleDateSelect(date)}
                          className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm transition-all
                            ${!hasAvailability ? 'text-slate-300 cursor-not-allowed' : ''}
                            ${isSelected 
                              ? 'bg-[#006bff] text-white shadow-md' 
                              : hasAvailability ? 'text-[#006bff] bg-blue-50 hover:bg-[#006bff] hover:text-white' : ''
                            }`}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DYNAMIC TIME SLOTS */}
                {selectedDateObject && (
                  <div className="w-full lg:w-56 animate-in fade-in slide-in-from-right-4 duration-300">
                    <p className="text-center font-bold text-slate-700 mb-4">
                      {format(selectedDateObject, 'EEEE, MMM d')}
                    </p>
                    <div className="space-y-2 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                      {dynamicTimeSlots.length > 0 ? (
                        dynamicTimeSlots.map((time) => (
                          <div key={time} className="flex gap-2">
                            <button
                              onClick={() => setSelectedTime(time)}
                              className={`flex-1 py-3 px-4 border rounded font-bold transition-all border-[#006bff]
                                ${selectedTime === time 
                                  ? 'bg-slate-700 border-slate-700 text-white w-1/2' 
                                  : 'text-[#006bff] hover:bg-blue-50'
                                }`}
                            >
                              {time}
                            </button>
                            {selectedTime === time && (
                              <button 
                                onClick={() => setShowForm(true)}
                                className="bg-[#006bff] text-white px-4 py-3 rounded font-bold animate-in fade-in zoom-in duration-200 shadow-md"
                              >
                                Next
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center mt-10">No slots available for this date.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* PHASE 2: GUEST DETAILS FORM */
            <div className="max-w-md animate-in fade-in slide-in-from-right-8 duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Enter Details</h2>
              
              <form onSubmit={handleScheduleEvent} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Name *</label>
                  <input 
                    required
                    type="text"
                    className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                  <input 
                    required
                    type="email"
                    className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Please share anything that will help prepare for our meeting.</label>
                  <textarea 
                    rows="3"
                    className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#006bff] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}