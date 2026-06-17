/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favouriteMovies, setFavouriteMovies] = useState([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Fetch Shows (runs once)
  useEffect(() => {
    const loadShows = async () => {
      try {
        const { data } = await axios.get("/api/show/all");
        if (data.success) {
          setShows(data.shows);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadShows();
  }, []);

  // ✅ Check Admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      try {
        const { data } = await axios.get("/api/admin/is-admin", {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        });

        setIsAdmin(data.isAdmin);

        if (!data.isAdmin && location.pathname.startsWith("/admin")) {
          navigate("/");
          toast.error("You are not authorised to access admin dashboard");
        }
      } catch (error) {
        console.log(error);
      }
    };

    checkAdmin();
  }, [user, getToken, location.pathname, navigate]);

  const fetchFavouriteMovies = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get("/api/user/favourites", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setFavouriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ Fetch Favourite Movies
  useEffect(() => {
    fetchFavouriteMovies();
  }, [user, getToken]);

  const value = {
    axios,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favouriteMovies,
    fetchFavouriteMovies,
    image_base_url,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ✅ Custom Hook
export const useAppContext = () => useContext(AppContext);