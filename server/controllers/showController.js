import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

//Api call to get now playing movies from TMDB Api
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      },
    );
    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api to add show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, showInput, price } = req.body;
    let movie = await Movie.findById(movieId);
    if (!movie) {
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),
      ]);
      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;
      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        taglines: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      // Add Movie to the database
      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];
    showInput.forEach((show) => {
      const showDate = show.date;
      show.times.forEach((time) => {
        let showDateTime;
        // If the client sent a full ISO datetime (contains a 'T' and timezone info or a date), parse directly
        if (time.includes("T") && (time.includes("Z") || time.includes("+") || time.includes("-"))) {
          showDateTime = new Date(time);
        } else if (time.includes("T")) {
          // time contains a time portion (but no timezone), keep it as-is by parsing in the server environment
          showDateTime = new Date(time);
        } else {
          // legacy format: time is just HH:MM, combine with date
          const dateTimeString = `${showDate}T${time}`;
          showDateTime = new Date(dateTimeString);
        }

        showsToCreate.push({
          movie: movie._id,
          showDateTime,
          showPrice: price,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

// triger Inngest event 
await inngest.send({
  name: "app/show.added",
  data: { movieTitle: movie.title },
});

    res.json({ success: true, message: "Shows added successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// api to get all shows from the database

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    const uniqueShows = new Set(shows.map((show) => show.movie));

    res.json({ success: true, shows: Array.from(uniqueShows) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// api to get single show from the database

export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);
    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if(!dateTime[date]){
        dateTime[date] = []

      }
      dateTime[date].push({time:show.showDateTime, showId: show._id})
      
    });
    res.json({success: true, movie, dateTime})
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
