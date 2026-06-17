import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };

    await User.create(userData);
  },
);

// Inngest functions to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  },
);

// Inngest functions to update user data in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  },
);

//Inngest function to cancel booking and release seats  of show aftr 10 minutes of booking created if payment is not made
const releaseseatsAndDeleteBooking = inngest.createFunction(
  {
    id: "release-seats-delete-booking",
    triggers: [{ event: "app/checkpayment" }],
  },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);
    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      // If payment is not made, release the seats and delete the booking
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(bookingId);
      }
    });
  },
);

// Send Booking confirmation email to user after successful payment
const sendBookingConfirmationEmail = inngest.createFunction(
  {
    id: "send-booking-confirmation-email",
    triggers: [{ event: "app/show.booked" }],
  },
  async ({ event, step }) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "Movie",
        },
      })
      .populate("user");

    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:10px;">
    
    <h2 style="color:#4CAF50;">🎟️ Booking Confirmed</h2>
    
    <p>Hi <strong>${booking.user.name}</strong>,</p>

    <p>
      Your booking for 
      <strong style="color:#F84565;">
        ${booking.show.movie.title}
      </strong> 
      is successfully confirmed.
    </p>

    <hr style="margin:15px 0;" />

    <p>
      <strong>📅 Date:</strong> 
      ${new Date(booking.show.showDateTime).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}
      <br/>

      <strong>⏰ Time:</strong> 
      ${new Date(booking.show.showDateTime).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}
      <br/>

      <strong>🎭 Seats:</strong> ${booking.bookedSeats.join(", ")}
      <br/>

      <strong>💳 Payment:</strong> Paid
    </p>

    <hr style="margin:15px 0;" />

    <p>🍿 Please arrive at least 15 minutes before showtime.</p>

    <p style="margin-top:20px;">
      Enjoy your movie! 🎉
    </p>

    <p>
      Thanks for booking with us,<br/>
      <strong>QuickShow Team</strong>
    </p>

  </div>
  `,
    });
  },
);

const sendShowRemainders = inngest.createFunction(
  {
    id: "send-show-remainders",
    triggers: [
      { cron: "*/15 * * * *" },
    ],
  },

  async ({ step }) => {
    const now = new Date();
    // target shows starting between 60 and 75 minutes from now (matches 15-min cron window)
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

    // prepare reminder tasks
    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showDateTime: { $gte: windowStart, $lte: windowEnd },
      }).populate("movie");

      const tasks = [];

      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;
        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if (userIds.length === 0) continue;
        const users = await User.find({ _id: { $in: userIds } }).select(
          "name email",
        );
        for (const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showDateTime: show.showDateTime,
          });
        }
      }
      return tasks;
    });

    if (reminderTasks.length === 0) {
      return { sent: 0, message: "No reminders to send" };
    }

    // send reminder emails
    const results = await step.run("send-all-reminders", async () => {
      return await Promise.allSettled(
        reminderTasks.map((task) =>
          sendEmail({
            to: task.userEmail,
            subject: `⏰ Reminder: "${task.movieTitle}" starts in 1 hour!`,
            body: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; background: #0f0f0f; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">🎬</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
        Show Reminder
      </h1>
      <p style="color: #a0aec0; margin: 8px 0 0; font-size: 14px;">
        Your movie starts very soon!
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">

      <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px;">
        Hi <strong style="color: #ffffff;">${task.userName}</strong>,
      </p>

      <p style="color: #a0aec0; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        This is your <strong style="color: #F84565;">1-hour reminder</strong> for:
      </p>

      <!-- Movie Card -->
      <div style="background: #1a1a2e; border: 1px solid #2d3748; border-left: 4px solid #F84565; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px;">
        <h2 style="color: #ffffff; margin: 0 0 16px; font-size: 20px;">
          🎥 ${task.movieTitle}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #718096; font-size: 13px; width: 40%;">📅 Date</td>
            <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">
              ${new Date(task.showDateTime).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096; font-size: 13px;">⏰ Show Time</td>
            <td style="padding: 6px 0; color: #F84565; font-size: 14px; font-weight: 700;">
              ${new Date(task.showDateTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096; font-size: 13px;">⚡ Starts In</td>
            <td style="padding: 6px 0;">
              <span style="background: #F84565; color: #ffffff; padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 700;">
                ~1 Hour
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Tip -->
      <div style="background: #1c2a1c; border: 1px solid #2d4a2d; border-radius: 10px; padding: 14px 18px; margin: 0 0 28px;">
        <p style="color: #68d391; margin: 0; font-size: 14px;">
          🍿 <strong>Tip:</strong> Please arrive at least <strong>15 minutes early</strong> to find your seat and settle in comfortably.
        </p>
      </div>

      <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        We hope you have a fantastic time. Sit back, relax, and enjoy the show!
      </p>

    </div>

    <!-- Footer -->
    <div style="background: #0a0a0a; padding: 20px 32px; border-top: 1px solid #1a1a1a; text-align: center;">
      <p style="color: #4a5568; font-size: 12px; margin: 0;">
        Enjoy your movie! 🎉 &nbsp;|&nbsp;
        <strong style="color: #718096;">QuickShow Team</strong>
      </p>
    </div>

  </div>
            `,
          }),
        ),
      );
    });

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;
    return { sent, failed, message: `Reminders sent: ${sent}, failed: ${failed}` };
  },
);

const sendShowNotification = inngest.createFunction(
  {
    id: "send-show-notifications",
    triggers: [{ event: "app/show.added" }],
  },
  async ({ event }) => {
    const { movieTitle } = event.data;

    const users = await User.find({});

    for (const user of users) {
      const userEmail = user.email;
      const userName = user.name;

      const subject = `New Show Added: "${movieTitle}" is now available!`;

      const body = `
     <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
  
  <h2 style="color: #2e7d32; margin-bottom: 16px;">
    🎬 New Show Now Available!
  </h2>

  <p style="font-size: 15px; color: #333;">
    Hello <strong>${userName}</strong>,
  </p>

  <p style="font-size: 15px; color: #555;">
    We’re excited to let you know that a new show for 
    <strong style="color: #d32f2f;">"${movieTitle}"</strong> 
    is now live and ready to watch.
  </p>

  <p style="font-size: 15px; color: #555;">
    Don’t miss out—grab your seat and enjoy the experience!
  </p>

  <div style="margin: 24px 0; text-align: center;">
    <a href="https://quickshow-six-alpha.vercel.app/" style="background-color: #4CAF50; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">
      Book Now
    </a>
  </div>

  <p style="font-size: 13px; color: #999;">
    If you have any questions, feel free to reach out to our support team.
  </p>

  <p style="font-size: 13px; color: #999;">
    Best regards,<br/>
    <strong>Team QuickShow</strong>
  </p>

</div>
    `;

      await sendEmail({
        to: userEmail,
        subject,
        body,
      });
    }
    return { message: `Notifications sent for new show "${movieTitle}"` };
  },
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseseatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowRemainders,
  sendShowNotification,
];
