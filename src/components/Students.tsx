import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { Student } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  BadgeCheck,
  GraduationCap,
  Mail,
  UserCircle,
  Users,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    department: '',
    status: 'active' as const
  });

  const fetchStudents = async () => {
    setLoading(true);
    const q = query(collection(db, 'students'), orderBy('studentId', 'asc'));
    const snap = await getDocs(q);
    setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this student record?')) {
      await deleteDoc(doc(db, 'students', id));
      fetchStudents();
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        admissionDate: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewStudent({ firstName: '', lastName: '', email: '', studentId: '', department: '', status: 'active' });
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-sm text-slate-500">Manage all registered students and their details.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Register Student
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {students.map((student) => (
          <motion.div 
            key={student.id}
            layout
            className="card p-6 flex flex-col gap-4 relative group"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-slate-400" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {student.status}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 truncate">{student.firstName} {student.lastName}</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{student.studentId}</p>
            </div>

            <div className="space-y-2 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2 text-slate-500">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-semibold truncate">{student.department}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-semibold truncate">{student.email}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex justify-center items-center gap-2">
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button 
                onClick={() => handleDelete(student.id!)}
                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {students.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center card bg-slate-50/50">
            <div className="flex flex-col items-center gap-2">
              <Users className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 font-medium">No students registered yet.</p>
            </div>
          </div>
        )}
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
                <h2 className="text-xl font-bold">Register New Student</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                    <input 
                      required
                      value={newStudent.firstName}
                      onChange={e => setNewStudent({...newStudent, firstName: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                    <input 
                      required
                      value={newStudent.lastName}
                      onChange={e => setNewStudent({...newStudent, lastName: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</label>
                    <input 
                      required
                      placeholder="e.g. STU123"
                      value={newStudent.studentId}
                      onChange={e => setNewStudent({...newStudent, studentId: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                    <input 
                      required
                      value={newStudent.department}
                      onChange={e => setNewStudent({...newStudent, department: e.target.value})}
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Register Student
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
