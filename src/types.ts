export type AdmissionStatus = 'pending' | 'accepted' | 'rejected';
export type StudentStatus = 'active' | 'graduated' | 'suspended';
export type BorrowStatus = 'borrowed' | 'returned';

export interface Admission {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appliedCourse: string;
  status: AdmissionStatus;
  applicationDate: string;
}

export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  admissionDate: string;
  status: StudentStatus;
}

export interface Course {
  id?: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  instructor: string;
  description: string;
}

export interface Grade {
  id?: string;
  studentId: string;
  courseId: string;
  semester: string;
  year: number;
  grade: string;
  score: number;
}

export interface Book {
  id?: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export interface BorrowRecord {
  id?: string;
  bookId: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowStatus;
}

export interface TestResult {
  id?: string;
  studentId: string;
  courseId: string;
  testName: string;
  maxMarks: number;
  obtainedMarks: number;
  teacherName: string;
  date: string;
}
