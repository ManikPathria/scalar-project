import { 
  parse, 
  addMinutes, 
  isBefore, 
  format, 
  isSameDay, 
  parseISO 
} from 'date-fns';

/**
 * Generates available time slots for a specific date
 * @param {string} selectedDate - Format 'YYYY-MM-DD'
 * @param {Object} dayConfig - { start_time: '09:00', end_time: '17:00' }
 * @param {Array} existingBookings - Array of booking objects from DB
 * @param {number} duration - Event duration in minutes
 */
export const generateAvailableSlots = (selectedDate, dayConfig, existingBookings, duration) => {
  if (!dayConfig || !dayConfig.is_active) return [];

  const slots = [];
  
  // Create Date objects for the start and end of the working day
  let currentSlot = parse(`${selectedDate} ${dayConfig.start_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
  const workEndTime = parse(`${selectedDate} ${dayConfig.end_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());

  while (isBefore(currentSlot, workEndTime)) {
    const slotEnd = addMinutes(currentSlot, duration);

    // Ensure the event doesn't end after work hours
    if (isBefore(addMinutes(workEndTime, 1), slotEnd)) break;

    // Check for overlaps with existing bookings
    const isConflict = existingBookings.some((booking) => {
      const bStart = new Date(booking.booking_time);
      const bEnd = addMinutes(bStart, duration);
      
      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return currentSlot < bEnd && slotEnd > bStart;
    });

    if (!isConflict) {
      slots.push(format(currentSlot, 'HH:mm'));
    }

    // Move to the next slot (Calendly style: slots start every 'duration' mins)
    currentSlot = slotEnd; 
  }

  return slots;
};