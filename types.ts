export interface Course {
  id: string;
  name: string;
  credits: number;
  grade: number;
  semester: number;
  category: string; // 'חובה', 'בחירה', 'כללי', 'ספורט'
  examType: 'A' | 'B'; // Moed A or B
  isBinary: boolean; // Pass/Fail
  isPass?: boolean; // If binary, did they pass?
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  institution: string;
  major: string;
  totalCreditsNeeded: number;
  targetAverage?: number;
  photoURL?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  author: string;
}

export interface CalculatorStats {
  average: number;
  totalCredits: number;
  completedPercentage: number;
  semesterAverages: { semester: number; average: number; credits: number }[];
  categoryAverages: { category: string; average: number; credits: number }[];
  maxGrade?: { name: string; grade: number };
  minGrade?: { name: string; grade: number };
}