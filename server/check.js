import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';

dotenv.config({ path: './.env' });

const checkBookings = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/quickshow`);
    console.log("Connected to DB.");

    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings in DB:`);
    console.log(bookings);

    for(let b of bookings) {
      console.log('Populating booking', b._id);
      const pop = await Booking.findById(b._id).populate({ path: 'show', populate: { path: 'movie' } });
      console.log('Populated booking:', JSON.stringify(pop, null, 2));
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

checkBookings();
