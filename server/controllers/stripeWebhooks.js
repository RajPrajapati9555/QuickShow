import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";
export const stripeWebhooks = async (req, res) => {
  const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        {
          const session = event.data.object;
          const { bookingId } = session.metadata;
          if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, {
              isPaid: true,
              paymentLink: "",
            });
          }

          // send confirmation email
          await inngest.send({
            name: "app/show.booked",
            data: { bookingId },
          });

          break;
        }
      default:
        console.log("Unhandled event type", event.type);
        
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
