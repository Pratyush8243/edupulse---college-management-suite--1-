import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, where, addDoc } from 'firebase/firestore';
import { Grade, Student, Course } from '../types';
import { 
  BarChart3, 
  Search, 
  ArrowUpRight,
  TrendingDown,
  User,
  BookOpen,
  Filter,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Grades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    courseId: '',
    semester: 'Fall',
    year: 2026,
    grade: '',
    score: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const [gradesSnap, studentsSnap, coursesSnap] = await Promise.all([
      getDocs(query(collection(db, 'grades'), orderBy('year', 'desc'))),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'courses'))
    ]);

    const studentMap: Record<string, Student> = {};
    studentsSnap.docs.forEach(doc => studentMap[doc.id] = { id: doc.id, ...doc.data() } as Student);
    
    const courseMap: Record<string, Course> = {};
    coursesSnap.docs.forEach(doc => courseMap[doc.id] = { id: doc.id, ...doc.data() } as Course);

    setStudents(studentMap);
    setCourses(courseMap);
    setGrades(gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade)));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'grades'), newGrade);
      setShowAddModal(false);
      setNewGrade({ studentId: '', courseId: '', semester: 'Fall', year: 2026, grade: '', score: 0 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Tracking</h1>
          <p className="text-sm text-slate-500">Monitor student grades and academic progress.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Result
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Results</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Student ID..." 
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {students[g.studentId]?.firstName} {students[g.studentId]?.lastName}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">
                        {students[g.studentId]?.studentId}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600">{courses[g.courseId]?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        {g.semester} {g.year}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${g.score >= 80 ? 'bg-emerald-500' : g.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${g.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{g.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-black ring-1 ring-inset ${
                        g.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        g.grade.startsWith('B') ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                        'bg-rose-50 text-rose-700 ring-rose-600/20'
                      }`}>
                        {g.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {grades.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      No grade records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-blue-600 text-white">
            <h3 className="font-bold opacity-80 text-sm uppercase tracking-wider mb-2">Campus GPA Index</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black">3.82</span>
              <div className="flex items-center gap-1 text-emerald-300 text-xs font-bold pb-2">
                <ArrowUpRight className="w-3 h-3" />
                +0.12
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-blue-100 leading-relaxed">
              Academic performance has improved by 4% compared to the previous semester across all departments.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Departmental Standings</h3>
            <div className="space-y-4">
              {[
                { name: 'Computer Science', value: 92, color: 'bg-blue-500' },
                { name: 'Business Admin', value: 84, color: 'bg-indigo-500' },
                { name: 'Mechanical Eng.', value: 78, color: 'bg-amber-500' },
                { name: 'Digital Arts', value: 95, color: 'bg-emerald-500' }
              ].map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>{dept.name}</span>
                    <span>{dept.value}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.value}%` }}
                      className={`h-full ${dept.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Record Student Result</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddGrade} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student</label>
                  <select 
                    required
                    value={newGrade.studentId}
                    onChange={e => setNewGrade({...newGrade, studentId: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  >
                    <option value="">Select Student</option>
                    {Object.values(students).map((s: Student) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course</label>
                  <select 
                    required
                    value={newGrade.courseId}
                    onChange={e => setNewGrade({...newGrade, courseId: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  >
                    <option value="">Select Course</option>
                    {Object.values(courses).map((c: Course) => (
                      <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                    <select 
                      required
                      value={newGrade.semester}
                      onChange={e => setNewGrade({...newGrade, semester: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
                    <input 
                      type="number"
                      required
                      value={newGrade.year}
                      onChange={e => setNewGrade({...newGrade, year: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={newGrade.score}
                      onChange={e => setNewGrade({...newGrade, score: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade Letter</label>
                    <input 
                      required
                      placeholder="e.g. A, B+, C"
                      value={newGrade.grade}
                      onChange={e => setNewGrade({...newGrade, grade: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-8 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    Submit Grade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
