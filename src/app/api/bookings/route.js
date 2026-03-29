import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request) {
  // Added meetingLink here (you can pass this from your frontend or generate it)
  const { eventId, guestName, guestEmail, startTime, eventTitle, meetingLink = "#" } = await request.json();

  // 1. Save to Supabase
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ 
      event_type_id: eventId, 
      guest_name: guestName, 
      guest_email: guestEmail, 
      booking_time: startTime 
    }]);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // 2. Setup Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 3. Email HTML Template (Calendly-style)
  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f6; padding: 40px 20px; color: #1a1a1a;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;">
        
        <div style="padding: 30px 40px; border-bottom: 1px solid #f0f0f0;">
          <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Confirmed</h2>
          <p style="font-size: 16px; color: #4d5055; line-height: 1.5; margin: 10px 0 0 0;">
            You are scheduled with <strong>Smart Slot</strong>.
          </p>
        </div>

        <div style="padding: 30px 40px;">
          <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">${eventTitle}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; font-size: 15px; color: #4d5055; vertical-align: top; width: 80px;">
                <strong>When</strong>
              </td>
              <td style="padding: 12px 0; font-size: 15px; color: #1a1a1a; font-weight: 500;">
                ${startTime}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 15px; color: #4d5055; vertical-align: top;">
                <strong>Who</strong>
              </td>
              <td style="padding: 12px 0; font-size: 15px; color: #1a1a1a;">
                ${guestName} <br/>
                <span style="color: #006bff;">${guestEmail}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 15px; color: #4d5055; vertical-align: top;">
                <strong>Where</strong>
              </td>
              <td style="padding: 12px 0; font-size: 15px; color: #1a1a1a;">
                Web Conference
              </td>
            </tr>
          </table>

          // <div style="margin-top: 35px; text-align: left;">
          //   <a href="${meetingLink}" target="_blank" style="display: inline-block; background-color: #006bff; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; font-size: 16px; text-align: center;">
          //     Join Meeting
          //   </a>
          // </div>
        </div>
        
      </div>

      <div style="text-align: center; margin-top: 25px; font-size: 13px; color: #888888;">
        Powered by <strong>Smart Slot</strong>
      </div>
    </div>
  `;

  // 4. Send Email
  try {
    await transporter.sendMail({
      from: '"Smart Slot" <no-reply@smartslot.com>',
      to: guestEmail,
      subject: `Confirmed: ${eventTitle} with Smart Slot`,
      html: emailHtml, // Inserted the new template here
    });
  } catch (err) {
    console.error("Email failed:", err);
  }

  return Response.json({ success: true });
}