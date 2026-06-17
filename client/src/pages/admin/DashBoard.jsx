import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  StarIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Skeleton from "../../components/admin/Skeleton";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { dateFormate } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const DashBoardSkeleton = () => (
  <>
    {/* Title skeleton */}
    <Skeleton className="h-8 w-48 mb-2" />

    {/* Stat cards skeleton */}
    <div className="relative flex flex-wrap gap-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/10 rounded-md max-w-50 w-full"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>

    {/* Active Shows heading skeleton */}
    <Skeleton className="mt-10 h-5 w-32" />

    {/* Movie card skeletons */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 max-w-5xl">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="w-55 rounded-lg overflow-hidden pb-3 bg-primary/5 border border-primary/10"
        >
          <Skeleton className="h-60 w-full rounded-none" />
          <div className="p-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-3 w-24 mt-1" />
          </div>
        </div>
      ))}
    </div>
  </>
);

const DashBoard = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY_SYMBOL;
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const dashboardCards = [
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings || "0",
      icon: ChartLineIcon,
    },
    {
      title: "Total Revenue",
      value: `${currency} ${dashboardData.totalRevenue || "0"}`,
      icon: CircleDollarSignIcon,
    },
    {
      title: "Active Shows",
      value: dashboardData.activeShows.length || "0",
      icon: PlayCircleIcon,
    },
    {
      title: "Total Users",
      value: dashboardData.totalUsers || "0",
      icon: UserIcon,
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      if (data.success) {
        setDashboardData(data.dashboardData);
        setLoading(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Dashboard data error:", error);
      toast.error("Failed to fetch dashboard data", error);
    }
  };

  const handleDeleteShow = async (showId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this active show? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const { data } = await axios.delete(`/api/admin/delete-show/${showId}`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      if (data.success) {
        toast.success(data.message);
        setDashboardData((prev) => ({
          ...prev,
          activeShows: prev.activeShows.filter((s) => s._id !== showId),
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Delete show error:", error);
      toast.error("Failed to delete show");
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full"
              >
                <div>
                  <h1 className="text-sm">{card.title}</h1>
                  <p className="text-xl font-medium mt-1">{card.value}</p>
                </div>

                {/* ICON */}
                <Icon className="w-8 h-8 text-primary" />
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-10 text-lg font-medium"> Active Shows</p>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10" />
        {dashboardData.activeShows.map((show) => (
          <div
            key={show._id}
            className="relative group w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300"
          >
            {/* Remove button */}
            <button
              onClick={() => handleDeleteShow(show._id)}
              className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-red-500/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Remove show"
            >
              <XCircleIcon className="w-6 h-6 text-white" />
            </button>
            <img
              src={image_base_url + show.movie.poster_path}
              alt=""
              className="h-60 w-full object-cover"
            />
            <p className="font-medium p-2 truncate">{show.movie.title}</p>
            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">
                {currency} {show.showPrice}
              </p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>
            <p className="px-2 pt-2 text-sm text-gray-500 ">
              {dateFormate(show.showDateTime)}
            </p>
          </div>
        ))}
      </div>
    </>
  ) : (
    <DashBoardSkeleton />
  );
};

export default DashBoard;

