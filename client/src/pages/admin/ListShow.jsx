import { Currency } from "lucide-react";
import React, { useEffect, useState } from "react";
// import { dummyShowsData } from "../../assets/assets";
import Skeleton from "../../components/admin/Skeleton";
import Title from "../../components/admin/Title";
import { dateFormate } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
// import { set } from "mongoose";

const ListShowSkeleton = () => (
  <>
    <Skeleton className="h-8 w-40 mb-2" />
    <div className="max-w-4xl mt-6 overflow-x-auto">
      <table className="w-full border-collapse rounded-md overflow-hidden text-wrap">
        <thead>
          <tr className="bg-primary/10 text-left">
            <th className="p-2 font-medium pl-5"><Skeleton className="h-4 w-24" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-20" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-28" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-16" /></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
              <td className="p-2 pl-5"><Skeleton className="h-4 w-32" /></td>
              <td className="p-2"><Skeleton className="h-4 w-28" /></td>
              <td className="p-2"><Skeleton className="h-4 w-12" /></td>
              <td className="p-2"><Skeleton className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const ListShow = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL;

  const { axios, getToken, user } = useAppContext();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      setShows(data.shows);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  };

  useEffect(() => {
    if (user) {
      getAllShows();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-wrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5 "> Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Total Bookings</th>
              <th className="p-2 font-medium">Earning</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show, index) => (
              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5 ">{show.movie.title}</td>
                <td className="p-2">{dateFormate(show.showDateTime)}</td>
                <td className="p-2">
                  {Object.keys(show.occupiedSeats || {}).length}
                </td>
                <td className="p-2">
                  {currency}
                  {Object.keys(show.occupiedSeats || {}).length * show.showPrice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <ListShowSkeleton />
  );
};

export default ListShow;

