import React, { useEffect, useState } from "react";
import Skeleton from "../../components/admin/Skeleton";
import Title from "../../components/admin/Title";
import { dateFormate } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";

const ListBookingsSkeleton = () => (
  <>
    <Skeleton className="h-8 w-40 mb-2" />
    <div className="max-w-4xl mt-6 overflow-x-auto">
      <table className="w-full border-collapse rounded-md overflow text-nowrap">
        <thead>
          <tr className="bg-primary/10 text-left">
            <th className="p-2 font-medium pl-5"><Skeleton className="h-4 w-20" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-24" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-20" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-14" /></th>
            <th className="p-2 font-medium"><Skeleton className="h-4 w-16" /></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
              <td className="p-2 pl-5"><Skeleton className="h-4 w-28" /></td>
              <td className="p-2"><Skeleton className="h-4 w-32" /></td>
              <td className="p-2"><Skeleton className="h-4 w-28" /></td>
              <td className="p-2"><Skeleton className="h-4 w-20" /></td>
              <td className="p-2"><Skeleton className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL;

  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [user]);


  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((item, index) => {
              // Defensive rendering: some bookings may reference a deleted show
              if (!item.show || !item.show.movie) {
                return (
                  <tr
                    key={index}
                    className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                  >
                    <td className="p-2 min-w-45 pl-5">{item.user?.name || 'Unknown'}</td>
                    <td className="p-2">Show removed</td>
                    <td className="p-2">-</td>
                    <td className="p-2">
                      {Object.keys(item.bookedSeats || {})
                        .map((seat) => item.bookedSeats[seat])
                        .join(", ")}
                    </td>
                    <td className="p-2">
                      {currency}
                      {item.amount}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={index}
                  className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                >
                  <td className="p-2 min-w-45 pl-5">{item.user?.name}</td>
                  <td className="p-2">{item.show.movie.title}</td>
                  <td className="p-2">{dateFormate(item.show.showDateTime)}</td>
                  <td className="p-2">
                    {Object.keys(item.bookedSeats || {})
                      .map((seat) => item.bookedSeats[seat])
                      .join(", ")}
                  </td>
                  <td className="p-2">
                    {currency}
                    {item.amount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <ListBookingsSkeleton />
  );
};

export default ListBookings;

