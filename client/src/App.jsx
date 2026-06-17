import React from "react";
import Navbar from "./components/Navbar.jsx";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Movies from "./pages/Movies.jsx";
import MovieDetail from "./pages/MovieDetail.jsx";
import SeatLayout from "./pages/SeatLayout.jsx";

import Favourite from "./pages/Favourite.jsx";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer.jsx";
import HeroSection from "./components/HeroSection.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Layout from "./pages/admin/Layout.jsx";
import AddShows from "./pages/admin/AddShows.jsx";
import DashBoard from "./pages/admin/DashBoard.jsx";
import ListShow from "./pages/admin/ListShow.jsx";
import ListBookings from "./pages/admin/ListBookings.jsx";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";
import Loading from "./components/Loading.jsx";

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith("/admin");
  const { user, isAdmin } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      {/* <HeroSection /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="/loading/:nextUrl" element={<Loading />} />
        <Route path="favourite" element={<Favourite />} />
        <Route
          path="/admin/*"
          element={
            user ? (
              isAdmin ? (
                <Layout />
              ) : (
                <div className="min-h-screen flex justify-center items-center">
                  <p className="text-xl font-semibold text-red-500">
                    Not Authorized
                  </p>
                </div>
              )
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                <SignIn fallbackRedirectUrl={"/admin"} />
              </div>
            )
          }
        >
          <Route index element={<DashBoard />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShow />} />
          <Route path="list-bookings" element={<ListBookings />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
