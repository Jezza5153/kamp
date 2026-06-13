interface BusinessSearchProps {
  query: string;
  onSearch: (query: string) => void;
}

const BusinessSearch = ({ query, onSearch }: BusinessSearchProps) => {
  return (
    <div className="relative w-full md:max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Zoek ondernemer, product of straat..."
        className="block w-full pl-11 pr-4 py-3 border border-stone/30 rounded-full bg-white text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-all"
      />
      {query && (
        <button 
          onClick={() => onSearch("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone hover:text-amber"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default BusinessSearch;
