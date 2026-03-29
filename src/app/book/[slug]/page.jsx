"use client";
import React, { useState, useEffect, use } from 'react'; 
import { supabase } from '@/lib/supabase';
import { 
  format, startOfToday, parse, addMinutes, isBefore, isEqual, getDay, 
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth 
} from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PublicBookingPage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [availability, setAvailability] = useState([]);
  
  // Calendar UI State
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today); 

  // Date and Time selection state
  const [selectedDateObject, setSelectedDateObject] = useState(null);
  const [dynamicTimeSlots, setDynamicTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestNotes, setGuestNotes] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: eventData } = await supabase.from('event_types').select('*').eq('slug', slug).single();
      const { data: availData } = await supabase.from('availability').select('*');

      setEvent(eventData);
      setAvailability(availData || []);
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  // GENERATE PROPER MONTH CALENDAR GRID
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth);
  const endDate = endOfWeek(lastDayOfMonth);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // GENERATE TIME SLOTS
  const handleDateSelect = async (date) => {
    setSelectedDateObject(date);
    setSelectedTime(null);
    setShowForm(false);
    setDynamicTimeSlots([]); 

    if (!event || !availability.length) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const dayOfWeekIndex = getDay(date); 
    
    let workingHours = [];

    const overrideRules = availability.filter(rule => rule.specific_date === dateString);

    if (overrideRules.length > 0) {
      const isUnavailable = overrideRules.some(row => row.is_active === false);
      if (isUnavailable) return; 
      workingHours = overrideRules; 
    } else {
      workingHours = availability.filter(rule => 
        rule.day_of_week === dayOfWeekIndex && 
        rule.specific_date === null && 
        rule.is_active === true
      );
    }

    if (workingHours.length === 0) return;

    const startOfDayIso = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endOfDayIso = new Date(date.setHours(23, 59, 59, 999)).toISOString();
    
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_time')
      .gte('booking_time', startOfDayIso)
      .lte('booking_time', endOfDayIso);

    let generatedSlots = [];

    workingHours.forEach(rule => {
      if (!rule.start_time || !rule.end_time) return;

      // TIMEZONE FIX: Use exact JS Date objects
      const [startHour, startMin] = rule.start_time.split(':');
      let currentSlotTime = new Date(date);
      currentSlotTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

      const [endHour, endMin] = rule.end_time.split(':');
      const endTime = new Date(date);
      endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      while (currentSlotTime.getTime() + (event.duration * 60000) <= endTime.getTime()) {
        const isBooked = existingBookings?.some(b => 
          new Date(b.booking_time).getTime() === currentSlotTime.getTime()
        );

        if (!isBooked) {
          generatedSlots.push(format(currentSlotTime, 'HH:mm'));
        }
        
        currentSlotTime = new Date(currentSlotTime.getTime() + event.duration * 60000); 
      }
    });

    setDynamicTimeSlots(generatedSlots);
  };

  // HANDLE FINAL SUBMISSION
  const handleScheduleEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TIMEZONE FIX: Properly format the final timestamp for the database
    const [hours, minutes] = selectedTime.split(':');
    const finalBookingDate = new Date(selectedDateObject);
    finalBookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const timestamp = finalBookingDate.toISOString(); 

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        guestName,
        guestEmail,
        guestNotes, 
        startTime: timestamp
      })
    });

    if (res.ok) {
      const displayDate = format(selectedDateObject, 'EEEE, MMMM do, yyyy');
      router.push(`/book/${slug}/success?name=${encodeURIComponent(guestName)}&date=${encodeURIComponent(displayDate)}&time=${encodeURIComponent(selectedTime)}&event=${encodeURIComponent(event.title)}`);
    } else {
      alert("Failed to book the event. Someone else may have just taken this slot!");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!event) return <div className="text-center py-20 font-bold">Event not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* LEFT COLUMN: EVENT INFO */}
        <div className="w-full md:w-[350px] p-8 border-b md:border-b-0 md:border-r border-slate-100 relative bg-white z-10">
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
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCHEDULER OR FORM */}
        <div className="flex-1 p-8 bg-white">
          
          {!showForm ? (
            /* PHASE 1: CALENDAR */
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Select a Date & Time</h2>
              <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="flex-1">
                  {/* Month Navigation */}
                  <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={handlePrevMonth} 
                      disabled={isBefore(currentMonth, startOfMonth(today))}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <span className="font-bold text-slate-800">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button 
                      onClick={handleNextMonth} 
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                      <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, i) => {
                      const isCurrentMonthView = isSameMonth(date, currentMonth);

                      // FIX: Instead of hiding, render an empty slot to keep the grid aligned
                      if (!isCurrentMonthView) {
                        return <div key={`empty-${i}`} className="h-10 w-10 mx-auto" />;
                      }

                      const isSelected = selectedDateObject && format(selectedDateObject, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                      const isPastDate = isBefore(date, today);
                      const dateString = format(date, 'yyyy-MM-dd');
                      const dayOfWeekIndex = getDay(date);

                      let hasAvailability = false;
                      if (!isPastDate) {
                        const override = availability.find(a => a.specific_date === dateString);
                        if (override) {
                          hasAvailability = override.is_active; 
                        } else {
                          hasAvailability = availability.some(a => a.day_of_week === dayOfWeekIndex && a.specific_date === null && a.is_active === true);
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={!hasAvailability || isPastDate}
                          onClick={() => handleDateSelect(date)}
                          className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm transition-all mx-auto
                            ${(!hasAvailability || isPastDate) ? 'text-slate-200 cursor-not-allowed' : ''}
                            ${isSelected 
                              ? 'bg-[#006bff] text-white shadow-md' 
                              : (hasAvailability && !isPastDate) ? 'text-[#006bff] bg-blue-50 hover:bg-[#006bff] hover:text-white' : ''
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
            /* PHASE 2: FORM */
            <div className="max-w-md animate-in fade-in slide-in-from-right-8 duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Enter Details</h2>
              <form onSubmit={handleScheduleEvent} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Name *</label>
                  <input required type="text" className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                  <input required type="email" className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Please share anything that will help prepare for our meeting.</label>
                  <textarea rows="3" className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#006bff]" value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)}></textarea>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="bg-[#006bff] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
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