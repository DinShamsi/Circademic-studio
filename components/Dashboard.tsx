import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Course, UserProfile } from '../types';
import { calculateStats, calculateShield, calculateRequiredExam } from '../services/gradeUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Plus, Trash2, Edit2, Search, Download, Calculator, X, Shield, Wand2, Loader2, GraduationCap, 
  TrendingUp, Award, BookOpen, Calendar, ArrowUpRight, Filter, LayoutDashboard, List
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ImageEditor } from './ImageEditor';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DashboardProps {
  user: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'tools' | 'ai'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // New Course Form State
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    name: '', credits: 3, grade: 80, semester: 1, category: 'חובה', examType: 'A', isBinary: false
  });

  // What If State
  const [whatIfCourses, setWhatIfCourses] = useState<Partial<Course>[]>([]);
  
  // Shield Calculator State
  const [shieldMagen, setShieldMagen] = useState(85);
  const [shieldPercent, setShieldPercent] = useState(30);
  const [shieldExam, setShieldExam] = useState(0);

  // PDF Generation State
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, "courses"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetched: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetched);
      } catch (error) {
        console.error("Error fetching courses: ", error);
        setCourses([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  const handleSaveCourse = async () => {
    if (!newCourse.name) return;
    
    try {
        const courseData = {
            ...newCourse,
            uid: user.uid,
            grade: Number(newCourse.grade),
            credits: Number(newCourse.credits),
            semester: Number(newCourse.semester)
        };

        if (editingCourse) {
             await updateDoc(doc(db, "courses", editingCourse.id), courseData);
             setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...courseData } as Course : c));
        } else {
             const docRef = await addDoc(collection(db, "courses"), courseData);
             setCourses(prev => [...prev, { id: docRef.id, ...courseData } as Course]);
        }
        setIsAddModalOpen(false);
        setEditingCourse(null);
        setNewCourse({ name: '', credits: 3, grade: 80, semester: 1, category: 'חובה', examType: 'A', isBinary: false });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
  };

  const handleDeleteCourse = async (id: string) => {
      try {
          await deleteDoc(doc(db, "courses", id));
          setCourses(prev => prev.filter(c => c.id !== id));
      } catch (e) {
          console.error("Error deleting course", e);
      }
  };

  const stats = useMemo(() => calculateStats(courses, user.totalCreditsNeeded), [courses, user]);
  
  const filteredCourses = useMemo(() => {
      return courses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [courses, searchTerm]);

  // What-If Logic
  const whatIfStats = useMemo(() => {
      const simCourses: Course[] = [...courses];
      whatIfCourses.forEach((wif, idx) => {
          simCourses.push({
              id: `sim-${idx}`,
              name: wif.name || 'Simulated',
              grade: Number(wif.grade),
              credits: Number(wif.credits),
              semester: 99,
              category: 'סימולציה',
              examType: 'A',
              isBinary: false
          });
      });
      return calculateStats(simCourses, user.totalCreditsNeeded);
  }, [courses, whatIfCourses, user]);

  const exportCSV = () => {
    const headers = ["שם הקורס", "נקודות זכות", "ציון", "סמסטר", "קטגוריה", "מועד"];
    const rows = courses.map(c => [c.name, c.credits, c.grade, c.semester, c.category, c.examType === 'A' ? "א'" : "ב'"]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
        [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_courses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
        const canvas = await html2canvas(reportRef.current, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const pdfImgHeight = imgHeight * ratio;

        if (pdfImgHeight > pdfHeight) {
            let heightLeft = pdfImgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfImgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position - heightLeft - 10, pdfWidth, pdfImgHeight);
                heightLeft -= pdfHeight;
            }
        } else {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImgHeight);
        }

        pdf.save(`Circademic_Report_${user.displayName || 'Student'}.pdf`);
    } catch (err) {
        console.error("PDF Generation failed", err);
        alert("אירעה שגיאה ביצירת ה-PDF. אנא נסה שנית.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[50vh]"><Loader2 size={48} className="animate-spin text-primary-500 mb-4" /><p className="text-gray-500">טוען את הנתונים שלך...</p></div>;

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
        ${activeTab === id 
            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm scale-[1.02] ring-1 ring-black/5 dark:ring-white/5' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200'}`}
      >
          <Icon size={18} />
          {label}
      </button>
  );

  return (
    <div className="space-y-8 animate-fade-in relative pb-10">
      
      {/* Header Stats - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {/* Average Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">ממוצע משוקלל</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{stats.average}</h2>
                        {user.targetAverage && <span className="text-xs text-gray-400">/ {user.targetAverage}</span>}
                    </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp size={24} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <ArrowUpRight size={14} />
                <span>מצב מצוין</span>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors"></div>
        </div>

        {/* Credits Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start relative z-10">
                <div>
                     <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">נקודות זכות</p>
                     <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalCredits}</h2>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen size={24} />
                </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.completedPercentage}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{stats.completedPercentage}% מהתואר הושלמו</p>
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-full blur-3xl group-hover:bg-green-100 dark:group-hover:bg-green-900/20 transition-colors"></div>
        </div>

        {/* Best Grade Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start relative z-10">
                <div className="overflow-hidden">
                     <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">הישג שיא</p>
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={stats.maxGrade?.name}>{stats.maxGrade?.name || '-'}</h2>
                     <p className="text-3xl font-black text-yellow-500 mt-1">{stats.maxGrade?.grade || 0}</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                    <Award size={24} />
                </div>
            </div>
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-yellow-50 dark:bg-yellow-900/10 rounded-full blur-3xl group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/20 transition-colors"></div>
        </div>

        {/* Semester Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start relative z-10">
                <div>
                     <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">סמסטר נוכחי</p>
                     <h2 className="text-4xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                        {stats.semesterAverages.length > 0 ? stats.semesterAverages[stats.semesterAverages.length - 1].semester : 1}
                     </h2>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <Calendar size={24} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>ממשיך להתקדם!</span>
            </div>
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors"></div>
        </div>
      </div>

      {/* Navigation Tabs - Modern Pill Design */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl inline-flex gap-1 overflow-x-auto max-w-full no-scrollbar border border-gray-200 dark:border-gray-700">
             <TabButton id="overview" label="סקירה כללית" icon={LayoutDashboard} />
             <TabButton id="courses" label="ניהול קורסים" icon={List} />
             <TabButton id="tools" label="מחשבונים" icon={Calculator} />
             <TabButton id="ai" label="סטודיו AI" icon={Wand2} />
          </div>
          
          {activeTab === 'overview' && (
             <button 
                onClick={generatePDF} 
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl hover:bg-black dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
             >
                  {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isGeneratingPdf ? 'מייצר דוח...' : 'הורד דוח PDF'}
             </button>
          )}
      </div>

      {/* TAB CONTENT */}
      
      {/* 1. Overview */}
      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">מגמת ציונים</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.semesterAverages}>
                            <defs>
                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="semester" stroke="#9ca3af" tickLine={false} axisLine={false} tickMargin={10} />
                            <YAxis domain={[0, 100]} stroke="#9ca3af" tickLine={false} axisLine={false} tickMargin={10} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
                            />
                            <Area type="monotone" dataKey="average" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">התפלגות לפי קטגוריות</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.categoryAverages} layout="vertical" barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis dataKey="category" type="category" width={80} stroke="#9ca3af" tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="average" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Courses Management */}
      {activeTab === 'courses' && (
          <div className="space-y-6 animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="relative w-full md:w-auto">
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="חיפוש קורס..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 pr-11 pl-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
                      />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={exportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm">
                          <Download size={18} />
                          ייצוא CSV
                      </button>
                      <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-sm">
                          <Plus size={18} />
                          הוסף קורס
                      </button>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-5 first:rounded-tr-2xl">שם הקורס</th>
                                <th className="px-6 py-5">נק"ז</th>
                                <th className="px-6 py-5">סמסטר</th>
                                <th className="px-6 py-5">ציון</th>
                                <th className="px-6 py-5">קטגוריה</th>
                                <th className="px-6 py-5">מועד</th>
                                <th className="px-6 py-5 last:rounded-tl-2xl no-print">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-3">
                                                <List size={32} />
                                            </div>
                                            <p className="font-medium">לא נמצאו קורסים</p>
                                            <p className="text-sm mt-1">נסה לשנות את הסינון או הוסף קורס חדש</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCourses.map(course => (
                                <tr key={course.id} className="group hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{course.name}</td>
                                    <td className="px-6 py-4">{course.credits}</td>
                                    <td className="px-6 py-4">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-medium text-xs">
                                            {course.semester}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block min-w-[3rem] text-center
                                            ${course.isBinary 
                                                ? (course.isPass ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')
                                                : (course.grade >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : course.grade < 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300')}`}>
                                            {course.isBinary ? (course.isPass ? 'עבר' : 'נכשל') : course.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-md">
                                            {course.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{course.examType === 'A' ? "א'" : "ב'"}</td>
                                    <td className="px-6 py-4 flex gap-2 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingCourse(course); setNewCourse(course); setIsAddModalOpen(true); }} className="p-2 hover:bg-white dark:hover:bg-gray-600 text-blue-500 rounded-lg shadow-sm transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2 hover:bg-white dark:hover:bg-gray-600 text-red-500 rounded-lg shadow-sm transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {/* 3. Calculators */}
      {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              {/* What If */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl text-purple-600 shadow-sm">
                        <Calculator size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold dark:text-white">סימולטור "מה אם"</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">בדוק השפעת ציונים עתידיים</p>
                      </div>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="flex gap-3">
                          <input 
                            type="number" 
                            placeholder="ציון צפוי" 
                            className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            id="wif-grade"
                          />
                          <input 
                            type="number" 
                            placeholder="נק' זכות" 
                            className="w-28 p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            defaultValue={3}
                            id="wif-credits"
                          />
                          <button 
                            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors shadow-md"
                            onClick={() => {
                                const g = parseFloat((document.getElementById('wif-grade') as HTMLInputElement).value);
                                const c = parseFloat((document.getElementById('wif-credits') as HTMLInputElement).value);
                                if (!isNaN(g)) setWhatIfCourses([...whatIfCourses, { grade: g, credits: c || 3 }]);
                            }}
                          >
                              <Plus size={20} />
                          </button>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl space-y-4 border border-purple-100 dark:border-purple-900/20">
                          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                              <span>ממוצע נוכחי:</span>
                              <span className="font-bold">{stats.average}</span>
                          </div>
                          <div className="h-px bg-purple-200 dark:bg-purple-800/30 w-full"></div>
                          <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 font-black text-2xl">
                              <span>ממוצע משוער:</span>
                              <span>{whatIfStats.average}</span>
                          </div>
                      </div>
                      
                      {whatIfCourses.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">קורסים בסימולציה</p>
                            <div className="flex flex-wrap gap-2">
                                {whatIfCourses.map((c, i) => (
                                    <span key={i} className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-2 dark:text-gray-200 shadow-sm animate-fade-in">
                                        <span className="font-bold">{c.grade}</span> 
                                        <span className="text-gray-500 dark:text-gray-400 text-xs">({c.credits} נ"ז)</span>
                                        <button onClick={() => setWhatIfCourses(whatIfCourses.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                      )}
                  </div>
              </div>

              {/* Shield Calculator */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 shadow-sm">
                        <Shield size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold dark:text-white">מחשבון ציון מגן</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">חישוב משקל בחינה ומגן</p>
                      </div>
                  </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-5">
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">ציון מגן</label>
                              <input 
                                type="number" 
                                value={shieldMagen} 
                                onChange={(e) => setShieldMagen(Number(e.target.value))}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">אחוז מגן (%)</label>
                              <input 
                                type="number" 
                                value={shieldPercent} 
                                onChange={(e) => setShieldPercent(Number(e.target.value))}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                              />
                          </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                          <label className="text-sm font-medium block mb-3 dark:text-gray-300">חישוב ציון סופי</label>
                          <div className="flex gap-3 items-center">
                              <input 
                                type="number" 
                                placeholder="ציון בחינה" 
                                value={shieldExam}
                                onChange={(e) => setShieldExam(Number(e.target.value))}
                                className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <div className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold min-w-[80px] text-center shadow-md">
                                  {calculateShield(shieldMagen, shieldPercent, shieldExam).toFixed(0)}
                              </div>
                          </div>
                      </div>

                      <div className="pt-2">
                           <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">כדי לעבור את הקורס (55) עליך לקבל בבחינה:</p>
                           <div className="text-center bg-green-50 dark:bg-green-900/20 py-3 rounded-xl border border-green-100 dark:border-green-900/30">
                               <span className="text-2xl font-black text-green-600 dark:text-green-400">
                                    {Math.max(0, Math.ceil(calculateRequiredExam(shieldMagen, shieldPercent, 55)))}
                               </span>
                               <span className="text-sm text-green-600/70 dark:text-green-400/70 mr-1">ומעלה</span>
                           </div>
                      </div>
                   </div>
              </div>
          </div>
      )}

      {/* 4. AI Studio */}
      {activeTab === 'ai' && (
          <div className="animate-fade-in-up">
              <ImageEditor />
          </div>
      )}

      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-up border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black dark:text-white">{editingCourse ? 'עריכת קורס' : 'קורס חדש'}</h3>
                    <button onClick={() => { setIsAddModalOpen(false); setEditingCourse(null); }} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">שם הקורס</label>
                        <input 
                            type="text" 
                            className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={newCourse.name}
                            onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">נק' זכות</label>
                            <input 
                                type="number" 
                                className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={newCourse.credits}
                                onChange={e => setNewCourse({...newCourse, credits: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">ציון</label>
                            <input 
                                type="number" 
                                className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={newCourse.grade}
                                onChange={e => setNewCourse({...newCourse, grade: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">סמסטר</label>
                             <select 
                                className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={newCourse.semester}
                                onChange={e => setNewCourse({...newCourse, semester: Number(e.target.value)})}
                            >
                                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>סמסטר {s}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">קטגוריה</label>
                             <select 
                                 className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                 value={newCourse.category}
                                 onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                            >
                                <option value="חובה">חובה</option>
                                <option value="בחירה">בחירה</option>
                                <option value="כללי">כללי</option>
                                <option value="ספורט">ספורט</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer dark:text-gray-300">
                            <input type="radio" className="w-4 h-4 text-primary-600" checked={newCourse.examType === 'A'} onChange={() => setNewCourse({...newCourse, examType: 'A'})} />
                            מועד א'
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer dark:text-gray-300">
                            <input type="radio" className="w-4 h-4 text-primary-600" checked={newCourse.examType === 'B'} onChange={() => setNewCourse({...newCourse, examType: 'B'})} />
                            מועד ב'
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => { setIsAddModalOpen(false); setEditingCourse(null); }} className="px-6 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">ביטול</button>
                    <button onClick={handleSaveCourse} className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5">שמור</button>
                </div>
            </div>
        </div>
      )}

      {/* Hidden PDF Report Template */}
      <div style={{ position: 'fixed', top: -10000, left: -10000, zIndex: -1 }}>
        <div ref={reportRef} className="bg-white p-12 text-gray-900" style={{ width: '210mm', minHeight: '297mm', direction: 'rtl', fontFamily: 'Heebo, sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-primary-500 pb-6 mb-8">
                <div className="flex items-center gap-3">
                    <GraduationCap size={40} className="text-primary-600" />
                    <div>
                        <h1 className="text-3xl font-black text-primary-700">Circademic</h1>
                        <p className="text-sm text-gray-500">מערכת לניהול אקדמי</p>
                    </div>
                </div>
                <div className="text-left">
                    <p className="text-sm text-gray-500">תאריך הפקה</p>
                    <p className="font-bold">{new Date().toLocaleDateString('he-IL')}</p>
                </div>
            </div>

            {/* Student Info & Stats */}
            <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-primary-700">פרטי סטודנט</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">שם מלא</p>
                            <p className="font-medium">{user.displayName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">מוסד לימודים</p>
                            <p className="font-medium">{user.institution || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">תחום לימוד</p>
                            <p className="font-medium">{user.major || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">אימייל</p>
                            <p className="font-medium">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
                    <h2 className="text-lg font-bold mb-4 text-primary-700">סיכום הישגים</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>ממוצע:</span>
                            <span className="font-bold text-xl">{stats.average}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>נ"ז שנצברו:</span>
                            <span className="font-bold">{stats.totalCredits}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>אחוז תואר:</span>
                            <span className="font-bold">{stats.completedPercentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Table */}
            <h2 className="text-xl font-bold mb-4 border-r-4 border-primary-500 pr-3">גיליון ציונים</h2>
            <table className="w-full text-sm text-right">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 rounded-r-lg">סמסטר</th>
                        <th className="px-4 py-3">קורס</th>
                        <th className="px-4 py-3">נ"ז</th>
                        <th className="px-4 py-3">קטגוריה</th>
                        <th className="px-4 py-3 rounded-l-lg">ציון</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {courses.sort((a,b) => a.semester - b.semester).map((c, i) => (
                        <tr key={c.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-bold">{c.semester}</td>
                            <td className="px-4 py-3">{c.name}</td>
                            <td className="px-4 py-3">{c.credits}</td>
                            <td className="px-4 py-3">{c.category}</td>
                            <td className="px-4 py-3 font-bold">{c.isBinary ? (c.isPass ? 'עבר' : 'נכשל') : c.grade}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                הופק באמצעות מערכת Circademic
            </div>
        </div>
      </div>
    </div>
  );
};