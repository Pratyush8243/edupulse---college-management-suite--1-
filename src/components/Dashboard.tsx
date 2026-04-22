import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { seedInitialData, cleanupPreviousSeeds } from '../lib/seed';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Library,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
    </div>
  </div>
);

const data = [
  { name: 'Mon', admissions: 4, borrows: 12 },
  { name: 'Tue', admissions: 3, borrows: 19 },
  { name: 'Wed', admissions: 10, borrows: 15 },
  { name: 'Thu', admissions: 7, borrows: 22 },
  { name: 'Fri', admissions: 5, borrows: 30 },
  { name: 'Sat', admissions: 12, borrows: 10 },
  { name: 'Sun', admissions: 8, borrows: 5 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    pendingAdmissions: 0,
    courses: 0,
    books: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await cleanupPreviousSeeds(); // Remove the STU001-003 students
        await seedInitialData(); // Ensure other data exists

        const [studentsSnap, admissionsSnap, coursesSnap, booksSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(query(collection(db, 'admissions'), where('status', '==', 'pending'))),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'library_books'))
        ]);

        setStats({
          students: studentsSnap.size,
          pendingAdmissions: admissionsSnap.size,
          courses: coursesSnap.size,
          books: booksSnap.size
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Academic Overview</h1>
          <p className="text-slate-500">Welcome back, here's what's happening at EduPulse.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm">
          <Calendar className="w-4 h-4" />
          <span>April 22, 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.students} icon={Users} trend={12} color="bg-blue-600" />
        <StatCard title="Pending Admissions" value={stats.pendingAdmissions} icon={GraduationCap} trend={-5} color="bg-amber-500" />
        <StatCard title="Active Courses" value={stats.courses} icon={BookOpen} trend={2} color="bg-indigo-600" />
        <StatCard title="Library Assets" value={stats.books} icon={Library} trend={8} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold">Campus Activity</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Admissions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Library</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="admissions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdm)" strokeWidth={2} />
                <Area type="monotone" dataKey="borrows" stroke="#6366f1" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 divide-y divide-slate-100">
          <h2 className="text-lg font-bold mb-6">Recent Records</h2>
          {[1,2,3,4].map((i) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-500">JD</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">John Doe</p>
                  <p className="text-xs text-slate-400 font-medium">B.Sc Computer Science</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600">Accepted</p>
                <p className="text-[10px] text-slate-400">2h ago</p>
              </div>
            </div>
          ))}
          <button className="w-full mt-6 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </motion.div>
  );
}
