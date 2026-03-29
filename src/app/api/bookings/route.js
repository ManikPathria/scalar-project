import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const { eventId, guestName, guestEmail, startTime, eventTitle } = await request.json();

  if (!eventId || !guestName || !guestEmail || !startTime || !eventTitle) {
    return Response.json({ error: 'Missing required booking fields.' }, { status: 400 });
  }

  // 1. Block duplicate slot bookings for the same event type
  const { data: conflictingBooking, error: conflictError } = await supabase
    .from('bookings')
    .select('id')
    .eq('event_type_id', eventId)
    .eq('booking_time', startTime)
    .limit(1);

  if (conflictError) {
    return Response.json({ error: conflictError.message }, { status: 500 });
  }

  if (conflictingBooking && conflictingBooking.length > 0) {
    return Response.json({ error: 'This slot is already booked.' }, { status: 409 });
  }

  // 2. Save to Supabase
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ 
      event_type_id: eventId, 
      guest_name: guestName, 
      guest_email: guestEmail, 
      booking_time: startTime 
    }]);

  if (error?.code === '23505') {
    return Response.json({ error: 'This slot is already booked.' }, { status: 409 });
  }
  if (error) return Response.json({ error: error.message }, { status: 400 });

  // 3. Setup Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 4. Email HTML Template (clean + simple)
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 24px; color: #111827;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #e5e7eb;">
        <div style="padding: 24px; border-bottom: 1px solid #f3f4f6;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Meeting Scheduled</h2>
          <p style="margin: 10px 0 0 0; font-size: 15px; color: #4b5563;">
            Your meeting has been successfully scheduled with Smart Slot.
          </p>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700;">${eventTitle}</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; vertical-align: top; width: 70px;">
                <strong>When</strong>
              </td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">
                ${startTime}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; vertical-align: top;">
                <strong>Who</strong>
              </td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827;">
                ${guestName} <br/>
                <span style="color: #2563eb;">${guestEmail}</span>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div style="text-align: center; margin-top: 16px; font-size: 12px; color: #9ca3af;">
        Smart Slot
      </div>
    </div>
  `;

  // 5. Send Email
  try {
    await transporter.sendMail({
      from: '"Smart Slot" <no-reply@smartslot.com>',
      to: guestEmail,
      subject: `Meeting Scheduled: ${eventTitle}`,
      html: emailHtml,
    });
  } catch (err) {
    console.error("Email failed:", err);
  }

  return Response.json({ success: true });
}
