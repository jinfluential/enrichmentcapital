'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  AlertTriangle,
  Volume2,
  Calculator,
  Activity
} from 'lucide-react';
import { OptionData } from '../types/options';

interface OptionsTableProps {
  opportunities: OptionData[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  minEdge: number;
  optionTypeFilter: 'all' | 'calls' | 'puts';
  strategyFilter: 'all' | 'covered-calls' | 'cash-secured-puts';
  isLoading: boolean;
}

export default function OptionsTable({ 
  opportunities, 
  sortBy, 
  setSortBy, 
  minEdge,
  optionTypeFilter,
  strategyFilter,
  isLoading 
}: OptionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sortedOpportunities = useMemo(() => {
    let filtered = opportunities.filter(opt => opt.edge >= minEdge);
    
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
    
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'edge':
          return b.edge - a.edge;
        case 'volume':
          return b.volume - a.volume;
        case 'premium':
          return b.lastPrice - a.lastPrice;
        case 'expiration':
          return new Date(a.expiration).getTime() - new Date(b.expiration).getTime();
        case 'ticker':
          return a.ticker.localeCompare(b.ticker);
        case 'calls':
          // Sort calls first, then by edge
          if (a.optionType !== b.optionType) {
            return a.optionType === 'call' ? -1 : 1;
          }
          return b.edge - a.edge;
        case 'puts':
          // Sort puts first, then by edge
          if (a.optionType !== b.optionType) {
            return a.optionType === 'put' ? -1 : 1;
          }
          return b.edge - a.edge;
        case 'covered-calls':
          // Sort covered call opportunities first, then by edge
          if (a.strategyType !== b.strategyType) {
            return a.strategyType === 'covered-call' ? -1 : 1;
          }
          return b.edge - a.edge;
        case 'cash-secured-puts':
          // Sort cash-secured put opportunities first, then by edge
          if (a.strategyType !== b.strategyType) {
            return a.strategyType === 'cash-secured-put' ? -1 : 1;
          }
          return b.edge - a.edge;
        case 'annual-return':
          return b.annualizedReturn - a.annualizedReturn;
        case 'delta':
          return Math.abs(b.delta) - Math.abs(a.delta);
        default:
          return b.edge - a.edge;
      }
    });
  }, [opportunities, sortBy, minEdge, optionTypeFilter, strategyFilter]);

  const handleSort = (column: string) => {
    setSortBy(column);
  };

  const toggleExpanded = (symbol: string) => {
    setExpandedRow(expandedRow === symbol ? null : symbol);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getEdgeColor = (edge: number) => {
    if (edge >= 15) return 'text-green-400';
    if (edge >= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVolumeColor = (volume: number) => {
    if (volume >= 100) return 'text-green-400';
    if (volume >= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLiquidityStatus = (option: OptionData) => {
    if (option.hasLiquidityWarning) return 'red';
    if (option.volume >= 100 && option.openInterest >= 500) return 'green';
    return 'yellow';
  };

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === column && (
          <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Analyzing options data...</p>
      </div>
    );
  }

  if (sortedOpportunities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Opportunities Found</h3>
        <p className="text-gray-400">
          No options meet your criteria (minimum {minEdge}% edge). Try:
        </p>
        <ul className="text-gray-400 mt-2 space-y-1">
          <li>• Lowering the minimum edge threshold</li>
          <li>• Searching different symbols</li>
          <li>• Checking market hours</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="w-8 px-4 py-3"></th>
              <SortHeader column="ticker">Symbol</SortHeader>
              <SortHeader column="edge">Edge</SortHeader>
              <SortHeader column="premium">Premium</SortHeader>
              <SortHeader column="volume">Volume</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Delta
              </th>
              <SortHeader column="expiration">Expiration</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Strategy
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Annual Return
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Liquidity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedOpportunities.map((option) => (
              <React.Fragment key={option.symbol}>
                <tr 
                  className={`hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    option.optionType === 'call' 
                      ? 'border-l-2 border-l-green-500/50' 
                      : 'border-l-2 border-l-red-500/50'
                  }`}
                  onClick={() => toggleExpanded(option.symbol)}
                >
                  <td className="px-4 py-3">
                    {expandedRow === option.symbol ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{option.ticker}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        option.optionType === 'call' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {option.optionType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      <div className="flex items-center space-x-2">
                        <span>Strike: <span className="font-medium">${option.strike}</span></span>
                        <span>•</span>
                        <span>Stock: <span className="font-medium">${option.stockPrice}</span></span>
                      </div>
                      <div className={`text-xs mt-1 ${
                        option.moneyness > 0 
                          ? 'text-red-400' 
                          : option.moneyness < -5 
                            ? 'text-green-400' 
                            : 'text-yellow-400'
                      }`}>
                        {option.moneyness > 0 ? 'OTM' : 'ITM'} by {Math.abs(option.moneyness).toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <span className={`font-bold ${getEdgeColor(option.edge)}`}>
                        {formatPercent(option.edge)}
                      </span>
                      {option.edge >= 15 && <TrendingUp className="h-3 w-3 text-green-400" />}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-white font-medium">{formatCurrency(option.lastPrice)}</div>
                      <div className="text-xs text-gray-400">
                        Bid: {formatCurrency(option.bid)} | Ask: {formatCurrency(option.ask)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <Volume2 className="h-3 w-3 text-gray-400" />
                      <span className={`font-medium ${getVolumeColor(option.volume)}`}>
                        {option.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      OI: {option.openInterest.toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">
                      {option.delta.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {option.delta > 0.5 ? 'High' : option.delta > 0.3 ? 'Moderate' : 'Low'} sensitivity
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-white">
                      {new Date(option.expiration).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(option.timeToExpiration * 365)} days
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-white text-sm">
                      {option.strategyType === 'covered-call' ? 'Covered Call' : 'Cash-Secured Put'}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-green-400 font-medium">
                      {formatPercent(option.annualizedReturn)}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className={`w-3 h-3 rounded-full ${
                      getLiquidityStatus(option) === 'green' ? 'bg-green-400' :
                      getLiquidityStatus(option) === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} title="Liquidity Status" />
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedRow === option.symbol && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 bg-gray-900/50">
                      <ExpandedOptionDetails option={option} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandedOptionDetails({ option }: { option: OptionData }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Black-Scholes Calculation */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-green-400" />
          Black-Scholes Breakdown
        </h4>
        
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="text-sm text-gray-300">
            <div className="font-medium text-white mb-2">Inputs:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>S (Stock Price): <span className="text-green-400">${option.stockPrice}</span></div>
              <div>K (Strike): <span className="text-green-400">${option.strike}</span></div>
              <div>T (Time): <span className="text-green-400">{option.timeToExpiration.toFixed(4)} years</span></div>
              <div>r (Risk-free): <span className="text-green-400">{(option.riskFreeRate * 100).toFixed(1)}%</span></div>
              <div>σ (Volatility): <span className="text-green-400">{(option.impliedVolatility * 100).toFixed(1)}%</span></div>
            </div>
          </div>
          
          <div className="text-sm text-gray-300">
            <div className="font-medium text-white mb-2">Intermediate Calculations:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>d1: <span className="text-blue-400">{option.d1.toFixed(4)}</span></div>
              <div>d2: <span className="text-blue-400">{option.d2.toFixed(4)}</span></div>
              <div>N(d1): <span className="text-blue-400">{option.nd1.toFixed(4)}</span></div>
              <div>N(d2): <span className="text-blue-400">{option.nd2.toFixed(4)}</span></div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium">Theoretical Price:</div>
                <div className="text-green-400 text-lg font-bold">
                  {formatCurrency(option.theoreticalPrice)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">Market Price:</div>
                <div className="text-white text-lg font-bold">
                  {formatCurrency(option.lastPrice)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-sm text-gray-400">Edge</div>
              <div className={`text-xl font-bold ${
                option.edge > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {option.edge.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Greeks and Strategy Analysis */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-400" />
          Greeks & Strategy
        </h4>
        
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Delta</div>
              <div className="text-white font-medium">{option.delta.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Gamma</div>
              <div className="text-white font-medium">{option.gamma.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400">Theta (per day)</div>
              <div className="text-red-400 font-medium">{formatCurrency(option.theta)}</div>
            </div>
            <div>
              <div className="text-gray-400">Vega (per 1%)</div>
              <div className="text-white font-medium">{formatCurrency(option.vega)}</div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Breakeven Price:</span>
              <span className="text-white font-medium">{formatCurrency(option.breakevenPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Profit:</span>
              <span className="text-green-400 font-medium">{formatCurrency(option.maxProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Collateral Required:</span>
              <span className="text-white font-medium">{formatCurrency(option.collateralRequired)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Assignment Probability:</span>
              <span className="text-yellow-400 font-medium">{option.assignmentProbability.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        {/* Warnings */}
        {(option.hasLiquidityWarning || option.hasSpreadWarning || option.hasStaleDataWarning) && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3">
            <div className="flex items-center text-yellow-400 text-sm mb-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warnings
            </div>
            <div className="space-y-1 text-xs text-yellow-300">
              {option.hasLiquidityWarning && <div>• Low liquidity (volume &lt; 1 or OI &lt; 10)</div>}
              {option.hasSpreadWarning && <div>• Wide bid-ask spread (&gt; 10%)</div>}
              {option.hasStaleDataWarning && <div>• Stale data (&gt; 15 minutes old)</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
