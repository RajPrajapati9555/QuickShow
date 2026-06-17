import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";

const TrailersSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>

      <div className="mt-6 flex justify-center relative">
        {/* Blur */}
        <BlurCircle top="-100px" right="-100px" />

        {/* 16:9 Wrapper */}
        <a
          href={currentTrailer.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative z-10 w-full max-w-[960px] aspect-video"
        >
          {/* Thumbnail */}
          <img
            src={currentTrailer.image}
            alt="Trailer Thumbnail"
            className="w-full h-full object-cover rounded-xl"
          />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-6 text-3xl group-hover:scale-110 transition">
              ▶
            </div>
          </div>
        </a>
      </div>

      <div className="group flex gap-4 md:gap-6 mt-8 max-w-6xl mx-auto overflow-x-auto">
        {dummyTrailers.map((trailer) => (
          <div
            key={trailer.image}
            className="relative flex-shrink-0 w-1/4 min-w-[260px] aspect-video hover:-translate-y-1 duration-300 transition cursor-pointer group-hover:not-hover:opacity-50"
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img
              src={trailer.image}
              alt="trailer"
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className="absolute top-1/2 left-1/2 w-6 md:w-10 h-6 md:h-10 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersSection;
