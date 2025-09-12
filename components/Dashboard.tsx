import { useEffect, useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { FileText, Star, Flame, Award } from "lucide-react";
import { motion } from "framer-motion";
import { getAuthHeader } from "../utils/auth";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const Dashboard = () => {
  const [activity, setActivity] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch("http://127.0.0.1:8002/profile", {
          headers: getAuthHeader(),
        });
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch chat history
        const histRes = await fetch("http://127.0.0.1:8000/history", {
          headers: getAuthHeader(),
        });
        const histData = await histRes.json();
        const hist: any[] = Array.isArray(histData.history) ? histData.history : [];

        const formatted = hist.map((item: any) => ({
          query: item.query,
          mode: item.mode,
          score: item.results_count || 0,
          date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "",
          fullDate: item.timestamp ? new Date(item.timestamp).toLocaleString() : "",
        }));

        setActivity(formatted);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="p-6">Loading dashboard...</p>;

  const totalQueries = activity.length;
  const avgScore = totalQueries > 0
    ? (activity.reduce((a, b) => a + (b.score || 0), 0) / totalQueries).toFixed(2)
    : 0;
  const streak = 7; // mock
  const achievements = 3; // mock

  // Mode distribution
  const modeCounts: Record<string, number> = {};
  activity.forEach((a) => {
    modeCounts[a.mode] = (modeCounts[a.mode] || 0) + 1;
  });

  const donutData = Object.entries(modeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-indigo-50 to-slate-100 min-h-screen">
      {/* Header with Profile */}
      <div className="flex justify-between items-center">
        <motion.div
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg flex-1 mr-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">
            Hello, {profile?.name || "User"} 👋
          </h1>
          <p className="opacity-80">Here’s your learning progress and insights</p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 w-72"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            {profile?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{profile?.name}</h2>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Joined:{" "}
              {profile?.joined ? new Date(profile.joined).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<FileText />} title="Total Queries" value={totalQueries} color="from-blue-500 to-blue-700" />
        <StatCard icon={<Star />} title="Avg Score" value={avgScore} color="from-yellow-400 to-yellow-600" />
        <StatCard icon={<Flame />} title="Streak" value={`${streak} days`} color="from-red-500 to-orange-600" />
        <StatCard icon={<Award />} title="Achievements" value={`${achievements} Badges`} color="from-purple-500 to-indigo-600" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Scores Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activity}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">Query Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                dataKey="value"
                label
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="absolute text-xl font-bold text-slate-700 mt-32 text-center">
          {totalQueries} Queries
        </p>
        </div>
      </div>

      

      {/* Recent Queries Timeline */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
        <div className="relative border-l border-slate-200">
          {activity.slice(0, 6).map((a, i) => (
            <motion.div
              key={i}
              className="mb-6 ml-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="absolute -left-3 top-1.5 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs shadow">
                {a.mode?.[0] || "?"}
              </span>
              <div className="bg-slate-50 p-3 rounded-lg shadow-sm">
                <p className="text-sm">
                  <span className="font-semibold">{a.query}</span> ({a.mode})
                </p>
                <p className="text-xs text-slate-500">{a.fullDate}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const StatCard = ({ icon, title, value, color }: any) => (
  <motion.div
    className={`rounded-xl shadow p-6 text-white bg-gradient-to-r ${color} flex items-center gap-4`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="p-3 bg-white bg-opacity-20 rounded-full">{icon}</div>
    <div>
      <p className="text-sm opacity-80">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  </motion.div>
);

export default Dashboard;
