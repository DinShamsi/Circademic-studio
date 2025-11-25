import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Wand2, Loader2, Download, Image as ImageIcon, X } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('הקובץ גדול מדי. אנא העלה תמונה עד 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImage(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) {
        setError('אנא העלה תמונה והכנס הנחיה לעריכה.');
        return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage(null);
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
            setGeneratedImage(imgUrl);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
          // If no image part is found, check for text output which might explain the refusal or result
          const text = response.text;
          if (text) {
             setError(`המודל החזיר טקסט במקום תמונה: "${text}"`);
          } else {
             setError('לא התקבלה תמונה מהמודל. אנא נסה שנית עם הנחיה שונה.');
          }
      }

    } catch (err: any) {
      console.error(err);
      setError('אירעה שגיאה בעיבוד התמונה. נסה שנית מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'circademic-edited-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg text-pink-600">
            <Wand2 size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold dark:text-white">עריכת תמונות חכמה</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ערוך תמונות באמצעות פקודות טקסט עם Gemini 2.5 Flash</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative h-64 flex flex-col items-center justify-center
                    ${selectedImage ? 'border-primary-300 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-600' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700'}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {selectedImage ? (
                        <>
                            <img src={selectedImage} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                            <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors" 
                                 onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setGeneratedImage(null); }}>
                                <X size={16} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-3">
                                <Upload className="text-gray-400 dark:text-gray-300" size={32} />
                            </div>
                            <p className="font-medium text-gray-600 dark:text-gray-300">לחץ להעלאת תמונה</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG עד 5MB</p>
                        </>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>

                <div className="relative">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder='תאר את העריכה המבוקשת (לדוגמה: "הוסף פילטר רטרו", "הסר את הרקע")'
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white resize-none h-32 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !selectedImage || !prompt}
                        className={`absolute bottom-4 left-4 flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all
                        ${loading || !selectedImage || !prompt ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg hover:-translate-y-0.5'}`}
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> מעבד...</> : <><Wand2 size={18} /> ערוך תמונה</>}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm border border-red-100 dark:border-red-900">
                        {error}
                    </div>
                )}
            </div>

            {/* Output Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
                 {loading ? (
                     <div className="text-center">
                         <Loader2 size={48} className="animate-spin text-pink-500 mx-auto mb-4" />
                         <p className="text-gray-500 dark:text-gray-400 animate-pulse">ה-AI עובד על זה...</p>
                     </div>
                 ) : generatedImage ? (
                     <div className="space-y-4 w-full flex flex-col items-center">
                         <img src={generatedImage} alt="Generated" className="max-h-[400px] max-w-full object-contain rounded-lg shadow-lg border border-gray-200 dark:border-gray-600" />
                         <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-6 py-2 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                         >
                             <Download size={18} />
                             הורד תוצאה
                         </button>
                     </div>
                 ) : (
                     <div className="text-center text-gray-400 dark:text-gray-500">
                         <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                         <p>התוצאה תופיע כאן</p>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};