import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Course, CourseCategory, Grade } from '../types';
import { X, Sparkles, ArrowRight, Loader2, Check, AlertCircle, Upload, FileText, Trash2, Clock } from 'lucide-react';

interface TranscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (courses: Course[]) => void;
}

// Temporary type for the review stage
interface ParsedCourse {
  tempId: string;
  semester: string;
  name: string;
  credits: number;
  grade: Grade;
  category: CourseCategory;
  isCurrent: boolean;
}

const TranscriptImportModal: React.FC<TranscriptImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Safe ID generator fallback
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Helper to convert file to Base64 for Gemini
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // remove "data:application/pdf;base64," prefix
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
    
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() && !selectedFile) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are an assistant that extracts university course data from transcripts.
        Extract a list of courses.
        
        Rules:
        1. Convert semester to format "YYY-S" (e.g. 111/1 or 111上 becomes 111-1).
        2. Extract course name strictly.
        3. Extract credits (number).
        4. Extract grade. Convert specific grades: "通過"->"Pass", "免修"->"Pass", "抵免"->"Pass".
        5. Filter out courses with 0 credits unless they are Service Learning (服務學習).
        6. Return purely JSON.
      `;

      let contents: any = {};

      if (selectedFile) {
        // Multimodal Input (PDF/Image)
        const filePart = await fileToGenerativePart(selectedFile);
        contents = {
          parts: [
            filePart,
            { text: "Analyze this transcript document and extract the course history table." }
          ]
        };
      } else {
        // Text Input
        contents = {
            parts: [{ text: `Analyze the following transcript text:\n${rawText}` }]
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                semester: { type: Type.STRING },
                name: { type: Type.STRING },
                credits: { type: Type.NUMBER },
                grade: { type: Type.STRING },
              },
              required: ["semester", "name", "credits", "grade"],
            },
          },
        },
      });

      const data = JSON.parse(response.text || "[]");
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No courses found");
      }

      // Map to local state with unique IDs and default category
      const mapped: ParsedCourse[] = data.map((item: any, idx: number) => ({
        tempId: `parsed-${idx}-${Date.now()}`,
        semester: item.semester || "111-1",
        name: item.name || "Unknown Course",
        credits: Number(item.credits) || 0, // Ensure number
        grade: mapGrade(item.grade),
        category: '一般選修', // Default to General Elective, user must change
        isCurrent: false, // Default to not current
      }));

      setParsedCourses(mapped);
      setStep('review');

    } catch (err) {
      console.error(err);
      setError("無法解析內容，請確認檔案清晰度或文字格式。(Failed to parse transcript)");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to map raw grade strings to our Grade type
  const mapGrade = (raw: string): Grade => {
    if (!raw) return 'Pass';
    const g = raw.trim().toUpperCase();
    const valid: Grade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F', 'Pass'];
    if (valid.includes(g as Grade)) return g as Grade;
    if (['通過', '免修', '抵免', 'P', 'PASS'].some(x => g.includes(x))) return 'Pass';
    return 'Pass'; // Fallback
  };

  const handleFieldChange = (id: string, field: keyof ParsedCourse, value: any) => {
    setParsedCourses(prev => prev.map(c => 
      c.tempId === id ? { ...c, [field]: value } : c
    ));
  };

  const handleRemoveRow = (id: string) => {
    setParsedCourses(prev => prev.filter(c => c.tempId !== id));
  };

  const handleConfirmImport = () => {
    try {
      // Validate and convert ParsedCourse to actual Course
      const finalCourses: Course[] = parsedCourses
        .filter(c => c.name && !isNaN(c.credits)) // Basic validation
        .map(c => ({
          id: generateId(),
          semester: c.semester,
          name: c.name,
          credits: Number(c.credits), // Ensure it's a number
          grade: c.grade,
          category: c.category,
          isCurrent: c.isCurrent
        }));
      
      onImport(finalCourses);
      handleClose();
    } catch (e) {
      console.error("Error importing courses:", e);
      setError("匯入時發生錯誤，請檢查資料格式。");
    }
  };

  const handleClose = () => {
    setStep('input');
    setRawText('');
    setSelectedFile(null);
    setParsedCourses([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setRawText(''); // Clear text if file selected
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-ntu-red text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-lg">AI 智慧匯入成績單 (Smart Import)</h3>
          </div>
          <button onClick={handleClose} className="hover:bg-red-800 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6">
          
          {step === 'input' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-800 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">使用說明：</p>
                  <p>您可以上傳成績單 PDF/圖片，或直接貼上文字。</p>
                  <p>AI 會自動辨識課程名稱與成績，<span className="font-bold underline">修課類別將預設為「一般選修」，請在下一步驟自行分配。</span></p>
                </div>
              </div>

              {/* File Upload Section */}
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-ntu-red hover:bg-red-50'}`}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/jpg" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
                
                {!selectedFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Upload className="w-8 h-8 text-ntu-red" />
                    </div>
                    <p className="text-gray-700 font-bold">點擊上傳 PDF 或 圖片檔</p>
                    <p className="text-gray-400 text-xs">支援格式: .pdf, .png, .jpg</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between max-w-md mx-auto bg-white p-3 rounded shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className="w-8 h-8 text-red-600 flex-shrink-0" />
                      <div className="text-left overflow-hidden">
                         <p className="font-bold text-gray-800 truncate">{selectedFile.name}</p>
                         <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={clearFile} className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Text Input Section */}
              <div className={selectedFile ? 'opacity-50 pointer-events-none' : ''}>
                 <textarea
                    className="w-full h-32 p-4 border border-gray-300 rounded focus:ring-2 focus:ring-ntu-red focus:border-ntu-red font-mono text-sm"
                    placeholder="或在此貼上成績單文字..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    disabled={!!selectedFile}
                  ></textarea>
              </div>

              {error && (
                <div className="text-red-600 text-sm font-bold flex items-center bg-red-50 p-3 rounded border border-red-200">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 flex items-center justify-between">
                 <span className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    已辨識 {parsedCourses.length} 門課程。請檢查並編輯所有欄位，設定正確的修課類別。
                 </span>
               </div>

               <div className="overflow-x-auto border border-gray-200 rounded">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-100 text-gray-700 font-bold">
                     <tr>
                       <th className="p-2 border-b w-24">學期</th>
                       <th className="p-2 border-b">課程名稱</th>
                       <th className="p-2 border-b w-16">學分</th>
                       <th className="p-2 border-b w-24">成績</th>
                       <th className="p-2 border-b w-40">修課類別</th>
                       <th className="p-2 border-b w-20 text-center">本學期?</th>
                       <th className="p-2 border-b w-10"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {parsedCourses.map((course) => (
                       <tr key={course.tempId} className="hover:bg-gray-50 border-b last:border-0">
                         <td className="p-2">
                           <input 
                              type="text" 
                              value={course.semester}
                              onChange={(e) => handleFieldChange(course.tempId, 'semester', e.target.value)}
                              className="w-full border border-gray-300 rounded p-1 text-xs focus:border-ntu-red outline-none"
                           />
                         </td>
                         <td className="p-2">
                            <input 
                              type="text" 
                              value={course.name}
                              onChange={(e) => handleFieldChange(course.tempId, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded p-1 text-xs focus:border-ntu-red outline-none"
                           />
                         </td>
                         <td className="p-2">
                            <input 
                              type="number"
                              min="0"
                              max="15" 
                              value={course.credits}
                              onChange={(e) => handleFieldChange(course.tempId, 'credits', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded p-1 text-xs text-center focus:border-ntu-red outline-none"
                           />
                         </td>
                         <td className="p-2">
                           <select 
                              className="w-full border border-gray-300 rounded p-1 text-xs focus:border-ntu-red outline-none bg-white"
                              value={course.grade}
                              onChange={(e) => handleFieldChange(course.tempId, 'grade', e.target.value as Grade)}
                           >
                             <option value="A+">A+</option>
                             <option value="A">A</option>
                             <option value="A-">A-</option>
                             <option value="B+">B+</option>
                             <option value="B">B</option>
                             <option value="B-">B-</option>
                             <option value="C+">C+</option>
                             <option value="C">C</option>
                             <option value="C-">C-</option>
                             <option value="Pass">Pass</option>
                             <option value="F">F</option>
                           </select>
                         </td>
                         <td className="p-2">
                           <select 
                              className="w-full border border-gray-300 rounded p-1 text-xs focus:border-ntu-red outline-none bg-white"
                              value={course.category}
                              onChange={(e) => handleFieldChange(course.tempId, 'category', e.target.value as CourseCategory)}
                           >
                             <option value="系訂必修">系訂必修</option>
                             <option value="共同必修">共同必修</option>
                             <option value="指定選修">指定選修</option>
                             <option value="一般選修">一般選修</option>
                             <option value="通識">通識</option>
                             <option value="體育">體育</option>
                             <option value="其他">其他</option>
                           </select>
                         </td>
                         <td className="p-2 text-center">
                            <input 
                                type="checkbox"
                                checked={course.isCurrent}
                                onChange={(e) => handleFieldChange(course.tempId, 'isCurrent', e.target.checked)}
                                className="w-4 h-4"
                            />
                         </td>
                         <td className="p-2 text-center">
                           <button 
                            onClick={() => handleRemoveRow(course.tempId)}
                            className="text-gray-400 hover:text-red-600"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          {step === 'input' ? (
             <>
               <button 
                 onClick={handleClose} 
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 取消
               </button>
               <button 
                 onClick={handleAnalyze} 
                 disabled={isAnalyzing || (!rawText.trim() && !selectedFile)}
                 className={`flex items-center px-4 py-2 rounded font-bold text-white transition-colors ${
                    isAnalyzing || (!rawText.trim() && !selectedFile) ? 'bg-gray-400 cursor-not-allowed' : 'bg-ntu-red hover:bg-red-900'
                 }`}
               >
                 {isAnalyzing ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     分析中...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2" />
                     開始分析 (Analyze)
                   </>
                 )}
               </button>
             </>
          ) : (
            <>
               <button 
                 onClick={() => setStep('input')} 
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 上一步
               </button>
               <button 
                 onClick={handleConfirmImport} 
                 className="flex items-center px-4 py-2 rounded font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
               >
                 確認匯入 (Confirm Import)
                 <ArrowRight className="w-4 h-4 ml-2" />
               </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default TranscriptImportModal;