import React, { useState } from 'react';
import { Course, CourseCategory, Grade } from '../types';
import { Trash2, BookOpen, Layers, Pencil, Check, X, Clock } from 'lucide-react';

interface CourseTableProps {
  courses: Course[];
  onDelete: (id: string) => void;
  onUpdate: (course: Course) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({ courses, onDelete, onUpdate }) => {
  // State for tracking which row is being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Course | null>(null);

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setEditValues({ ...course });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const saveEdit = () => {
    if (editValues) {
      onUpdate(editValues);
      cancelEdit();
    }
  };

  const handleEditChange = (field: keyof Course, value: any) => {
    if (editValues) {
      setEditValues({ ...editValues, [field]: value });
    }
  };

  if (courses.length === 0) {
    return (
      <div className="bg-white border border-gray-300 p-8 text-center text-gray-500 shadow-sm mt-6">
        <p className="mb-2 font-bold text-lg">尚無修課紀錄</p>
        <p className="text-sm">請使用上方表單新增課程。</p>
      </div>
    );
  }

  // Group courses by Category
  const groupedCourses: Record<CourseCategory, Course[]> = {
    '共同必修': [],
    '系訂必修': [],
    '指定選修': [],
    '一般選修': [],
    '通識': [],
    '體育': [],
    '其他': [],
  };

  courses.forEach(course => {
    if (groupedCourses[course.category]) {
      groupedCourses[course.category].push(course);
    } else {
      groupedCourses['其他'].push(course);
    }
  });

  // Helper to compare semesters numerically (e.g. 111-1 vs 111-2)
  const compareSemesters = (semA: string, semB: string) => {
    // Split by non-digit characters to handle 111-1, 111/1, etc.
    const splitA = semA.split(/[^0-9]/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    const splitB = semB.split(/[^0-9]/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));

    // Compare Academic Year
    const yearA = splitA[0] || 0;
    const yearB = splitB[0] || 0;
    if (yearA !== yearB) return yearA - yearB;

    // Compare Semester (if exists)
    const termA = splitA[1] || 0;
    const termB = splitB[1] || 0;
    return termA - termB;
  };

  // Helper to render a table section
  const renderSection = (title: string, category: CourseCategory, color: string) => {
    // Sort courses chronologically using the helper
    const categoryCourses = groupedCourses[category].sort((a, b) => {
        const semDiff = compareSemesters(a.semester, b.semester);
        if (semDiff !== 0) return semDiff;
        // Secondary sort by name if semesters are identical
        return a.name.localeCompare(b.name);
    });

    if (categoryCourses.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <div className={`flex items-center gap-2 mb-2 px-2 py-1 ${color} bg-opacity-10 border-l-4 ${color.replace('text', 'border')}`}>
            <Layers className={`w-4 h-4 ${color}`} />
            <h3 className={`font-bold ${color}`}>{title} ({categoryCourses.length})</h3>
        </div>
        <div className="overflow-x-auto border-t border-b border-gray-200">
          <table className="w-full ntu-table border-collapse bg-white">
            <thead>
              <tr>
                <th className="w-24 text-center">學年期</th>
                <th className="text-left">課程名稱</th>
                <th className="w-16 text-center">學分</th>
                <th className="w-20 text-center">成績</th>
                <th className="w-32 text-center">類別</th>
                <th className="w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {categoryCourses.map((course, index) => {
                const isEditing = editingId === course.id;
                const isCurrent = course.isCurrent;
                
                if (isEditing && editValues) {
                    return (
                        <tr key={course.id} className="bg-yellow-100">
                             <td className="text-center p-1">
                                <input 
                                    type="text" 
                                    value={editValues.semester}
                                    onChange={(e) => handleEditChange('semester', e.target.value)}
                                    className="w-full border border-gray-400 p-1 text-xs text-center font-mono"
                                />
                             </td>
                             <td className="p-1">
                                <input 
                                    type="text" 
                                    value={editValues.name}
                                    onChange={(e) => handleEditChange('name', e.target.value)}
                                    className="w-full border border-gray-400 p-1 text-xs font-bold"
                                />
                                <div className="mt-1 flex items-center">
                                    <input 
                                        type="checkbox"
                                        id={`edit-current-${course.id}`}
                                        checked={!!editValues.isCurrent}
                                        onChange={(e) => handleEditChange('isCurrent', e.target.checked)}
                                        className="mr-1"
                                    />
                                    <label htmlFor={`edit-current-${course.id}`} className="text-[10px] text-gray-600">本學期 (In Progress)</label>
                                </div>
                             </td>
                             <td className="text-center p-1">
                                <input 
                                    type="number" 
                                    min="0"
                                    max="10"
                                    value={editValues.credits}
                                    onChange={(e) => handleEditChange('credits', Number(e.target.value))}
                                    className="w-full border border-gray-400 p-1 text-xs text-center font-mono"
                                />
                             </td>
                             <td className="text-center p-1">
                                <select
                                    value={editValues.grade}
                                    onChange={(e) => handleEditChange('grade', e.target.value as Grade)}
                                    className="w-full border border-gray-400 p-1 text-xs text-center bg-white"
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
                             <td className="text-center p-1">
                                <select
                                    value={editValues.category}
                                    onChange={(e) => handleEditChange('category', e.target.value as CourseCategory)}
                                    className="w-full border border-gray-400 p-1 text-xs text-center bg-white"
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
                             <td className="text-center p-1 flex items-center justify-center space-x-1">
                                <button
                                  onClick={saveEdit}
                                  className="text-green-600 hover:text-green-800 p-1"
                                  title="儲存 Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-500 hover:text-gray-700 p-1"
                                  title="取消 Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                             </td>
                        </tr>
                    );
                }

                return (
                    <tr 
                        key={course.id} 
                        className={`
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                            hover:bg-yellow-50 
                            ${isCurrent ? 'bg-blue-50 bg-opacity-60 border-l-2 border-l-blue-400' : ''}
                        `}
                    >
                    <td className="text-center text-gray-700 font-mono text-sm">{course.semester}</td>
                    <td className="font-medium text-gray-900 relative">
                        <div className="flex items-center">
                            {course.name}
                            {isCurrent && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                    <Clock className="w-3 h-3 mr-0.5" />
                                    修習中
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="text-center font-mono">{course.credits}</td>
                    <td className={`text-center font-bold ${course.grade === 'F' ? 'text-red-600' : 'text-gray-800'}`}>
                        {course.grade}
                        {isCurrent && <span className="text-[10px] text-gray-400 block font-normal">(預估)</span>}
                    </td>
                     <td className="text-center text-xs text-gray-500">
                        {course.category}
                    </td>
                    <td className="text-center flex items-center justify-center space-x-1">
                        <button
                        onClick={() => startEdit(course)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                        title="編輯 Edit"
                        >
                        <Pencil className="w-4 h-4" />
                        </button>
                        <button
                        onClick={() => onDelete(course.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="刪除 Delete"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm p-4 mt-6">
      <div className="flex items-center space-x-2 border-b-2 border-ntu-red pb-2 mb-4">
        <BookOpen className="w-5 h-5 text-ntu-red" />
        <h2 className="text-lg font-bold text-gray-800">歷年修課明細 Course List</h2>
      </div>
      
      {renderSection('共同必修 (Common Required)', '共同必修', 'text-teal-700')}
      {renderSection('體育課程 (Physical Education)', '體育', 'text-blue-700')}
      {renderSection('系訂必修 (Department Required)', '系訂必修', 'text-red-700')}
      {renderSection('指定選修 (Designated Electives)', '指定選修', 'text-purple-700')}
      {renderSection('一般選修 (General Electives)', '一般選修', 'text-indigo-700')}
      {renderSection('通識 (General Education)', '通識', 'text-orange-700')}
      {renderSection('其他課程 (Others)', '其他', 'text-gray-700')}
      
      <div className="mt-4 text-xs text-gray-500 text-right">
        總計科目數: {courses.length}
      </div>
    </div>
  );
};

export default CourseTable;