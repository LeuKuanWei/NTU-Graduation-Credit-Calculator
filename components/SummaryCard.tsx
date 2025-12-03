import React from 'react';
import { GraduationRequirements, Course, GRADE_POINTS } from '../types';
import { Calculator, Award, AlertCircle, TrendingUp } from 'lucide-react';

interface SummaryCardProps {
  courses: Course[];
  requirements: GraduationRequirements;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ courses, requirements }) => {
  // Initialize accumulator structure
  const initialAcc = {
    total: { earned: 0, projected: 0 },
    commonRequired: { earned: 0, projected: 0 },
    deptRequired: { earned: 0, projected: 0 },
    designatedElective: { earned: 0, projected: 0 },
    generalElective: { earned: 0, projected: 0 },
    generalEducation: { earned: 0, projected: 0 }
  };

  // Calculate Totals (Separating Completed vs In-Progress)
  const totals = courses.reduce((acc, course) => {
    // PE (體育) does not count toward graduation credits
    if (course.category === '體育') return acc;
    
    const targetKey = 
        course.category === '共同必修' ? 'commonRequired' :
        course.category === '系訂必修' ? 'deptRequired' :
        course.category === '指定選修' ? 'designatedElective' :
        course.category === '一般選修' ? 'generalElective' :
        course.category === '通識' ? 'generalEducation' :
        'generalElective'; // Default to General Elective for '其他' or unknown

    // Add to specific category
    if (course.isCurrent) {
        acc[targetKey].projected += course.credits;
        acc.total.projected += course.credits;
    } else {
        acc[targetKey].earned += course.credits;
        acc.total.earned += course.credits;
    }
    
    return acc;
  }, JSON.parse(JSON.stringify(initialAcc)));

  // Calculate GPA
  let earnedPoints = 0;
  let earnedCredits = 0;
  
  let projectedPoints = 0;
  let projectedCredits = 0;

  courses.forEach(course => {
    const points = GRADE_POINTS[course.grade];
    // Exclude Pass/Fail or invalid grades from GPA calculation
    // Points must be >= 0, and not PE (usually)
    if (points >= 0 && course.credits > 0 && course.category !== '體育') {
      if (course.isCurrent) {
          projectedPoints += points * course.credits;
          projectedCredits += course.credits;
      } else {
          earnedPoints += points * course.credits;
          earnedCredits += course.credits;
      }
    }
  });

  const currentGPA = earnedCredits > 0 ? (earnedPoints / earnedCredits).toFixed(2) : "0.00";
  const totalProjectedPoints = earnedPoints + projectedPoints;
  const totalProjectedCredits = earnedCredits + projectedCredits;
  const projectedGPA = totalProjectedCredits > 0 ? (totalProjectedPoints / totalProjectedCredits).toFixed(2) : "0.00";

  const renderProgressBar = (label: string, earned: number, projected: number, max: number, colorBase: string, colorLight: string) => {
    const earnedPct = Math.min((earned / max) * 100, 100);
    const projectedPct = Math.min(((earned + projected) / max) * 100, 100);
    const extraPct = projectedPct - earnedPct; // The width of the projected segment
    
    const isMet = earned >= max;
    const isMetProjected = (earned + projected) >= max;

    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1 text-sm">
            <span className="font-bold text-gray-700">{label}</span>
            <div className="text-right">
                <span className={`${isMet ? 'text-green-700 font-bold' : 'text-gray-800'}`}>
                    {earned}
                </span>
                {projected > 0 && (
                     <span className="text-blue-600 font-medium text-xs ml-1">
                        (+{projected})
                     </span>
                )}
                <span className="text-gray-500"> / {max}</span>
            </div>
        </div>
        <div className="w-full bg-gray-200 h-5 border border-gray-300 rounded-sm relative flex">
            {/* Earned Segment */}
            <div
                className={`h-full ${colorBase} flex items-center justify-center text-[10px] text-white whitespace-nowrap overflow-hidden transition-all duration-500`}
                style={{ width: `${earnedPct}%` }}
            >
                {earnedPct >= 10 && `${Math.round(earnedPct)}%`}
            </div>
            {/* Projected Segment */}
            <div
                className={`h-full ${colorLight} bg-opacity-80 flex items-center justify-center text-[10px] text-white whitespace-nowrap overflow-hidden transition-all duration-500`}
                style={{ width: `${extraPct}%`, backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}
            >
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm p-4">
      <div className="flex items-center space-x-2 border-b-2 border-ntu-red pb-2 mb-4">
        <Calculator className="w-5 h-5 text-ntu-red" />
        <h2 className="text-lg font-bold text-gray-800">修業進度摘要 Summary</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* GPA Box - Now Split */}
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-yellow-50 border border-yellow-200 p-3 flex flex-col items-center justify-center">
                <div className="flex items-center space-x-1 mb-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-gray-600">目前 (Current)</span>
                </div>
                <span className="text-2xl font-bold text-gray-800 font-serif">{currentGPA}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="flex items-center space-x-1 mb-1 relative z-10">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-800">預估 (Projected)</span>
                </div>
                <span className="text-2xl font-bold text-blue-700 font-serif relative z-10">{projectedGPA}</span>
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-100 rounded-full blur-xl"></div>
            </div>
        </div>

        {/* Total Progress */}
        <div className="pb-2 border-b border-gray-200">
             <div className="flex justify-between mb-1 items-baseline">
                <span className="font-bold text-lg text-gray-900">總學分 (Total)</span>
                <div>
                    <span className="font-bold text-lg text-ntu-red">{totals.total.earned}</span>
                    {totals.total.projected > 0 && (
                        <span className="text-blue-600 text-sm font-bold ml-1">+{totals.total.projected}</span>
                    )}
                    <span className="text-gray-400 text-sm ml-1">/ {requirements.total}</span>
                </div>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
                <div 
                    className="h-full bg-blue-700" 
                    style={{ width: `${Math.min((totals.total.earned / requirements.total) * 100, 100)}%` }}
                ></div>
                <div 
                    className="h-full bg-blue-400 opacity-70" 
                    style={{ width: `${Math.min((totals.total.projected / requirements.total) * 100, 100)}%` }}
                ></div>
            </div>
        </div>

        {/* Specific Categories */}
        <div className="space-y-1">
            {renderProgressBar('共同必修 (Common Required)', totals.commonRequired.earned, totals.commonRequired.projected, requirements.commonRequired, 'bg-teal-700', 'bg-teal-400')}
            {renderProgressBar('系訂必修 (Dept Required)', totals.deptRequired.earned, totals.deptRequired.projected, requirements.deptRequired, 'bg-ntu-red', 'bg-red-400')}
            {renderProgressBar('指定選修 (Designated Elective)', totals.designatedElective.earned, totals.designatedElective.projected, requirements.designatedElective, 'bg-purple-700', 'bg-purple-400')}
            {renderProgressBar('一般選修 (General Elective)', totals.generalElective.earned, totals.generalElective.projected, requirements.generalElective, 'bg-indigo-700', 'bg-indigo-400')}
            {renderProgressBar('通識 (General Education)', totals.generalEducation.earned, totals.generalEducation.projected, requirements.generalEducation, 'bg-orange-600', 'bg-orange-300')}
        </div>

        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>
                深色為已修得學分，<span className="text-blue-600 font-bold">淺色/藍字</span>為本學期修習中(預估)。
                預估 GPA 包含本學期課程之預期成績。
            </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;