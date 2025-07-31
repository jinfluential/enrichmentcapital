'use client';

import React, { useState, useCallback } from 'react';
import { TrendingUp, Calculator, Activity, Clock, AlertTriangle } from 'lucide-react';
import SearchBar from './SearchBar';
import OptionsTable from './OptionsTable';
import ConnectionStatus from './ConnectionStatus';
import ProgressBar from './ProgressBar';
import { SearchResults } from '../types/options';
import { parseSymbols } from '../utils/symbolParser';
import { searchOptionsData } from '../services/optionsService';

export default function OptionsAnalytics() {
  const [searchResults, setSearchResults] = useState<SearchResults>({
    opportunities: [],
    isLoading: false,
    currentSymbol: '',
    progress: 0,
    error: null
  });

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('edge');
  const [minEdge, setMinEdge] = useState<number>(5);
  const [optionTypeFilter, setOptionTypeFilter] = useState<'all' | 'calls' | 'puts'>('all');
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'covered-calls' | 'cash-secured-puts'>('all');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const symbols = parseSymbols(query);
    
    // Add to search history
    setSearchHistory(prev => [query, ...prev.filter(item => item !== query)].slice(0, 5));

    setSearchResults({
      opportunities: [],
      isLoading: true,
      currentSymbol: '',
      progress: 0,
      error: null
    });

    try {
      const results = await searchOptionsData(symbols, {
        onProgress: (current, total, symbol) => {
          setSearchResults(prev => ({
            ...prev,
            progress: (current / total) * 100,
            currentSymbol: symbol
          }));
        },
        minEdge,
        minVolume: 1,
        minPrice: 0.10
      });

      setSearchResults({
        opportunities: results,
        isLoading: false,
        currentSymbol: '',
        progress: 100,
        error: null
      });

      setConnectionStatus('connected');
    } catch (error) {
      setSearchResults(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }));
      setConnectionStatus('error');
    }
  }, [minEdge]);

  const getFilteredOpportunities = () => {
    let filtered = searchResults.opportunities.filter(opt => opt.edge >= minEdge);
    
    // Apply option type filter
    if (optionTypeFilter === 'calls') {
      filtered = filtered.filter(opt => opt.optionType === 'call');
    } else if (optionTypeFilter === 'puts') {
      filtered = filtered.filter(opt => opt.optionType === 'put');
    }
    
    // Apply strategy filter
    if (strategyFilter === 'covered-calls') {
      filtered = filtered.filter(opt => opt.strategyType === 'covered-call');
    } else if (strategyFilter === 'cash-secured-puts') {
      filtered = filtered.filter(opt => opt.strategyType === 'cash-secured-put');
    }
    
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <h1 className="text-2xl font-bold text-white">Enrichment Capital</h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                <Calculator className="h-4 w-4" />
                <span>Black-Scholes Engine</span>
              </div>
            </div>
            <ConnectionStatus status={connectionStatus} />
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <SearchBar 
            onSearch={handleSearch}
            searchHistory={searchHistory}
            isLoading={searchResults.isLoading}
          />
          
          {/* Search Progress */}
          {searchResults.isLoading && (
            <ProgressBar 
              progress={searchResults.progress}
              currentSymbol={searchResults.currentSymbol}
            />
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Min Edge:</label>
              <select 
                value={minEdge}
                onChange={(e) => setMinEdge(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value={5}>5%</option>
                <option value={10}>10%</option>
                <option value={15}>15%</option>
                <option value={20}>20%</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <optgroup label="Best Opportunities">
                  <option value="edge">Best Edge %</option>
                  <option value="annual-return">Highest Annual Return</option>
                </optgroup>
                <optgroup label="Option Type">
                  <option value="calls">Calls First</option>
                  <option value="puts">Puts First</option>
                </optgroup>
                <optgroup label="Strategies">
                  <option value="covered-calls">Covered Calls</option>
                  <option value="cash-secured-puts">Cash-Secured Puts</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="volume">Volume</option>
                  <option value="premium">Premium</option>
                  <option value="delta">Delta</option>
                  <option value="expiration">Expiration</option>
                  <option value="ticker">Symbol</option>
                </optgroup>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Filter Type:</label>
              <select 
                value={optionTypeFilter}
                onChange={(e) => setOptionTypeFilter(e.target.value as 'all' | 'calls' | 'puts')}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Options</option>
                <option value="calls">Calls Only</option>
                <option value="puts">Puts Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Strategy:</label>
              <select 
                value={strategyFilter}
                onChange={(e) => setStrategyFilter(e.target.value as 'all' | 'covered-calls' | 'cash-secured-puts')}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Strategies</option>
                <option value="covered-calls">Covered Calls</option>
                <option value="cash-secured-puts">Cash-Secured Puts</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Activity className="h-4 w-4" />
              <span>Risk-free rate: 4.5%</span>
            </div>

            {/* Active Filters Display */}
            {(optionTypeFilter !== 'all' || strategyFilter !== 'all') && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Active filters:</span>
                {optionTypeFilter !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded">
                    {optionTypeFilter === 'calls' ? 'Calls Only' : 'Puts Only'}
                  </span>
                )}
                {strategyFilter !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded">
                    {strategyFilter === 'covered-calls' ? 'Covered Calls' : 'Cash-Secured Puts'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setOptionTypeFilter('all');
                    setStrategyFilter('all');
                  }}
                  className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {searchResults.opportunities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Opportunities</p>
                  <p className="text-2xl font-bold text-green-400">
                    {getFilteredOpportunities().length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Best Edge</p>
                  <p className="text-2xl font-bold text-green-400">
                    {getFilteredOpportunities().length > 0 
                      ? Math.max(...getFilteredOpportunities().map(opt => opt.edge)).toFixed(1)
                      : '0.0'
                    }%
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Volume</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {getFilteredOpportunities().length > 0
                      ? Math.round(getFilteredOpportunities().reduce((sum, opt) => sum + opt.volume, 0) / getFilteredOpportunities().length)
                      : 0
                    }
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {searchResults.error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{searchResults.error}</span>
          </div>
        )}

        {/* Results Table */}
        <OptionsTable 
          opportunities={searchResults.opportunities}
          sortBy={sortBy}
          setSortBy={setSortBy}
          minEdge={minEdge}
          optionTypeFilter={optionTypeFilter}
          strategyFilter={strategyFilter}
          isLoading={searchResults.isLoading}
        />

        {/* Market Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Market Status: {new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Open' : 'Closed'}</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
