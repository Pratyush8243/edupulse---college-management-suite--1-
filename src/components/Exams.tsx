import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, where, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { TestResult, Student, Course } from '../types';
import { 
  FileText, 
  Search, 
  Plus, 
  X, 
  User, 
  BookOpen, 
  CheckCircle2, 
  History,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Exams() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('teacher');
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentSearchId, setStudentSearchId] = useState('');
  const [newResult, setNewResult] = useState({
    studentId: '',
    courseId: '',
    testName: '',
    maxMarks: 100,
    obtainedMarks: 0,
    teacherName: 'Prof. Demo',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resultsSnap, studentsSnap, coursesSnap] = await Promise.all([
        getDocs(query(collection(db, 'test_results'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'courses'))
      ]);

      const studentMap: Record<string, Student> = {};
      studentsSnap.docs.forEach(doc => studentMap[doc.id] = { id: doc.id, ...doc.data() } as Student);
      
      const courseMap: Record<string, Course> = {};
      coursesSnap.docs.forEach(doc => courseMap[doc.id] = { id: doc.id, ...doc.data() } as Course);

      setStudents(studentMap);
      setCourses(courseMap);
      setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'test_results'), newResult);
      setShowAddModal(false);
      setNewResult({
        studentId: '',
        courseId: '',
        testName: '',
        maxMarks: 100,
        obtainedMarks: 0,
        teacherName: 'Prof. Demo',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to remove this test result?')) return;
    try {
      await deleteDoc(doc(db, 'test_results', id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResults = viewMode === 'student' && studentSearchId
    ? results.filter(r => {
        const student = Object.values(students).find(s => s.studentId === studentSearchId);
        return student ? r.studentId === student.id : false;
      })
    : results;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam & Test Results</h1>
          <p className="text-sm text-slate-500">Manage classroom evaluations and student score retrieval.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setViewMode('teacher')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Teacher View
            </button>
            <button 
              onClick={() => setViewMode('student')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student Portal
            </button>
          </div>
          {viewMode === 'teacher' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Upload Result
            </button>
          )}
        </div>
      </div>

      {viewMode === 'student' ? (
        <div className="space-y-6">
          <div className="card p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl font-bold mb-2">Find Your Results</h2>
              <p className="text-blue-100 text-sm mb-6">Enter your Student ID to retrieve your latest test scores and performance feedback.</p>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter Student ID (e.g. STU123)"
                  value={studentSearchId}
                  onChange={e => setStudentSearchId(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl border-none focus:ring-4 focus:ring-white/20 shadow-xl"
                />
              </div>
            </div>
            <GraduationCap className="w-64 h-64 absolute -right-20 -bottom-20 text-white/10 rotate-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map(r => (
              <motion.div 
                key={r.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow bg-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Score</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{r.obtainedMarks}<span className="text-slate-400 text-sm font-normal">/{r.maxMarks}</span></p>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{r.testName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{courses[r.courseId]?.title || 'Unknown Course'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Percentage</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{((r.obtainedMarks / r.maxMarks) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Status</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">PASSED</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {studentSearchId && filteredResults.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No results found</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm mt-1">We couldn't find any test records for student ID "{studentSearchId}". Please double check the ID.</p>
              </div>
            )}
            {!studentSearchId && (
              <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Search for your student ID above to see results.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <h2 className="font-bold text-slate-900">All Published Results</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search results..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Test Details</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Evaluator</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {students[r.studentId]?.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {students[r.studentId]?.firstName} {students[r.studentId]?.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {students[r.studentId]?.studentId || 'ID UNKNOWN'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{r.testName}</p>
                      <p className="text-xs text-slate-400">{courses[r.courseId]?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{r.obtainedMarks}</span>
                        <span className="text-xs text-slate-400">/ {r.maxMarks}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          (r.obtainedMarks / r.maxMarks) >= 0.4 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {((r.obtainedMarks / r.maxMarks) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-600">{r.teacherName}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">{r.date}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteResult(r.id!)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold">Publish New Test Result</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddResult} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student</label>
                    <select 
                      required
                      value={newResult.studentId}
                      onChange={e => setNewResult({...newResult, studentId: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="">Select Student</option>
                      {Object.values(students).map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course</label>
                    <select 
                      required
                      value={newResult.courseId}
                      onChange={e => setNewResult({...newResult, courseId: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="">Select Course</option>
                      {Object.values(courses).map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Name</label>
                  <input 
                    required
                    placeholder="e.g. Unit Test 1, Midterm Exam"
                    value={newResult.testName}
                    onChange={e => setNewResult({...newResult, testName: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Marks</label>
                    <input 
                      type="number"
                      required
                      value={newResult.maxMarks}
                      onChange={e => setNewResult({...newResult, maxMarks: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Obtained Marks</label>
                    <input 
                      type="number"
                      required
                      value={newResult.obtainedMarks}
                      onChange={e => setNewResult({...newResult, obtainedMarks: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Name</label>
                    <input 
                      required
                      value={newResult.teacherName}
                      onChange={e => setNewResult({...newResult, teacherName: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                    <input 
                      type="date"
                      required
                      value={newResult.date}
                      onChange={e => setNewResult({...newResult, date: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Post Result
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
