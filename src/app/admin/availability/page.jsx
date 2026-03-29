"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initial default state
  const defaultSchedule = [
    { day: "Sunday", active: false, slots: [] },
    { day: "Monday", active: true, slots: [{ start: "09:00", end: "17:00" }] },
    { day: "Tuesday", active: true, slots: [{ start: "09:00", end: "17:00" }] },
    { day: "Wednesday", active: true, slots: [{ start: "09:00", end: "17:00" }] },
    { day: "Thursday", active: true, slots: [{ start: "09:00", end: "17:00" }] },
    { day: "Friday", active: true, slots: [{ start: "09:00", end: "17:00" }] },
    { day: "Saturday", active: false, slots: [] },
  ];

  const [schedule, setSchedule] = useState(defaultSchedule);

  // 1. FETCH EXISTING AVAILABILITY ON LOAD
  useEffect(() => {
    async function fetchAvailability() {
      const { data, error } = await supabase.from('availability').select('*');
      
      if (!error && data.length > 0) {
        // Map database rows back to our UI state
        const loadedSchedule = defaultSchedule.map((dayObj, index) => {
          const dbSlots = data.filter(row => row.day_of_week === index && row.is_active);
          if (dbSlots.length > 0) {
            return {
              ...dayObj,
              active: true,
              slots: dbSlots.map(s => ({ 
                start: s.start_time.substring(0, 5), // '09:00:00' -> '09:00'
                end: s.end_time.substring(0, 5) 
              }))
            };
          }
          return { ...dayObj, active: false, slots: [] };
        });
        setSchedule(loadedSchedule);
      }
      setLoading(false);
    }
    fetchAvailability();
  }, []);

  // 2. UI HANDLERS
  const toggleDay = (index) => {
    const newSchedule = [...schedule];
    newSchedule[index].active = !newSchedule[index].active;
    if (newSchedule[index].active && newSchedule[index].slots.length === 0) {
      newSchedule[index].slots = [{ start: "09:00", end: "17:00" }];
    }
    setSchedule(newSchedule);
  };

  const updateTime = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const addInterval = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({ start: "09:00", end: "17:00" });
    setSchedule(newSchedule);
  };

  const removeInterval = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    
    // If no slots left, turn the day off completely
    if (newSchedule[dayIndex].slots.length === 0) {
      newSchedule[dayIndex].active = false;
    }
    setSchedule(newSchedule);
  };

  // 3. SAVE TO SUPABASE
  const handleSave = async () => {
    setIsSaving(true);
    
    // Format the UI state into database rows
    const payload = [];
    schedule.forEach((dayObj, index) => {
      if (dayObj.active) {
        dayObj.slots.forEach(slot => {
          payload.push({
            day_of_week: index,
            start_time: slot.start,
            end_time: slot.end,
            is_active: true
          });
        });
      }
    });

    // Wipe old schedule and insert the new one
    await supabase.from('availability').delete().neq('id', 0); // Delete all rows
    const { error } = await supabase.from('availability').insert(payload);

    setIsSaving(false);
    if (error) {
      alert("Error saving availability: " + error.message);
    } else {
      alert("Availability saved successfully!");
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading schedule...</div>;

  return (
    <div className="max-w-4xl relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Availability</h1>
        <p className="text-slate-500 mt-1">Configure your default working hours.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Tabs Pattern */}
        <div className="flex border-b border-slate-100">
          <button className="px-8 py-4 text-sm font-bold border-b-2 border-[#006bff] text-[#006bff]">
            Weekly Hours
          </button>
          <button className="px-8 py-4 text-sm font-bold text-slate-400 hover:text-slate-600">
            Date Overrides
          </button>
        </div>

        <div className="p-8 space-y-8">
          {schedule.map((item, dIdx) => (
            <div key={item.day} className="flex flex-col md:flex-row md:items-start gap-6 border-b border-slate-50 pb-6 last:border-0">
              
              {/* Day Toggle Area */}
              <div className="w-40 flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={item.active}
                    onChange={() => toggleDay(dIdx)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006bff]"></div>
                </label>
                <span className={`font-bold text-sm uppercase tracking-wide ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.day}
                </span>
              </div>

              {/* Time Slots Area */}
              <div className="flex-1">
                {item.active ? (
                  <div className="space-y-3">
                    {item.slots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-3">
                        <input 
                          type="time" 
                          value={slot.start}
                          onChange={(e) => updateTime(dIdx, sIdx, 'start', e.target.value)}
                          className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none"
                        />
                        <span className="text-slate-400">—</span>
                        <input 
                          type="time" 
                          value={slot.end}
                          onChange={(e) => updateTime(dIdx, sIdx, 'end', e.target.value)}
                          className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none"
                        />
                        {/* ATTACHED REMOVE HANDLER */}
                        <button 
                          onClick={() => removeInterval(dIdx, sIdx)}
                          className="text-slate-400 hover:text-red-500 ml-2 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    ))}
                    {/* ATTACHED ADD HANDLER */}
                    <button 
                      onClick={() => addInterval(dIdx)}
                      className="text-[#006bff] text-xs font-bold flex items-center gap-1 hover:underline mt-2"
                    >
                      <span>+</span> Add New Interval
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm font-medium italic">Unavailable</span>
                )}
              </div>

              {/* Action Buttons Pattern */}
              <div className="w-10 flex justify-end">
                <button className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Footer Pattern */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">All times are set in your local timezone.</p>
            {/* ATTACHED SAVE HANDLER */}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#006bff] text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
}