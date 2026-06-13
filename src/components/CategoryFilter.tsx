const categories = [
  "Alles",
  "Eten & drinken",
  "Koffie, lunch & zoet",
  "Winkels & makers",
  "Mode & sieraden",
  "Interieur & kunst",
  "Beauty & verzorging",
  "Services & praktisch",
  "Slapen"
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 max-w-2xl">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
            selected === category
              ? "bg-amber border-amber text-white shadow-md"
              : "bg-white border-stone/30 text-deep-green hover:border-amber hover:text-amber"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
