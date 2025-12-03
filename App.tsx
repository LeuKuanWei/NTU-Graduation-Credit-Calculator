import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CourseForm from './components/CourseForm';
import SummaryCard from './components/SummaryCard';
import CourseTable from './components/CourseTable';
import TranscriptImportModal from './components/TranscriptImportModal';
import { Course, GraduationRequirements } from './types';
import { Cloud, CheckCircle2, AlertCircle, Loader2, Save, Sparkles } from 'lucide-react';

// Pantry Configuration
const PANTRY_ID = '7221a69a-c255-469e-86bf-7c36ba6f90f6';
const BASKET_NAME = 'ntu-accounting-courses';
const PANTRY_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET_NAME}`;

// NTU Accounting (111 Entry) Rules
// 共同必修(9) + 系訂必修(69) + 指定選修(21) + 一般選修(19) + 通識(15) = 總學分(133)
const ACCOUNTING_111_REQUIREMENTS: GraduationRequirements = {
  total: 133,
  commonRequired: 9,
  deptRequired: 69,
  designatedElective: 21,
  generalElective: 19,
  generalEducation: 15,
};

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [requirements] = useState<GraduationRequirements>(ACCOUNTING_111_REQUIREMENTS);
  
  // Persistence States
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'idle'>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 1. Load from Pantry on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PANTRY_URL);
        if (response.ok) {
          const data = await response.json();
          if (data.courses && Array.isArray(data.courses)) {
            setCourses(data.courses);
          }
        } else {
          // If 404/400, it usually means the basket doesn't exist yet, which is fine for a new user
          console.log("No existing data found or basket empty. Starting fresh.");
        }
      } catch (error) {
        console.error("Failed to load from Pantry:", error);
        alert("無法載入雲端資料，請檢查網路連線。");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    fetchData();
  }, []);

  // 2. Save to Pantry on Change (Debounced)
  useEffect(() => {
    if (!isInitialized) return;

    setSyncStatus('saving');
    
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(PANTRY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courses }),
        });

        if (response.ok) {
          setSyncStatus('synced');
        } else {
          throw new Error('Save failed');
        }
      } catch (error) {
        console.error("Failed to save to Pantry:", error);
        setSyncStatus('error');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(handler);
  }, [courses, isInitialized]);

  const handleAddCourse = (course: Course) => {
    setCourses((prev) => [...prev, course]);
  };

  const handleBatchAddCourses = (newCourses: Course[]) => {
    setCourses((prev) => [...prev, ...newCourses]);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm("確定要刪除這門課程嗎？ (Are you sure you want to delete this course?)")) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Render Sync Status Indicator
  const renderSyncStatus = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <div className="flex items-center text-yellow-600 text-xs">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            <span>雲端儲存中... (Saving...)</span>
          </div>
        );
      case 'synced':
        return (
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>資料已同步 (Synced)</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>儲存失敗 (Save Failed)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500 text-xs">
            <Cloud className="w-3 h-3 mr-1" />
            <span>雲端待命 (Idle)</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col space-y-4">
        <Loader2 className="w-10 h-10 text-ntu-red animate-spin" />
        <p className="text-gray-600 font-bold">正在從雲端載入課程資料...</p>
        <p className="text-gray-400 text-xs">Loading data from Pantry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-100">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Top Section: Grid layout for Input and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Left Column: Input Form (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <CourseForm onAddCourse={handleAddCourse} />
            
            {/* AI Import Button */}
            <button
               onClick={() => setIsImportModalOpen(true)}
               className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 border border-indigo-800"
            >
               <Sparkles className="w-5 h-5" />
               <span>AI 智慧匯入成績單 (Import)</span>
            </button>
            
            {/* Legend / Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 text-xs text-yellow-900 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-base">使用說明 (Instructions)</h4>
                   {renderSyncStatus()}
                </div>
                <ul className="list-disc list-inside space-y-1.5">
                    <li>本系統適用 <strong>台大會計系 111學年度入學生</strong>。</li>
                    <li>體育課程 (PE) 雖然會列出，但不計入畢業學分計算。</li>
                    <li>請依照：共同必修(9)、系訂必修(69)、指定選修(21)、一般選修(19)、通識(15) 進行分類。</li>
                    <li>GPA 採用 NTU 4.3 制計算。</li>
                    <li><strong>資料儲存：</strong> 使用 Pantry 雲端資料庫 (ID: ...90f6)。</li>
                    <li>可使用 AI 匯入功能，上傳 PDF 或貼上文字即可自動辨識。</li>
                </ul>
            </div>
          </div>

          {/* Right Column: Summary & Stats (8 cols) */}
          <div className="lg:col-span-8">
            <SummaryCard courses={courses} requirements={requirements} />
            <CourseTable 
              courses={courses} 
              onDelete={handleDeleteCourse} 
              onUpdate={handleUpdateCourse}
            />
          </div>
        </div>

      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-sm border-t-4 border-ntu-red">
        <p>&copy; {new Date().getFullYear()} NTU Accounting Graduation Credit Calculator.</p>
        <div className="flex items-center justify-center space-x-2 mt-2">
           <Cloud className="w-4 h-4" />
           <span className="text-xs">Data storage provided by Pantry Cloud (ID: 7221a69a...90f6)</span>
        </div>
        <p className="text-xs mt-1">此為輔助工具，實際畢業資格請依教務處審核為準。</p>
      </footer>
      
      <TranscriptImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleBatchAddCourses}
      />
    </div>
  );
};

export default App;