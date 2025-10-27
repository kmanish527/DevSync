"use client"
import { motion, AnimatePresence } from "framer-motion";
import { SiLeetcode } from "react-icons/si";
import { useEffect, useState,useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltipJS,
  Legend,
} from "chart.js";
import { Line as ChartLine } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import BackButton from "../ui/backbutton";

// 👇 Imported for new UI section
/* ✅ Integrated Chart Component with Detailed Tooltip */
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
} from "@/Components/ui/Card"
import {
  ChartContainer,
  ChartTooltip,
} from "@/Components/ui/chart"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltipJS, Legend);

export default function LeetCode({ platforms = {} }) {
  const [stats, setStats] = useState(null);
  const { leetUser } = useParams();

  useEffect(() => {
    const fetchStats = async () => {
      if (!leetUser) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/leetcode/${leetUser}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setStats(json.data);
      } catch (e) {
        console.error("LeetCode fetch error:", e);
        setStats(null);
      }
    };
    fetchStats();
  }, [leetUser]);

  if (!stats) return <p>Loading LeetCode data...</p>;

  const {
    username,
    profile,
    badges = [],
    contestRating,
    contestHistory = [],
    recentSubmissions = [],
    submissionCalendar,
  } = stats;

  const calendarData = Object.entries(submissionCalendar).map(([timestamp, count]) => ({
    date: new Date(Number(timestamp) * 1000).toISOString().split("T")[0],
    count: parseInt(count, 10),
  }));

  const startDate = new Date("2025-01-01");
  const endDate = new Date();

  const attendedContests = contestHistory.filter((c) => c.attended);

  // ✅ Recharts data aligned with backend
  const rechartsData = attendedContests.map((c) => ({
    contestName: c.contest?.title || c.title || "Contest",
    date: c.contest?.startTime
      ? new Date(c.contest.startTime).toISOString().split("T")[0]
      : "Unknown",
    rating: c.rating || 0,
  }));

  // Original chart.js data (kept intact)
  const labels = attendedContests.map((c) =>
    new Date(c.contest.startTime).toLocaleDateString()
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Contest Rating",
        data: attendedContests.map((c) => c.rating),
        borderColor: "#FFA116",
        backgroundColor: "#FFA116",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#FFA116", font: { size: 12 } } },
      title: {
        display: true,
        text: "LeetCode Contest Rating Over Time",
        color: "#FFA116",
        font: { size: 14 },
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        ticks: {
          color: "#FFA116",
          maxRotation: 45,
          minRotation: 45,
          font: { size: 11 },
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: { color: "#444" },
      },
      y: {
        ticks: { color: "#FFA116", font: { size: 11 } },
        grid: { color: "#444" },
        beginAtZero: false,
      },
    },
  };

  const difficultyColor = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
  };

  return (
    <>
      <BackButton />
      <div className="w-full min-h-screen p-10 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile?.avatar || "/default-avatar.png"}
              alt={`${username || "LeetCode"} avatar`}
              className="w-16 h-16 rounded-full border-4 border-yellow-500"
            />
            <div>
              <h3 className="text-2xl font-semibold text-[#FFA116] flex items-center gap-2 truncate">
                <SiLeetcode size={28} /> {username || "LeetCode"}
              </h3>
              {profile?.ranking && (
                <p className="text-sm text-muted-foreground mt-1">
                  Global Rank: <span className="font-semibold">#{profile.ranking}</span>
                </p>
              )}
              {badges.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {badges.map(({ id, icon, displayName }) => (
                    <img
                      key={id}
                      src={icon && icon.startsWith("https://") ? icon : `https://leetcode.com${icon || ''}`}
                      alt={displayName}
                      title={displayName}
                      className="w-6 h-6 rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <a
            href={`https://leetcode.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FFA116] text-black px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition"
          >
            View on LeetCode
          </a>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Problems Solved</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {stats.submitStatsGlobal?.map(({ difficulty, count }) => (
                <div key={difficulty}>
                  <p className="text-sm capitalize text-muted-foreground">{difficulty}</p>
                  <p className={`text-2xl font-bold ${difficultyColor[difficulty] || ""}`}>{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shadow-sm col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Recent Submissions</h3>
            {recentSubmissions.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground max-h-[130px] overflow-y-auto">
                {recentSubmissions.slice(0, 3).map(({ id, title, timestamp }) => (
                  <li key={id} className="flex justify-between whitespace-nowrap">
                    <span className="truncate">{title}</span>
                    <span className="ml-3 text-xs">{new Date(timestamp).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No recent activity found.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Submission Heatmap</h3>
            <ReactCalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={calendarData}
              showWeekdayLabels={false}
              classForValue={(value) => {
                if (!value) return "fill-inherit";
                if (value.count >= 10) return "fill-green-500";
                if (value.count >= 5) return "fill-green-400";
                return "fill-green-300";
              }}
              tooltipDataAttrs={(value) => ({
                "data-tip": value ? `Submissions: ${value.count}` : "No submissions",
              })}
            />
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Contest Stats</h3>
            {contestRating?.badge && (
              <div className="flex items-center gap-3 mb-3 text-muted-foreground flex-wrap">
                {contestRating.badge.icon !== "/default_icon.png" && (
                  <img
                    src={"https://leetcode.com" + contestRating.badge.icon}
                    alt={contestRating.badge.name}
                    title={contestRating.badge.name}
                    className="w-5 h-5"
                  />
                )}
                <span>{contestRating.badge.name}</span>
                {contestRating.badge.expired && <span className="text-red-400">(Expired)</span>}
              </div>
            )}

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Contests: {contestRating?.attendedContestsCount ?? "N/A"}</p>
              <p>Rating: {contestRating?.rating ?? "N/A"}</p>
              <p>Rank: {contestRating?.globalRanking ? `#${contestRating.globalRanking}` : "N/A"}</p>
              <p>
                Top %:{" "}
                {contestRating?.topPercentage ? `${contestRating.topPercentage.toFixed(2)}%` : "N/A"}
              </p>
            </div>
          </div>
        </section>

        {/* ✅ New Contest Rating History Section with upgraded UI */}
        <ContestRatingHistory attendedContests={attendedContests} data={rechartsData} />
      </div>
    </>
  );
}

// Custom tooltip — receives already-converted page coords in `position`
function CustomContestTooltip({ contest, position, containerRect }) {
  if (!contest || !position) return null;

  // clamp horizontally inside container
  const tooltipWidth = 260;
  const padding = 12;
  let left = position.x - containerRect.left; // pos relative to container
  if (left + tooltipWidth / 2 > containerRect.width - padding) {
    left = containerRect.width - padding - tooltipWidth / 2;
  } else if (left - tooltipWidth / 2 < padding) {
    left = tooltipWidth / 2 + padding;
  }

  // compute top relative to container (place above the dot)
  const top = position.y - containerRect.top - 14; // 14px above dot center

  return (
    <AnimatePresence>
      <motion.div
        key={contest.contestName}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute z-50 pointer-events-none"
        style={{
          left: left,
          top: top,
          transform: "translate(-50%, -100%)",
          width: tooltipWidth,
        }}
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-4 text-sm text-white min-w-[220px] backdrop-blur-md">
          <p className="font-semibold text-[var(--primary)] text-base mb-1 truncate">
            {contest.contestName}
          </p>
          <p className="text-gray-300 mb-1">📅 {contest.date}</p>
          <p>
            ⭐ Rating:{" "}
            <span className="font-bold text-[var(--chart-1)] text-lg">
             {Math.round(contest.rating)}

            </span>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ContestRatingHistory — replacement
export function ContestRatingHistory({ attendedContests = [], data = [] }) {
  const [activeDot, setActiveDot] = useState(null);
  const containerRef = useRef(null);

  // Close tooltip when clicking outside the chart area
  useEffect(() => {
    const onDocDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDot(null);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Helper: create absolute page coords from SVG cx/cy
  const makePagePos = (cx, cy) => {
    const container = containerRef.current;
    if (!container) return { x: cx, y: cy };
    // The chart SVG is placed inside the container. We convert svg coords to page coords:
    const rect = container.getBoundingClientRect();
    // cx/cy come in as numbers already in SVG coordinate space relative to the SVG origin.
    // Recharts usually places SVG at left/top of container, so we can add rect.left/rect.top.
    return { x: rect.left + cx, y: rect.top + cy, containerRect: rect };
  };

  // Handle dot click/hover/leave
  const handleDotClick = (dotProps) => {
    const { cx, cy, index } = dotProps;
    const pagePos = makePagePos(cx, cy);
    // toggle on same index
    if (activeDot?.index === index) {
      setActiveDot(null);
    } else {
      setActiveDot({
        index,
        contest: data[index],
        position: pagePos,
      });
    }
  };

  const handleDotEnter = (dotProps) => {
    // subtle highlight only (does not show tooltip unless clicked) — but user asked tooltip disappears when mouse leaves dot,
    // so we won't open tooltip on hover. Instead we can store hover index if needed (omitted for brevity).
  };

  const handleDotLeave = (dotProps) => {
    // hide tooltip when cursor leaves the dot (per your request)
    if (activeDot?.index === dotProps.index) {
      setActiveDot(null);
    }
  };

  const chartConfig = { rating: { label: "Rating", color: "var(--chart-1)" } };

  return (
    <Card ref={containerRef} className="bg-[var(--card)] border border-[var(--border)] shadow-md relative overflow-visible">
      <CardHeader>
        <CardTitle className="text-[var(--primary)] text-lg">Contest Rating History</CardTitle>
        <CardDescription>Your progress across contests</CardDescription>
      </CardHeader>

      <CardContent>
        {attendedContests.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={6} tickFormatter={(v) => v?.slice(5)} fontSize={11} stroke="#aaa" />
                <YAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={6} fontSize={11} domain={["dataMin - 50", "dataMax + 50"]} stroke="#aaa"  tickFormatter={(value) => Math.round(value)} />

                {/* disable default tooltip */}
                <ChartTooltip content={<></>} cursor={false} />

                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="var(--color-rating)"
                  strokeWidth={2.4}
                  dot={(dotProps) => {
                    const isActive = activeDot?.index === dotProps.index;
                    return (
                      <motion.circle
                        key={`dot-${dotProps.index}`}
                        cx={dotProps.cx}
                        cy={dotProps.cy}
                        r={isActive ? 7.5 : 5}
                        fill="var(--color-rating)"
                        stroke="#fff"
                        strokeWidth={1.6}
                        onClick={() => handleDotClick(dotProps)}
                        onMouseEnter={() => handleDotEnter(dotProps)}
                        onMouseLeave={() => handleDotLeave(dotProps)}
                        whileHover={{ scale: 1.18, filter: "drop-shadow(0 0 8px var(--color-rating))" }}
                        animate={{ filter: isActive ? "drop-shadow(0 0 10px var(--color-rating))" : "none", scale: isActive ? 1.12 : 1 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="w-full h-24 bg-gray-800 rounded-md flex items-center justify-center text-xs text-gray-400">📊 No attended contests to show.</div>
        )}
      </CardContent>

      {/* render tooltip (absolute) when active */}
      {activeDot && (
        <CustomContestTooltip contest={activeDot.contest} position={activeDot.position} containerRect={containerRef.current.getBoundingClientRect()} />
      )}

      {attendedContests.length > 0 && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium text-white">
            Trending up overall <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-gray-400 leading-none">Click on any dot to view contest details</div>
        </CardFooter>
      )}
    </Card>
  );
}
