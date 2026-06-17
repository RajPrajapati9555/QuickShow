import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Loading = () => {
  const { nextUrl } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();

  useEffect(() => {
    if (!nextUrl) return;

    const verify = async () => {
      // Stripe appends ?session_id=... on success redirect
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (sessionId) {
        try {
          await axios.post("/api/booking/verify-payment", { sessionId });
        } catch (err) {
          console.log("Payment verification error:", err);
        }
      }

      // Navigate after verification (or after short wait if no session_id)
      setTimeout(() => {
        navigate("/" + nextUrl);
      }, sessionId ? 1500 : 3000);
    };

    verify();
  }, [nextUrl, navigate, axios]);

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-primary"></div>
    </div>
  );
};

export default Loading;
