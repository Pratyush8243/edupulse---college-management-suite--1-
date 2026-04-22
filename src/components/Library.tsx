import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, where, doc, updateDoc, increment, addDoc, deleteDoc } from 'firebase/firestore';
import { Book, BorrowRecord } from '../types';
import { 
  Library, 
  Search, 
  BookMarked, 
  History, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Filter,
  Plus,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LibraryModule() {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'borrows'>('catalog');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    category: '',
    totalCopies: 1,
    availableCopies: 1
  });

  const [borrows, setBorrows] = useState<any[]>([]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'library_books'), orderBy('title', 'asc')));
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));

      const borrowSnap = await getDocs(query(collection(db, 'borrowings'), orderBy('borrowDate', 'desc')));
      setBorrows(borrowSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const studentSnap = await getDocs(query(collection(db, 'students'), orderBy('firstName', 'asc')));
      setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'library_books'), {
        ...newBook,
        availableCopies: newBook.totalCopies
      });
      setShowAddModal(false);
      setNewBook({ isbn: '', title: '', author: '', category: '', totalCopies: 1, availableCopies: 1 });
      fetchBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBorrowBook = (book: Book) => {
    if (book.availableCopies <= 0) {
      alert("No copies available for borrowing.");
      return;
    }
    setSelectedBook(book);
    setShowBorrowModal(true);
  };

  const confirmBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedStudentId) return;

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    try {
      await addDoc(collection(db, 'borrowings'), {
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        borrowDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });

      await updateDoc(doc(db, 'library_books', selectedBook.id!), {
        availableCopies: increment(-1)
      });

      setShowBorrowModal(false);
      setSelectedStudentId('');
      fetchBooks();
      alert("Book borrowed successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnBook = async (loan: any) => {
    if (loan.status === 'returned') return;
    
    if (!confirm(`Return "${loan.bookTitle}" from ${loan.studentName}?`)) return;

    try {
      // 1. Update loan status
      await updateDoc(doc(db, 'borrowings', loan.id), {
        status: 'returned',
        returnDate: new Date().toISOString()
      });

      // 2. Increment available copies
      await updateDoc(doc(db, 'library_books', loan.bookId), {
        availableCopies: increment(1)
      });

      fetchBooks();
      alert("Book returned successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to remove this book from the catalog?')) return;
    try {
      await deleteDoc(doc(db, 'library_books', id));
      fetchBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBorrows = borrows.filter(loan => 
    loan.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Resources</h1>
          <p className="text-sm text-slate-500">Centralized library catalog and citation management.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-100 rounded-xl h-fit">
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Book Catalog
            </button>
            <button 
              onClick={() => setActiveTab('borrows')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'borrows' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Borrowings
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search in ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {activeTab === 'catalog' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {filteredBooks.map((book) => (
              <div key={book.id} className="p-6 hover:bg-slate-50/50 transition-colors flex gap-4 relative group">
                <div className="w-20 h-28 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                  <div className="pr-6">
                    <h3 className="font-bold text-slate-900 truncate" title={book.title}>{book.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 truncate">{book.author}</p>
                    <p className="mt-1 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{book.isbn}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${
                      book.availableCopies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {book.availableCopies} available
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleBorrowBook(book)}
                        className="text-blue-600 hover:scale-110 transition-transform p-1.5 hover:bg-blue-50 rounded-lg"
                        title="Borrow"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id!)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {borrows.filter(b => b.bookId === book.id && b.status === 'active').length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 italic">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Borrowed By:</p>
                      <div className="flex flex-wrap gap-1">
                        {borrows.filter(b => b.bookId === book.id && b.status === 'active').map(b => (
                          <span key={b.id} className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {b.studentName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center">
                <Library className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 font-medium font-mono text-sm uppercase tracking-tighter">No assets found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Borrowed On</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBorrows.map((loan) => (
                  <tr key={loan.id} className="text-sm">
                    <td className="px-6 py-4 font-semibold text-slate-900">{loan.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{loan.bookTitle}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(loan.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-medium text-xs">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === 'active' ? (
                        <button 
                          onClick={() => handleReturnBook(loan)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Return Book
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">
                          {loan.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBorrows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900">No matching records</h3>
                      <p className="text-slate-500 max-w-sm mx-auto text-sm mt-1">
                        Try adjusting your search query.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-t-4 border-t-amber-500 flex gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full h-fit">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Overdue Alerts</h4>
            <p className="text-xs text-slate-500 mt-1">12 items currently overdue across all departments.</p>
          </div>
        </div>
        <div className="card p-6 border-t-4 border-t-blue-500 flex gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full h-fit">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Active Reserves</h4>
            <p className="text-xs text-slate-500 mt-1">8 students waiting for high-demand resources.</p>
          </div>
        </div>
        <div className="card p-6 border-t-4 border-t-emerald-500 flex gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full h-fit">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Donations</h4>
            <p className="text-xs text-slate-500 mt-1">45 new titles added this academic quarter.</p>
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
                <h2 className="text-xl font-bold">Add Library Asset</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddBook} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Book Title</label>
                  <input 
                    required
                    value={newBook.title}
                    onChange={e => setNewBook({...newBook, title: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Author</label>
                    <input 
                      required
                      value={newBook.author}
                      onChange={e => setNewBook({...newBook, author: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ISBN</label>
                    <input 
                      required
                      placeholder="e.g. 978-..."
                      value={newBook.isbn}
                      onChange={e => setNewBook({...newBook, isbn: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <input 
                      required
                      placeholder="e.g. Technology"
                      value={newBook.category}
                      onChange={e => setNewBook({...newBook, category: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Copies</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={newBook.totalCopies}
                      onChange={e => setNewBook({...newBook, totalCopies: parseInt(e.target.value)})}
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
                    Add to Catalog
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showBorrowModal && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBorrowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight italic">Checkout Asset</h2>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Library Management System</p>
                </div>
                <button onClick={() => setShowBorrowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <form onSubmit={confirmBorrow} className="p-6 space-y-6">
                <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-16 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{selectedBook.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{selectedBook.author}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-tighter">{selectedBook.isbn}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Student</label>
                  <select 
                    required
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
                  >
                    <option value="">Choose a registered student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.studentId})
                      </option>
                    ))}
                  </select>
                  {students.length === 0 && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">No students registered in the directory.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowBorrowModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!selectedStudentId}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Borrow
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
