import React, { useState } from 'react';
import { Course, CourseCategory, Grade } from '../types';
import { PlusCircle, Clock } from 'lucide-react';

interface CourseFormProps {
  onAddCourse: (course: Course) => void;
}

const COMMON_COURSES = [
  "會計學原理",
  "微積分(乙)",
  "經濟學",
  "民法概要",
  "中級會計學",
  "成本與管理會計學",
  "統計學",
  "企業管理",
  "商事法",
  "高等會計學",
  "審計學",
  "財務管理",
  "稅務法規",
  "會計資訊系統"
];

const CourseForm: React.FC<CourseFormProps> = ({ onAddCourse }) => {
  const [semester, setSemester] = useState('113-2');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [category, setCategory] = useState<CourseCategory>('系訂必修');
  const [grade, setGrade] = useState<Grade>('A+');
  const [isCurrent, setIsCurrent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCourse: Course = {
      id: crypto.randomUUID(),
      semester,
      name,
      credits,
      category,
      grade,
      isCurrent
    };

    onAddCourse(newCourse);
    
    // Reset specific fields for faster entry
    setName('');
    // Keep semester and category as they are likely to be reused for batch entry
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm p-4 h-full">
      <div className="flex items-center space-x-2 border-b-2 border-ntu-red pb-2 mb-4">
        <PlusCircle className="w-5 h-5 text-ntu-red" />
        <h2 className="text-lg font-bold text-gray-800">新增課程 Add Course</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">學年期 (Semester)</label>
                <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. 111-1"
                    className="w-full border border-gray-300 p-2 text-sm focus:border-ntu-red focus:ring-1 focus:ring-ntu-red outline-none"
                />
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">學分 (Credits)</label>
                <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-ntu-red focus:ring-1 focus:ring-ntu-red outline-none"
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">課程名稱 (Course Name)</label>
            <input
                list="course-suggestions"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入或選擇課程..."
                className="w-full border border-gray-300 p-2 text-sm focus:border-ntu-red focus:ring-1 focus:ring-ntu-red outline-none"
            />
            <datalist id="course-suggestions">
                {COMMON_COURSES.map((course) => (
                    <option key={course} value={course} />
                ))}
            </datalist>
            <p className="text-[10px] text-gray-500 mt-1">
                *可從選單快速選擇會計系核心課程
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">修課類別 (Category)</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CourseCategory)}
                    className="w-full border border-gray-300 p-2 text-sm bg-white focus:border-ntu-red focus:ring-1 focus:ring-ntu-red outline-none"
                >
                    <option value="系訂必修">系訂必修 (Dept Req)</option>
                    <option value="共同必修">共同必修 (Common Req)</option>
                    <option value="指定選修">指定選修 (Designated Elec)</option>
                    <option value="一般選修">一般選修 (General Elec)</option>
                    <option value="通識">通識 (General Ed)</option>
                    <option value="體育">體育 (PE)</option>
                    <option value="其他">其他 (Other)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isCurrent ? '預估成績 (Predicted)' : '成績 (Grade)'}
                </label>
                <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as Grade)}
                    className="w-full border border-gray-300 p-2 text-sm bg-white focus:border-ntu-red focus:ring-1 focus:ring-ntu-red outline-none"
                >
                    <option value="A+">A+ (4.3)</option>
                    <option value="A">A (4.0)</option>
                    <option value="A-">A- (3.7)</option>
                    <option value="B+">B+ (3.3)</option>
                    <option value="B">B (3.0)</option>
                    <option value="B-">B- (2.7)</option>
                    <option value="C+">C+ (2.3)</option>
                    <option value="C">C (2.0)</option>
                    <option value="C-">C- (1.7)</option>
                    <option value="Pass">Pass</option>
                    <option value="F">F (0)</option>
                </select>
            </div>
        </div>

        {/* Current Semester Toggle */}
        <div className="flex items-center bg-blue-50 border border-blue-200 p-2 rounded cursor-pointer" onClick={() => setIsCurrent(!isCurrent)}>
            <div className={`w-4 h-4 border border-gray-400 rounded mr-2 flex items-center justify-center bg-white ${isCurrent ? 'bg-blue-600 border-blue-600' : ''}`}>
                {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <div className="flex flex-col select-none">
                <span className="text-sm font-bold text-blue-900 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    本學期正在修習 (In Progress)
                </span>
                <span className="text-[10px] text-blue-700">勾選後將計入預覽學分與預估 GPA</span>
            </div>
        </div>

        <button
            type="submit"
            className="w-full bg-ntu-red text-white font-bold py-2 px-4 hover:bg-red-900 transition-colors shadow-sm text-sm mt-2 border border-red-900"
        >
            加入課程 Add Course
        </button>
      </form>
    </div>
  );
};

export default CourseForm;