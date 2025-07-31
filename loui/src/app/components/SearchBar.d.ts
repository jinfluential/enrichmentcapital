import React from 'react';

interface SearchBarProps {
  onSearch: (symbols: string[]) => void;
  searchHistory: string[];
  isLoading: boolean;
}

declare const SearchBar: React.FC<SearchBarProps>;
export default SearchBar;
