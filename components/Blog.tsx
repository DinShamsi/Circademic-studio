import React from 'react';
import { BlogPost } from '../types';

export const Blog: React.FC = () => {
    // Mock data for display
    const posts: BlogPost[] = [
        {
            id: '1',
            title: 'איך להתכונן נכון לתקופת המבחנים?',
            summary: 'טיפים וטריקים שיעזרו לכם לעבור את הסמסטר בשלום ובציונים גבוהים.',
            content: '...',
            date: '10/10/2023',
            author: 'מערכת Circademic'
        },
        {
            id: '2',
            title: 'חישוב ממוצע: למה זה חשוב?',
            summary: 'המדריך המלא להבנת שיטות החישוב השונות באקדמיה.',
            content: '...',
            date: '05/09/2023',
            author: 'דני סטודנט'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white border-b pb-4 dark:border-gray-700">הבלוג האקדמי</h1>
            <div className="grid gap-8">
                {posts.map(post => (
                    <article key={post.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{post.title}</h2>
                            <span className="text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{post.date}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            {post.summary}
                        </p>
                        <button className="text-primary-600 font-medium hover:underline">קרא עוד &larr;</button>
                    </article>
                ))}
            </div>
        </div>
    );
};