"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

export default function MeetingsPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [loading, setLoading] = useState(true);

  // NEW STATE: Track the booking selected for the Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  async function fetchBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        event_types (
          title,
          duration,
          color
        )
      `)
      .order('booking_time', { ascending: activeTab === 'upcoming' });

    if (!error) {
      const now = new Date();
      const filtered = data.filter(b => {
        const bTime = parseISO(b.booking_time);
        return activeTab === 'upcoming' ? isAfter(bTime, now) : isBefore(bTime, now);
      });
      setBookings(filtered);
    }
    setLoading(false);
  }

  // NEW FUNCTION: Handle Canceling a booking
  const handleCancel = async (bookingId) => {
    // Standard browser confirmation so you don't delete by accident
    const confirmCancel = window.confirm("Are you sure you want to cancel this meeting?");
    if (!confirmCancel) return;

    // Delete from Supabase
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      alert("Error canceling booking: " + error.message);
    } else {
      // Remove it from the UI immediately without needing to refresh
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
  };

  return (
    <div className="max-w-5xl relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Scheduled Events</h1>
        <p className="text-slate-500 mt-1">View and manage your upcoming and past bookings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-4 text-sm font-bold transition-all ${
              activeTab === 'upcoming' 
              ? 'border-b-2 border-[#006bff] text-[#006bff]' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
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
          ) : bookings.length > 0 ? (
            bookings.map((booking) => (
              <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-6">
                  {/* Color Indicator Bar */}
                  <div 
                    className="w-1.5 h-16 rounded-full shrink-0" 
                    style={{ backgroundColor: booking.event_types?.color || '#006bff' }}
                  />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {format(parseISO(booking.booking_time), 'EEEE, MMMM do')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {format(parseISO(booking.booking_time), 'h:mm a')} - {booking.guest_name}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Event: <span className="font-medium text-slate-700">{booking.event_types?.title}</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">{booking.guest_email}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  {/* ATTACHED DETAILS onClick */}
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="text-sm font-bold text-[#006bff] hover:underline px-4 py-2"
                  >
                    Details
                  </button>
                  
                  {/* ATTACHED CANCEL onClick */}
                  {activeTab === 'upcoming' && (
                    <button 
                      onClick={() => handleCancel(booking.id)}
                      className="text-sm font-bold text-red-500 border border-red-100 px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📅
              </div>
              <h3 className="text-lg font-bold text-slate-800">No {activeTab} events</h3>
              <p className="text-slate-500 text-sm mt-1">When someone books a slot, it will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW: DETAILS MODAL */}
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