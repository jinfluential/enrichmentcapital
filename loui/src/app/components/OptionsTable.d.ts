import React from 'react';
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

declare const OptionsTable: React.FC<OptionsTableProps>;
export default OptionsTable;
