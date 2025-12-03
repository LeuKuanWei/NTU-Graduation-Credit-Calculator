import React from 'react';
import { GraduationCap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-ntu-red text-white shadow-md border-b-4 border-yellow-600">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-full">
             <GraduationCap className="w-8 h-8 text-ntu-red" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-wide">
              畢業學分試算 (會計系111學年度)
            </h1>
            <p className="text-xs md:text-sm text-gray-200 font-sans tracking-wider">
              Department of Accounting, NTU - Graduation Credit Calculator (2022 Entry)
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right text-xs text-gray-300">
           適用: 111學年度入學生 <br/>
           User Mode: Guest
        </div>
      </div>
    </header>
  );
};

export default Header;