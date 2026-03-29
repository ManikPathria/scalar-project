"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

export default function MeetingsPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [loading, setLoading] = useState(true);
  
  // NEW: Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Track the booking selected for the Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  async function fetchBookings() {
    setLoading(true);
    
    // Get current time in ISO format for the database query
    const now = new Date().toISOString();

    // Start building the Supabase query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        event_types (
          title,
          duration,
          color
        )
      `);

    // FIX: Let the database handle the date filtering instead of JavaScript
    if (activeTab === 'upcoming') {
      // Greater than or equal to now, ascending (soonest first)
      query = query.gte('booking_time', now).order('booking_time', { ascending: true });
    } else {
      // Less than now, descending (most recent past event first)
      query = query.lt('booking_time', now).order('booking_time', { ascending: false });
    }

    const { data, error } = await query;

    if (!error) {
      setBookings(data);
    } else {
      console.error("Error fetching bookings:", error);
    }
    setLoading(false);
  }

  const handleCancel = async (bookingId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this meeting?");
    if (!confirmCancel) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      alert("Error canceling booking: " + error.message);
    } else {
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
  };

  // NEW: Filter bookings based on the search term
  const filteredBookings = bookings.filter(b => 
    b.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.event_types?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl relative mx-auto p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scheduled Events</h1>
          <p className="text-slate-500 mt-1">View and manage your upcoming and past bookings.</p>
        </div>
        
        {/* NEW: Search Bar */}
        <div className="w-full md:w-72">
          <input 
            type="text"
            placeholder="Search name, email, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => { setActiveTab('upcoming'); setSearchTerm(''); }}
            className={`px-8 py-4 text-sm font-bold transition-all ${
              activeTab === 'upcoming' 
              ? 'border-b-2 border-[#006bff] text-[#006bff]' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => { setActiveTab('past'); setSearchTerm(''); }}
            className={`px-8 py-4 text-sm font-bold transition-all ${
              activeTab === 'past' 
              ? 'border-b-2 border-[#006bff] text-[#006bff]' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Past
          </button>
        </div>

        {/* Meetings List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-slate-400 animate-pulse">Loading meetings...</div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-6">
                  {/* Color Indicator Bar */}
                  <div 
                    className={`w-1.5 h-16 rounded-full shrink-0 ${activeTab === 'past' ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: booking.event_types?.color || '#006bff' }}
                  />
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {format(parseISO(booking.booking_time), 'EEEE, MMMM do')}
                      </span>
                      {/* NEW: Completed Badge for Past Events */}
                      {activeTab === 'past' && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold ${activeTab === 'past' ? 'text-slate-500' : 'text-slate-800'}`}>
                      {format(parseISO(booking.booking_time), 'h:mm a')} - {booking.guest_name}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Event: <span className="font-medium text-slate-700">{booking.event_types?.title}</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">{booking.guest_email}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="text-sm font-bold text-[#006bff] hover:underline px-4 py-2"
                  >
                    Details
                  </button>
                  
                  {activeTab === 'upcoming' ? (
                    <button 
                      onClick={() => handleCancel(booking.id)}
                      className="text-sm font-bold text-red-500 border border-red-100 px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      Cancel
                    </button>
                  ) : (
                    /* NEW: Email action for past events instead of Cancel */
                    <a 
                      href={`mailto:${booking.guest_email}?subject=Following up on our recent meeting`}
                      className="text-sm font-bold text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Email Guest
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                {searchTerm ? '🔍' : '📅'}
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {searchTerm ? 'No matching events found' : `No ${activeTab} events`}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search terms.' : 'When someone books a slot, it will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Meeting Details</h2>
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guest</p>
                <p className="text-lg font-bold text-slate-900">{selectedBooking.guest_name}</p>
                <p className="text-slate-600 text-sm">{selectedBooking.guest_email}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time & Date</p>
                <p className="text-slate-900 font-medium">
                  {format(parseISO(selectedBooking.booking_time), 'EEEE, MMMM do, yyyy')}
                </p>
                <p className="text-slate-600 text-sm">
                  {format(parseISO(selectedBooking.booking_time), 'h:mm a')}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Type</p>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedBooking.event_types?.color || '#006bff' }}
                  />
                  <p className="text-slate-900 font-medium">{selectedBooking.event_types?.title}</p>
                </div>
                <p className="text-slate-600 text-sm mt-1">{selectedBooking.event_types?.duration} minutes</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                 <button 
                    onClick={() => setSelectedBooking(null)}
                    className="bg-[#006bff] text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all"
                 >
                    Done
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}