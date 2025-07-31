'use client';

import React, { useState, useRef } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { parseSymbols, formatSymbolsForDisplay } from '../utils/symbolParser';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchHistory: string[];
  isLoading: boolean;
}

export default function SearchBar({ onSearch, searchHistory, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setShowHistory(false);
    onSearch(historyItem);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow history clicks
    setTimeout(() => setShowHistory(false), 200);
  };

  const parsedSymbols = parseSymbols(query);
  const isValidInput = parsedSymbols.length > 0;

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter symbols (e.g., AAPL, MSFT or AAPL MSFT)"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            {/* Symbol preview */}
            {query && (
              <div className="mt-2 text-sm">
                {isValidInput ? (
                  <span className="text-green-400">
                    ✓ Will search: {formatSymbolsForDisplay(parsedSymbols)}
                  </span>
                ) : (
                  <span className="text-red-400">
                    ✗ Enter valid symbols (1-5 letters each)
                  </span>
                )}
              </div>
            )}

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Recent searches
                  </div>
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHistoryClick(item)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded flex items-center"
                    >
                      <TrendingUp className="h-3 w-3 mr-2 text-gray-400" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValidInput || isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Quick search buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Quick search:</span>
          {['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL'].map(symbol => (
            <button
              key={symbol}
              type="button"
              onClick={() => handleHistoryClick(symbol)}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {symbol}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleHistoryClick('AAPL, MSFT, NVDA')}
            disabled={isLoading}
            className="px-3 py-1 text-xs bg-gray-700 text-blue-300 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Tech Bundle
          </button>
        </div>
      </form>
    </div>
  );
}
