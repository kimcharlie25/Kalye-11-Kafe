import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface MobileNavProps {
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onCategoryClick }) => {
  const { categories } = useCategories();

  return (
    <div className="sticky top-16 z-40 bg-white border-b border-black md:hidden">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-5 py-2.5 transition-all duration-200 font-sans uppercase text-[10px] tracking-widest border border-black ${activeCategory === category.id
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
              }`}
          >
            <span>{category.icon}</span>
            <span className="font-bold whitespace-nowrap">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;