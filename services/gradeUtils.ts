import { Course, CalculatorStats } from '../types';

export const calculateStats = (courses: Course[], totalCreditsNeeded: number): CalculatorStats => {
  let totalWeightedScore = 0;
  let totalCreditsForAvg = 0;
  let totalCreditsEarned = 0;
  
  const semesterMap = new Map<number, { score: number; credits: number }>();
  const categoryMap = new Map<string, { score: number; credits: number }>();
  
  let maxGrade: Course | undefined;
  let minGrade: Course | undefined;

  courses.forEach(course => {
    // Basic credits accumulation
    if ((course.isBinary && course.isPass) || (!course.isBinary && course.grade >= 55)) {
        totalCreditsEarned += course.credits;
    }

    // Average calculation (exclude binary courses)
    if (!course.isBinary) {
      const weightedScore = course.grade * course.credits;
      totalWeightedScore += weightedScore;
      totalCreditsForAvg += course.credits;

      // Semester stats
      const sem = semesterMap.get(course.semester) || { score: 0, credits: 0 };
      sem.score += weightedScore;
      sem.credits += course.credits;
      semesterMap.set(course.semester, sem);

      // Category stats
      const cat = categoryMap.get(course.category) || { score: 0, credits: 0 };
      cat.score += weightedScore;
      cat.credits += course.credits;
      categoryMap.set(course.category, cat);

      // Min/Max
      if (!maxGrade || course.grade > maxGrade.grade) maxGrade = course;
      if (!minGrade || course.grade < minGrade.grade) minGrade = course;
    }
  });

  const average = totalCreditsForAvg > 0 ? totalWeightedScore / totalCreditsForAvg : 0;
  const completedPercentage = Math.min((totalCreditsEarned / totalCreditsNeeded) * 100, 100);

  const semesterAverages = Array.from(semesterMap.entries()).map(([semester, data]) => ({
    semester,
    average: data.credits > 0 ? data.score / data.credits : 0,
    credits: data.credits
  })).sort((a, b) => a.semester - b.semester);

  const categoryAverages = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    average: data.credits > 0 ? data.score / data.credits : 0,
    credits: data.credits
  }));

  return {
    average: parseFloat(average.toFixed(2)),
    totalCredits: totalCreditsEarned,
    completedPercentage: parseFloat(completedPercentage.toFixed(1)),
    semesterAverages,
    categoryAverages,
    maxGrade: maxGrade ? { name: maxGrade.name, grade: maxGrade.grade } : undefined,
    minGrade: minGrade ? { name: minGrade.name, grade: minGrade.grade } : undefined,
  };
};

export const calculateShield = (magen: number, magenPercent: number, exam: number): number => {
    return (magen * (magenPercent / 100)) + (exam * (1 - (magenPercent / 100)));
};

export const calculateRequiredExam = (magen: number, magenPercent: number, target: number = 55): number => {
    // target = (magen * mp) + (exam * (1-mp))
    // target - (magen * mp) = exam * (1-mp)
    // exam = (target - (magen * mp)) / (1-mp)
    const mpDecimal = magenPercent / 100;
    const examPercent = 1 - mpDecimal;
    if (examPercent === 0) return 0;
    return (target - (magen * mpDecimal)) / examPercent;
};