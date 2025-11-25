import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { Blog } from './components/Blog';
import { UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isDark, setIsDark] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');

  // Handle Theme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  // Handle Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extra profile data
        const docRef = doc(db, "users", firebaseUser.uid);
        try {
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({ 
                    uid: firebaseUser.uid, 
                    email: firebaseUser.email || '', 
                    displayName: data.displayName || firebaseUser.displayName || 'Student',
                    institution: data.institution || '',
                    major: data.major || '',
                    totalCreditsNeeded: data.totalCreditsNeeded || 120,
                    targetAverage: data.targetAverage,
                    photoURL: data.photoURL
                } as UserProfile);
            } else {
                // Basic profile if not in DB yet (e.g. first google login)
                 const newProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || 'Student',
                    email: firebaseUser.email || '',
                    institution: 'לא מוגדר',
                    major: 'לא מוגדר',
                    totalCreditsNeeded: 120
                };
                await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
                setUser(newProfile);
            }
            if (currentPage === 'login' || currentPage === 'landing') setCurrentPage('dashboard');
        } catch (e) {
            console.error("Error fetching user profile", e);
            // Fallback
             setUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Student',
                email: firebaseUser.email || '',
                institution: '',
                major: '',
                totalCreditsNeeded: 120
            });
        }
      } else {
        setUser(null);
        if (currentPage === 'dashboard') setCurrentPage('landing');
      }
    });
    return () => unsubscribe();
  }, [currentPage]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        console.error(e);
        setError("שגיאה בהתחברות עם גוגל");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
        if (authMode === 'register') {
            const res = await createUserWithEmailAndPassword(auth, email, password);
             // Create profile
             const newProfile = {
                displayName: name,
                institution,
                major,
                totalCreditsNeeded: 120,
                email
            };
            await setDoc(doc(db, "users", res.user.uid), newProfile);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err: any) {
        setError(err.message);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onGetStarted={() => setCurrentPage(user ? 'dashboard' : 'login')} />;
      case 'dashboard':
        return user ? <Dashboard user={user} /> : <div>אנא התחבר כדי לצפות בדאשבורד</div>;
      case 'blog':
        return <Blog />;
      case 'login':
        return (
            <div className="flex justify-center items-center py-12">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
                        {authMode === 'login' ? 'התחברות למערכת' : 'הרשמה חדשה'}
                    </h2>
                    
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {authMode === 'register' && (
                            <>
                                <input required type="text" placeholder="שם מלא" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                                <input required type="text" placeholder="מוסד לימודים" value={institution} onChange={e => setInstitution(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                                <input required type="text" placeholder="תחום לימוד" value={major} onChange={e => setMajor(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                            </>
                        )}
                        <input required type="email" placeholder="אימייל" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                        <input required type="password" placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                        
                        <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors">
                             {authMode === 'login' ? 'התחבר' : 'הרשם'}
                        </button>
                    </form>
                    
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">או</span></div>
                        </div>
                        <button onClick={handleGoogleLogin} className="mt-4 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-medium py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex justify-center gap-2">
                            התחבר עם Google
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-primary-600 hover:underline">
                            {authMode === 'login' ? 'אין לך חשבון? הירשם עכשיו' : 'יש לך חשבון? התחבר'}
                        </button>
                    </div>
                </div>
            </div>
        );
      default:
        return <Landing onGetStarted={() => setCurrentPage('login')} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={() => signOut(auth)} 
      isDark={isDark} 
      toggleTheme={toggleTheme}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;