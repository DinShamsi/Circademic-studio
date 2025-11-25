import React from 'react';
import { TrendingUp, Shield, PieChart, FileText, CheckCircle } from 'lucide-react';

export const Landing: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10 pb-10">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          הדרך החכמה לנהל את <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-600">
            התואר האקדמי שלך
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          עקוב אחר הציונים, חשב ממוצעים, תכנן קורסים עתידיים וקבל תובנות מתקדמות על ההתקדמות שלך בתואר. הכל במקום אחד, בחינם.
        </p>
        <div className="flex justify-center gap-4 pt-4">
            <button 
                onClick={onGetStarted}
                className="bg-primary-600 hover:bg-primary-700 text-white text-lg px-8 py-3 rounded-xl font-bold shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
                התחל עכשיו בחינם
            </button>
             <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-lg px-8 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                קרא עוד עלינו
            </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 mb-6">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3 dark:text-white">מעקב ממוצע חכם</h3>
          <p className="text-gray-600 dark:text-gray-400">
            חישוב ממוצע מצטבר, סמסטריאלי ולפי קטגוריות. קבל תמונה מלאה על מצבך האקדמי בכל רגע נתון.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 mb-6">
                <PieChart size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">סימולציית "מה אם"</h3>
            <p className="text-gray-600 dark:text-gray-400">
                מתלבט אם לגשת למועד ב'? בדוק כיצד שיפור ציון או קורס עתידי ישפיעו על הממוצע הכולל שלך.
            </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">מחשבון ציון מגן</h3>
            <p className="text-gray-600 dark:text-gray-400">
                אל תנחש. חשב בדיוק כמה אתה צריך לקבל בבחינה כדי לעבור את הקורס עם ציון המגן שלך.
            </p>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-primary-900 text-white rounded-3xl p-12 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
                <div className="text-4xl font-black text-primary-300">10k+</div>
                <div className="text-primary-100 mt-1">סטודנטים פעילים</div>
            </div>
             <div>
                <div className="text-4xl font-black text-primary-300">50+</div>
                <div className="text-primary-100 mt-1">מוסדות לימוד</div>
            </div>
             <div>
                <div className="text-4xl font-black text-primary-300">150k</div>
                <div className="text-primary-100 mt-1">קורסים מנוהלים</div>
            </div>
             <div>
                <div className="text-4xl font-black text-primary-300">4.9</div>
                <div className="text-primary-100 mt-1">דירוג משתמשים</div>
            </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold dark:text-white">דוחות מקצועיים בקליק</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
                צריך להגיש גיליון ציונים למלגה או למקום עבודה? ב-Circademic תוכל לייצא דוח PDF מקצועי ומעוצב עם כל הנתונים והגרפים שלך בלחיצת כפתור.
            </p>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="text-green-500" size={20} />
                    ייצוא נתונים ל-CSV
                </li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="text-green-500" size={20} />
                    גרפים ויזואליים מתקדמים
                </li>
                 <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="text-green-500" size={20} />
                    סנכרון מלא בענן
                </li>
            </ul>
        </div>
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl h-64 w-full flex items-center justify-center">
             <FileText size={64} className="text-gray-400 dark:text-gray-500" />
             <span className="sr-only">Placeholder for PDF Screenshot</span>
        </div>
      </section>
    </div>
  );
};