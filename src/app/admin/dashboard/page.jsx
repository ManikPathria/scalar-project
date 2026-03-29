"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track which link was just copied for UX feedback
  const [copiedSlug, setCopiedSlug] = useState(null); 
  
  // Track which event card's settings menu is currently open
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '', 
    duration: 30,
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setEventTypes(data);
    setLoading(false);
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('event_types')
      .insert([formData])
      .select();

    if (error) {
      alert("Error: " + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ title: '', duration: 30, slug: '', description: '' }); 
      fetchEvents(); 
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this event type?");
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('event_types')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting event: " + error.message);
    } else {
      fetchEvents(); 
    }
  };

  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10 pb-8 border-b">
        <h1 className="text-3xl font-bold">Event Types</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#006bff] text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-all"
        >
          + Create New Event
        </button>
      </header>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-4">
            <h2 className="text-2xl font-bold mb-4">New Event Type</h2>
            
            <div>
              <label className="block text-sm font-bold mb-1">Event Name</label>
              <input 
                required
                className="w-full border p-3 rounded-lg" 
                placeholder="e.g. Quick Sync"
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Duration (mins)</label>
              <select 
                className="w-full border p-3 rounded-lg"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">URL Slug</label>
              <input 
                required
                className="w-full border p-3 rounded-lg" 
                placeholder="quick-sync"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="font-bold text-slate-500 hover:text-slate-800">Cancel</button>
              <button type="submit" className="bg-[#006bff] text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* CARDS GRID */}
      {loading ? (
        <p className="text-slate-500">Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventTypes.map((event) => (
            <div key={event.id} className="bg-white border rounded-xl p-6 shadow-sm relative overflow-visible flex flex-col hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#006bff] rounded-t-xl" />
              
              {/* Calendly-style Settings Menu */}
              <div className="absolute top-5 right-5">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold pb-2 focus:outline-none"
                >
                  ⚙️
                </button>

                {/* The Dropdown Menu */}
                {openMenuId === event.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden">
                    <button 
                      onClick={() => {
                        handleDelete(event.id);
                        setOpenMenuId(null); 
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition-colors"
                    >
                      Delete Event
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold pr-8">{event.title}</h3> 
              <p className="text-slate-500 text-sm flex-grow mt-2">{event.duration} mins</p>
              
              {/* Bottom Actions */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100">
                <Link 
                  href={`/book/${event.slug}`} 
                  className="text-[#006bff] text-sm font-bold hover:underline"
                >
                  View
                </Link>
                
                <button 
                  onClick={() => handleCopyLink(event.slug)}
                  className="text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors"
                >
                  {copiedSlug === event.slug ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}