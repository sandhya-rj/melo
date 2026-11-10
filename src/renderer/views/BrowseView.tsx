import React from 'react';
import { Sparkles, Music2, Radio, Disc, Mic2, Flame, Heart, Headphones } from 'lucide-react';
import { BROWSE_CATEGORIES, BrowseCategory } from './mockCatalog';

export interface BrowseViewProps {
  onSelectCategory: (category: BrowseCategory) => void;
  onNavigate: (view: string) => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  onSelectCategory,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Browse all</h1>
        <p className="text-sm text-[#b3b3b3] mt-1">Explore by genre, mood, and curated collections</p>
      </div>

      {/* Grid of Encore Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {BROWSE_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className="h-44 rounded-lg p-4 relative overflow-hidden cursor-pointer select-none group transition-transform duration-200 hover:scale-104 shadow-md"
            style={{ backgroundColor: cat.color }}
          >
            {/* Category Title */}
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight break-words max-w-[80%] z-10 relative">
              {cat.title}
            </h2>

            {/* Rotated Diagonal Card Artwork (Spotify 25-degree rotated thumbnail) */}
            <div className="absolute -bottom-2 -right-4 w-24 h-24 md:w-28 md:h-28 rounded-md shadow-2xl rotate-[25deg] overflow-hidden group-hover:rotate-[28deg] group-hover:scale-105 transition-all duration-300">
              <img
                src={cat.coverUrl}
                alt={cat.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};
