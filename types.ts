export type CourseCategory = '共同必修' | '系訂必修' | '指定選修' | '一般選修' | '通識' | '體育' | '其他';

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'F' | 'Pass';

export interface Course {
  id: string;
  semester: string; // e.g., "112-1"
  name: string;
  credits: number;
  category: CourseCategory;
  grade: Grade;
  isCurrent?: boolean; // New field for "In Progress" courses
}

export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.3,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'F': 0,
  'Pass': -1, // Special handling
};

export interface GraduationRequirements {
  total: number;
  commonRequired: number;     // 共同必修 (9)
  deptRequired: number;       // 系訂必修 (69)
  designatedElective: number; // 指定選修 (21)
  generalElective: number;    // 一般選修 (19)
  generalEducation: number;   // 通識 (15)
}