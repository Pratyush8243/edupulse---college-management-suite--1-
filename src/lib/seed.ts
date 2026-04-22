import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export async function cleanupPreviousSeeds() {
  const studentsRef = collection(db, 'students');
  const gradesRef = collection(db, 'grades');
  
  // Find students with IDs STU001, STU002, STU003
  const q = query(studentsRef, where('studentId', 'in', ['STU001', 'STU002', 'STU003']));
  const snap = await getDocs(q);
  
  for (const studentDoc of snap.docs) {
    // Delete their grades first
    const gq = query(gradesRef, where('studentId', '==', studentDoc.id));
    const gsnap = await getDocs(gq);
    for (const gd of gsnap.docs) {
      await deleteDoc(doc(db, 'grades', gd.id));
    }
    // Delete student
    await deleteDoc(doc(db, 'students', studentDoc.id));
  }
}

export async function seedInitialData() {
  const checkDocs = await getDocs(collection(db, 'courses'));
  if (checkDocs.size > 0) return; // Already seeded

  console.log("Seeding data...");

  // 1. Courses
  const courses = [
    { code: 'CS101', title: 'Introduction to Programming', department: 'Computer Science', credits: 4, instructor: 'Dr. Alan Turing', description: 'Fundamental concepts of computer programming and algorithmic thinking.' },
    { code: 'ENG201', title: 'Mechanical Systems', department: 'Mechanical Engineering', credits: 3, instructor: 'Prof. Nikola Tesla', description: 'Study of mechanical design, thermodynamics, and fluid dynamics.' },
    { code: 'BUS301', title: 'Digital Marketing', department: 'Business Administration', credits: 3, instructor: 'Sarah Jenkins', description: 'Modern marketing strategies in the digital ecosystem.' },
    { code: 'ART105', title: 'Visual Composition', department: 'Digital Arts', credits: 2, instructor: 'Leo DaVinci', description: 'Principles of design and visual storytelling.' }
  ];
  
  const courseRefs: any[] = [];
  for (const c of courses) {
    const ref = await addDoc(collection(db, 'courses'), c);
    courseRefs.push({ id: ref.id, ...c });
  }

  // 2. Students (REMOVE Initial Seed Students)
  const studentRefs: any[] = [];
  /* 
  const students = [
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@college.edu', studentId: 'STU001', department: 'Computer Science', admissionDate: new Date().toISOString(), status: 'active' },
    { firstName: 'Bob', lastName: 'Smith', email: 'bob.s@college.edu', studentId: 'STU002', department: 'Business Administration', admissionDate: new Date().toISOString(), status: 'active' },
    { firstName: 'Charlie', lastName: 'Davis', email: 'charlie.d@college.edu', studentId: 'STU003', department: 'Mechanical Engineering', admissionDate: new Date().toISOString(), status: 'active' }
  ];

  for (const s of students) {
    const ref = await addDoc(collection(db, 'students'), s);
    studentRefs.push({ id: ref.id, ...s });
  }
  */

  // 3. Admissions
  const admissions = [
    { firstName: 'David', lastName: 'Miller', email: 'david.m@gmail.com', phone: '555-0101', appliedCourse: 'B.Sc Computer Science', status: 'pending', applicationDate: new Date().toISOString() },
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma.w@yahoo.com', phone: '555-0102', appliedCourse: 'Digital Arts', status: 'pending', applicationDate: new Date().toISOString() }
  ];
  for (const a of admissions) {
    await addDoc(collection(db, 'admissions'), a);
  }

  // 4. Grades (REMOVE Initial Seed Grades as they depend on students)
  /*
  const grades = [
    { studentId: studentRefs[0].id, courseId: courseRefs[0].id, semester: 'Fall', year: 2025, grade: 'A', score: 94 },
    { studentId: studentRefs[1].id, courseId: courseRefs[2].id, semester: 'Fall', year: 2025, grade: 'B+', score: 88 },
    { studentId: studentRefs[2].id, courseId: courseRefs[1].id, semester: 'Spring', year: 2026, grade: 'A-', score: 91 }
  ];
  for (const g of grades) {
    await addDoc(collection(db, 'grades'), g);
  }
  */

  // 5. Library Books
  const books = [
    { isbn: '978-0131103627', title: 'The C Programming Language', author: 'Kernighan & Ritchie', category: 'Technology', totalCopies: 5, availableCopies: 3 },
    { isbn: '978-0465050659', title: 'The Design of Everyday Things', author: 'Don Norman', category: 'Design', totalCopies: 3, availableCopies: 2 },
    { isbn: '978-0141033570', title: 'Economics: The Users Guide', author: 'Ha-Joon Chang', category: 'Business', totalCopies: 10, availableCopies: 8 }
  ];
  for (const b of books) {
    await addDoc(collection(db, 'library_books'), b);
  }

  console.log("Seeding complete.");
}
