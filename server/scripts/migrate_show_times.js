import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from '../models/Show.js';

dotenv.config({ path: '../server/.env' });

const MS_PER_HOUR = 60 * 60 * 1000;

const usage = () => {
  console.log('Usage: node migrate_show_times.js <offsetHours>');
  console.log('Example: node migrate_show_times.js -3   # subtract 3 hours from all showDateTime');
  process.exit(1);
};

const run = async () => {
  const offsetArg = process.argv[2];
  if (!offsetArg || isNaN(Number(offsetArg))) return usage();
  const offsetHours = Number(offsetArg);

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const shows = await Show.find({});
  console.log(`Found ${shows.length} shows`);

  for (const show of shows) {
    const old = show.showDateTime;
    if (!old) continue;
    const newDate = new Date(old.getTime() + offsetHours * MS_PER_HOUR);
    await Show.findByIdAndUpdate(show._id, { showDateTime: newDate });
    console.log(`Updated ${show._id}: ${old.toISOString()} -> ${newDate.toISOString()}`);
  }

  console.log('Migration complete.');
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
