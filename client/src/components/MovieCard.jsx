import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFromate from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();
  return (
    <div className="flex flex-col justify-between p-2.5 sm:p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300">
      <img
        onClick={() => {
          navigate(`/movies/${movie._id}`);
          scrollTo(0, 0);
        }}
        src={image_base_url + movie.poster_path}
        alt=""
        className="rounded-lg h-36 sm:h-52 w-full object-cover object-center cursor-pointer"
      />

      <p className="font-semibold text-sm sm:text-base mt-2 sm:mt-3 truncate">{movie.title}</p>

      <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 truncate">
        {new Date(movie.release_date).getFullYear()} •{" "}
        {(movie.genres || [])
          .slice(0, 2)
          .map((genre) => genre.name)
          .join(" | ")}{" "}
        • {timeFromate(movie.runtime)}
      </p>

      <div className="flex items-center justify-between mt-3 sm:mt-4 gap-1">
        <button
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer truncate"
        >
          Buy Ticket
        </button>

        <p className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm flex-shrink-0">
          <StarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
