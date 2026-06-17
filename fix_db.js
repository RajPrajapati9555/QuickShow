import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Movie from './server/models/Movie.js';

dotenv.config({ path: './server/.env' });

const updateMovies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const movies = await Movie.find({});
    console.log(`Found ${movies.length} movies in DB.`);

    for (let movie of movies) {
      if (!movie.casts || movie.casts.length === 0) {
        console.log(`Updating movie ${movie.title} (${movie._id})...`);
        const creditsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie._id}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        });
        
        movie.casts = creditsRes.data.cast;
        
        // Also fetch details just in case genres are missing due to the previous 'geners' typo
        const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie._id}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        });
        movie.genres = detailsRes.data.genres;

        await Movie.findByIdAndUpdate(movie._id, { casts: movie.casts, genres: movie.genres });
        console.log(`Updated ${movie.title} successfully.`);
      } else {
        console.log(`Movie ${movie.title} already has casts.`);
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

updateMovies();
