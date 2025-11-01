import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/Components/ui/Card";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function StreakCard({ streak = 0, startDate = "2025-10-25" }) {
  const isActive = streak > 0;
  const [showPopup, setShowPopup] = useState(false);
  const [longestStreak, setLongestStreak] = useState(0);
  const [period, setPeriod] = useState("");

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date();
    const options = { month: "short", day: "numeric" };
    setPeriod(`${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`);
  }, [startDate]);

  useEffect(() => {
    const savedLongest = parseInt(localStorage.getItem("longestStreak") || "0", 10);
    if (streak > savedLongest) {
      localStorage.setItem("longestStreak", streak);
      setLongestStreak(streak);
    } else {
      setLongestStreak(savedLongest);
    }
  }, [streak]);

  useEffect(() => {
    if (!isActive) return;

    const today = new Date().toISOString().split("T")[0];
    const lastShownDate = localStorage.getItem("streakPopupShown");

    if (lastShownDate !== today) {
      setShowPopup(true);
      localStorage.setItem("streakPopupShown", today);
    }
  }, [isActive]);

  // Close popup when user clicks anywhere
  useEffect(() => {
    const handleClick = () => setShowPopup(false);
    if (showPopup) {
      document.addEventListener("click", handleClick);
    }
    return () => document.removeEventListener("click", handleClick);
  }, [showPopup]);

  return (
    <>
      
      {/* DevSync Popup */}
<AnimatePresence>
  {showPopup && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setShowPopup(false)}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative max-w-sm w-full rounded-3xl px-8 py-10 border border-[var(--border)] shadow-lg text-center bg-[var(--background)] overflow-hidden"
      >
        {/* ✨ Top text */}
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-[var(--foreground)] mb-6"
        >
          Another streak day locked in!
        </motion.h3>

        {/* Flame + Animation (center) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="relative flex items-center justify-center mb-6"
        >
          {/* Background animation */}
          <DotLottieReact
            src="/animations/Celebration.lottie"
            autoplay
            loop={false}  //  plays only once
            className="absolute w-60 h-60"
          />

          {/* Flame icon in front */}
          <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center bg-transparent border-2 border-orange-500 shadow-[0_0_25px_rgba(255,140,0,0.5)]">
            <Flame size={60} className="text-orange-500 fill-orange-500" />
          </div>
        </motion.div>

        {/*  Bottom text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-2 text-base text-[var(--muted-foreground)] font-medium"
        >
          You’re keeping your{" "}
          <span className="text-orange-500 font-semibold">DevSync</span> streak alive ✨
        </motion.p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


  



      {/* Main Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ translateY: -4 }}
        className="w-full flex justify-center"
      >
        <Card className="flex flex-col items-center justify-center p-4 sm:p-6 w-full sm:w-auto hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-col items-center gap-3">
            <motion.div
              animate={
                isActive
                  ? { scale: [1, 1.08, 1], opacity: [1, 0.9, 1] }
                  : {}
              }
              transition={{ duration: 1.3, repeat: isActive ? Infinity : 0 }}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                isActive ? "border-orange-500" : "border-[var(--border)]"
              }`}
            >
              <Flame
                size={42}
                className={`${
                  isActive
                    ? "text-orange-500 fill-orange-500"
                    : "text-[var(--muted-foreground)] fill-transparent"
                } transition-all duration-300`}
              />
            </motion.div>

            <div className="flex flex-col items-center">
              <span
                className={`font-semibold text-lg ${
                  isActive ? "text-orange-500" : "text-[var(--foreground)]"
                }`}
              >
                {streak} Days
              </span>
              <p className="text-xs text-[var(--muted-foreground)]">
                Current Streak
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center text-center mt-2">
            <p className="text-sm text-[var(--muted-foreground)]">
              Period: <span className="text-[var(--foreground)]">{period}</span>
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Longest Streak:{" "}
              <span className="text-orange-500 font-medium">
                {longestStreak} days
              </span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
