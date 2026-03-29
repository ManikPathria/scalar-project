"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'overrides'

  // Weekly Schedule State
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

  // NEW: Date Overrides State
  const [overrides, setOverrides] = useState([]);

  // 1. FETCH EXISTING AVAILABILITY ON LOAD
  useEffect(() => {
    async function fetchAvailability() {
      const { data, error } = await supabase.from('availability').select('*');
      
      if (!error && data) {
        // Parse Weekly Hours (where specific_date is null)
        const weeklyData = data.filter(row => row.specific_date === null);
        const loadedSchedule = defaultSchedule.map((dayObj, index) => {
          const dbSlots = weeklyData.filter(row => row.day_of_week === index && row.is_active);
          if (dbSlots.length > 0) {
            return {
              ...dayObj,
              active: true,
              slots: dbSlots.map(s => ({ start: s.start_time.substring(0, 5), end: s.end_time.substring(0, 5) }))
            };
          }
          return { ...dayObj, active: false, slots: [] };
        });
        setSchedule(loadedSchedule);

        // Parse Date Overrides (where specific_date is NOT null)
        const overrideData = data.filter(row => row.specific_date !== null);
        const groupedOverrides = {};
        
        // Group slots by date
        overrideData.forEach(row => {
          if (!groupedOverrides[row.specific_date]) {
             groupedOverrides[row.specific_date] = { date: row.specific_date, slots: [] };
          }
          if (row.is_active && row.start_time && row.end_time) {
             groupedOverrides[row.specific_date].slots.push({
               start: row.start_time.substring(0, 5),
               end: row.end_time.substring(0, 5)
             });
          }
        });
        setOverrides(Object.values(groupedOverrides).sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
      setLoading(false);
    }
    fetchAvailability();
  }, []);

  // --- WEEKLY HANDLERS ---
  const toggleDay = (index) => {
    const newSchedule = [...schedule];
    newSchedule[index].active = !newSchedule[index].active;
    if (newSchedule[index].active && newSchedule[index].slots.length === 0) {
      newSchedule[index].slots = [{ start: "09:00", end: "17:00" }];
    }
    setSchedule(newSchedule);
  };
  const updateWeeklyTime = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };
  const addWeeklyInterval = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({ start: "09:00", end: "17:00" });
    setSchedule(newSchedule);
  };
  const removeWeeklyInterval = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    if (newSchedule[dayIndex].slots.length === 0) newSchedule[dayIndex].active = false;
    setSchedule(newSchedule);
  };

  // --- OVERRIDE HANDLERS ---
  const addOverrideDate = () => {
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    setOverrides([...overrides, { date: today, slots: [{ start: "09:00", end: "17:00" }] }]);
  };
  const updateOverrideDate = (oIdx, newDate) => {
    const newOverrides = [...overrides];
    newOverrides[oIdx].date = newDate;
    setOverrides(newOverrides);
  };
  const updateOverrideTime = (oIdx, slotIndex, field, value) => {
    const newOverrides = [...overrides];
    newOverrides[oIdx].slots[slotIndex][field] = value;
    setOverrides(newOverrides);
  };
  const addOverrideInterval = (oIdx) => {
    const newOverrides = [...overrides];
    newOverrides[oIdx].slots.push({ start: "09:00", end: "17:00" });
    setOverrides(newOverrides);
  };
  const removeOverrideInterval = (oIdx, slotIndex) => {
    const newOverrides = [...overrides];
    newOverrides[oIdx].slots.splice(slotIndex, 1);
    setOverrides(newOverrides);
  };
  const deleteOverride = (oIdx) => {
    const newOverrides = [...overrides];
    newOverrides.splice(oIdx, 1);
    setOverrides(newOverrides);
  };

  // 3. SAVE TO SUPABASE
  const handleSave = async () => {
    setIsSaving(true);
    const payload = [];
    
    // Package Weekly Slots
    schedule.forEach((dayObj, index) => {
      if (dayObj.active) {
        dayObj.slots.forEach(slot => {
          payload.push({ day_of_week: index, start_time: slot.start, end_time: slot.end, is_active: true, specific_date: null });
        });
      }
    });

    // Package Override Slots
    overrides.forEach(ov => {
      if (ov.slots.length > 0) {
        ov.slots.forEach(slot => {
          payload.push({ day_of_week: null, start_time: slot.start, end_time: slot.end, is_active: true, specific_date: ov.date });
        });
      } else {
        // If they deleted all slots for a date, save it as an "Unavailable" override
        payload.push({ day_of_week: null, start_time: null, end_time: null, is_active: false, specific_date: ov.date });
      }
    });

    // Wipe old schedule and insert the new one
    await supabase.from('availability').delete().neq('id', 0); 
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
    <div className="max-w-4xl relative mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Availability</h1>
        <p className="text-slate-500 mt-1">Configure your default working hours and specific date overrides.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('weekly')}
            className={`px-8 py-4 text-sm font-bold transition-all ${activeTab === 'weekly' ? 'border-b-2 border-[#006bff] text-[#006bff]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Weekly Hours
          </button>
          <button 
            onClick={() => setActiveTab('overrides')}
            className={`px-8 py-4 text-sm font-bold transition-all ${activeTab === 'overrides' ? 'border-b-2 border-[#006bff] text-[#006bff]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Date Overrides
          </button>
        </div>

        <div className="p-8 space-y-8 min-h-[400px]">
          {/* --- WEEKLY HOURS VIEW --- */}
          {activeTab === 'weekly' && schedule.map((item, dIdx) => (
            <div key={item.day} className="flex flex-col md:flex-row md:items-start gap-6 border-b border-slate-50 pb-6 last:border-0">
              <div className="w-40 flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={item.active} onChange={() => toggleDay(dIdx)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006bff]"></div>
                </label>
                <span className={`font-bold text-sm uppercase tracking-wide ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>{item.day}</span>
              </div>

              <div className="flex-1">
                {item.active ? (
                  <div className="space-y-3">
                    {item.slots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-3">
                        <input type="time" value={slot.start} onChange={(e) => updateWeeklyTime(dIdx, sIdx, 'start', e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none" />
                        <span className="text-slate-400">—</span>
                        <input type="time" value={slot.end} onChange={(e) => updateWeeklyTime(dIdx, sIdx, 'end', e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none" />
                        <button onClick={() => removeWeeklyInterval(dIdx, sIdx)} className="text-slate-400 hover:text-red-500 ml-2">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addWeeklyInterval(dIdx)} className="text-[#006bff] text-xs font-bold flex items-center gap-1 hover:underline mt-2">
                      + Add Interval
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm font-medium italic">Unavailable</span>
                )}
              </div>
            </div>
          ))}

          {/* --- DATE OVERRIDES VIEW --- */}
          {activeTab === 'overrides' && (
            <div>
              <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-center">
                <p className="text-slate-500 text-sm">Add specific dates where your hours differ from your regular weekly schedule.</p>
                <button onClick={addOverrideDate} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all">
                  + Add Date Override
                </button>
              </div>

              {overrides.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No date overrides set.</div>
              ) : (
                <div className="space-y-6">
                  {overrides.map((ov, oIdx) => (
                    <div key={oIdx} className="flex flex-col md:flex-row md:items-start gap-6 border border-slate-100 p-6 rounded-xl bg-slate-50 relative">
                      
                      <div className="w-48">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date</label>
                        <input 
                          type="date" 
                          value={ov.date} 
                          onChange={(e) => updateOverrideDate(oIdx, e.target.value)}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hours for this date</label>
                        {ov.slots.length > 0 ? (
                          <div className="space-y-3">
                            {ov.slots.map((slot, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-3">
                                <input type="time" value={slot.start} onChange={(e) => updateOverrideTime(oIdx, sIdx, 'start', e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none" />
                                <span className="text-slate-400">—</span>
                                <input type="time" value={slot.end} onChange={(e) => updateOverrideTime(oIdx, sIdx, 'end', e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] outline-none" />
                                <button onClick={() => removeOverrideInterval(oIdx, sIdx)} className="text-slate-400 hover:text-red-500 ml-2">✕</button>
                              </div>
                            ))}
                            <button onClick={() => addOverrideInterval(oIdx)} className="text-[#006bff] text-xs font-bold flex items-center gap-1 hover:underline mt-2">
                              + Add Interval
                            </button>
                          </div>
                        ) : (
                          <div className="py-2 text-sm text-slate-500 font-medium italic flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-400 rounded-full"></span> Unavailable (No times set)
                            <button onClick={() => addOverrideInterval(oIdx)} className="text-[#006bff] text-xs font-bold ml-4 hover:underline not-italic">
                              + Add times
                            </button>
                          </div>
                        )}
                      </div>

                      <button onClick={() => deleteOverride(oIdx)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 text-sm font-bold">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">All times are set in your local timezone.</p>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#006bff] text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
}