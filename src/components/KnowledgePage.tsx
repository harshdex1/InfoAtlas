import React from "react";
import { Compass, Atom, Cpu, Landmark, Globe, Calculator, Rocket, HeartPulse, Leaf, Briefcase, GraduationCap, Palette } from "lucide-react";

interface KnowledgePageProps {
  onSearchSubmit: (query: string) => void;
  isDark: boolean;
}

const KNOWLEDGE_CATEGORIES = [
  { name: "Science", icon: Atom, query: "Scientific method", desc: "Physics, chemistry, and biological research", color: "from-cyan-500 to-blue-600" },
  { name: "Technology", icon: Cpu, query: "Emerging technologies", desc: "Computing, artificial intelligence, and engineering", color: "from-indigo-500 to-violet-600" },
  { name: "History", icon: Landmark, query: "World history", desc: "Ancient civilizations and global historical milestones", color: "from-amber-500 to-orange-600" },
  { name: "Geography", icon: Globe, query: "Geography of Earth", desc: "Continents, oceans, nations, and earth systems", color: "from-emerald-500 to-teal-600" },
  { name: "Mathematics", icon: Calculator, query: "Mathematics", desc: "Algebra, geometry, calculus, and number theory", color: "from-blue-600 to-indigo-700" },
  { name: "Space & Astronomy", icon: Rocket, query: "Astronomy and space exploration", desc: "Cosmology, stars, galaxies, and space missions", color: "from-purple-600 to-indigo-900" },
  { name: "Health & Medicine", icon: HeartPulse, query: "Human medicine", desc: "Anatomy, clinical science, and wellness", color: "from-rose-500 to-pink-600" },
  { name: "Nature & Environment", icon: Leaf, query: "Environmental science", desc: "Ecosystems, climate science, and biodiversity", color: "from-teal-500 to-emerald-700" },
  { name: "Business & Economics", icon: Briefcase, query: "Economics", desc: "Markets, finance, and global trade", color: "from-amber-600 to-yellow-600" },
  { name: "Education", icon: GraduationCap, query: "Education", desc: "Pedagogy, universities, and learning systems", color: "from-blue-500 to-indigo-500" },
  { name: "Arts & Culture", icon: Palette, query: "Art history", desc: "Literature, music, visual arts, and culture", color: "from-pink-500 to-rose-600" },
];

export const KnowledgePage: React.FC<KnowledgePageProps> = ({ onSearchSubmit, isDark }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#386BFF] to-[#7252FF] text-white flex items-center justify-center shadow-lg">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-[#102B59]"}`}>
            Knowledge Encyclopedia
          </h1>
          <p className="text-xs text-[#60769A]">Explore authoritative encyclopedia articles powered by Wikimedia & Wikidata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KNOWLEDGE_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <button
              key={idx}
              onClick={() => onSearchSubmit(cat.query)}
              className={`p-6 rounded-3xl border text-left transition-all group flex flex-col justify-between h-48 cursor-pointer ${
                isDark
                  ? "bg-slate-900/50 border-slate-800 hover:border-[#386BFF]/50 hover:bg-slate-900"
                  : "bg-white border-[#E0E9FA] hover:border-[#386BFF]/50 hover:shadow-lg"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold mb-1 ${isDark ? "text-white" : "text-[#102B59]"} group-hover:text-[#386BFF] transition-colors`}>
                  {cat.name}
                </h3>
                <p className="text-xs text-[#60769A] line-clamp-2">{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
