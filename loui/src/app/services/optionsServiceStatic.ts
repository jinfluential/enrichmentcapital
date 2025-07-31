import { OptionData, SearchOptions, RawOptionData } from '../types/options';
import { 
  blackScholes, 
  calculateGreeks, 
  calculateEdge, 
  calculateTimeToExpiration,
  calculateMoneyness,
  calculateSpreadPercent,
  hasLiquidityWarning,
  hasSpreadWarning,
  calculateAssignmentProbability
} from '../utils/blackScholes';

const RISK_FREE_RATE = 0.045; // 4.5%

// Helper functions for strategy classification
function getStrategyType(optionType: 'call' | 'put', moneyness: number): 'covered-call' | 'cash-secured-put' | 'speculative' {
  if (optionType === 'call' && moneyness < 0) {
    return 'covered-call';
  } else if (optionType === 'put' && moneyness > 0) {
    return 'cash-secured-put';
  }
  return 'speculative';
}

function calculateAnnualReturn(edge: number, timeToExpiration: number): number {
  if (timeToExpiration <= 0) return 0;
  return (edge / 100) * (365 / (timeToExpiration * 365));
}

// Mock options data for static deployment
const MOCK_OPTIONS_DATA: Record<string, {
  symbol: string;
  price: number;
  options: Array<{
    contractSymbol: string;
    strike: number;
    expiration: string;
    optionType: 'call' | 'put';
    lastPrice: number;
    bid: number;
    ask: number;
    volume: number;
    openInterest: number;
    impliedVolatility: number;
  }>;
}> = {
  'AAPL': {
    symbol: 'AAPL',
    price: 185.50,
    options: [
      {
        contractSymbol: 'AAPL240816C00180000',
        strike: 180,
        expiration: '2025-08-16',
        optionType: 'call',
        lastPrice: 8.45,
        bid: 8.20,
        ask: 8.70,
        volume: 1250,
        openInterest: 5420,
        impliedVolatility: 0.28
      },
      {
        contractSymbol: 'AAPL240816P00190000',
        strike: 190,
        expiration: '2025-08-16',
        optionType: 'put',
        lastPrice: 6.25,
        bid: 6.00,
        ask: 6.50,
        volume: 890,
        openInterest: 3210,
        impliedVolatility: 0.30
      }
    ]
  },
  'MSFT': {
    symbol: 'MSFT',
    price: 415.20,
    options: [
      {
        contractSymbol: 'MSFT240816C00410000',
        strike: 410,
        expiration: '2025-08-16',
        optionType: 'call',
        lastPrice: 12.35,
        bid: 12.00,
        ask: 12.70,
        volume: 750,
        openInterest: 2890,
        impliedVolatility: 0.25
      }
    ]
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 118.75,
    options: [
      {
        contractSymbol: 'NVDA240816C00115000',
        strike: 115,
        expiration: '2025-08-16',
        optionType: 'call',
        lastPrice: 6.80,
        bid: 6.60,
        ask: 7.00,
        volume: 2100,
        openInterest: 8750,
        impliedVolatility: 0.35
      }
    ]
  }
};

/**
 * Convert raw option data to processed OptionData with all calculations
 */
function processOptionData(
  rawOption: RawOptionData, 
  stockPrice: number, 
  symbol: string
): OptionData {
  const timeToExpiration = calculateTimeToExpiration(rawOption.expiration);
  const moneyness = calculateMoneyness(stockPrice, rawOption.strike);
  
  // Calculate theoretical price using Black-Scholes
  const bsResult = blackScholes(
    stockPrice,
    rawOption.strike,
    timeToExpiration,
    RISK_FREE_RATE,
    rawOption.impliedVolatility
  );
  
  const theoreticalPrice = rawOption.optionType === 'call' ? bsResult.callPrice : bsResult.putPrice;
  
  // Calculate Greeks
  const greeks = calculateGreeks(
    stockPrice,
    rawOption.strike,
    timeToExpiration,
    RISK_FREE_RATE,
    rawOption.impliedVolatility,
    rawOption.optionType
  );
  
  // Calculate edge (mispricing opportunity)
  const edge = calculateEdge(rawOption.lastPrice, theoreticalPrice);
  
  // Calculate spread percentage
  const spreadPercent = calculateSpreadPercent(rawOption.bid, rawOption.ask);
  
  // Calculate assignment probability using the utility function
  const assignmentProbability = calculateAssignmentProbability(greeks.delta, rawOption.optionType);
  
  // Get strategy type
  const strategyType = getStrategyType(rawOption.optionType, moneyness) as 'covered-call' | 'cash-secured-put';
  
  // Calculate annual return
  const annualReturn = calculateAnnualReturn(edge, timeToExpiration);
  
  return {
    symbol,
    ticker: rawOption.contractSymbol,
    optionType: rawOption.optionType,
    strike: rawOption.strike,
    expiration: rawOption.expiration,
    stockPrice,
    lastPrice: rawOption.lastPrice,
    bid: rawOption.bid,
    ask: rawOption.ask,
    volume: rawOption.volume,
    openInterest: rawOption.openInterest,
    timeToExpiration,
    riskFreeRate: RISK_FREE_RATE,
    impliedVolatility: rawOption.impliedVolatility,
    theoreticalPrice,
    edge,
    delta: greeks.delta,
    gamma: greeks.gamma,
    theta: greeks.theta,
    vega: greeks.vega,
    rho: greeks.rho,
    moneyness,
    bidAskSpread: rawOption.ask - rawOption.bid,
    bidAskSpreadPercent: spreadPercent,
    strategyType,
    breakevenPrice: rawOption.optionType === 'call' ? rawOption.strike + rawOption.lastPrice : rawOption.strike - rawOption.lastPrice,
    maxProfit: rawOption.optionType === 'call' ? Infinity : rawOption.strike - rawOption.lastPrice,
    collateralRequired: rawOption.optionType === 'call' ? stockPrice * 100 : rawOption.strike * 100,
    annualizedReturn: annualReturn,
    assignmentProbability,
    d1: bsResult.d1,
    d2: bsResult.d2,
    nd1: bsResult.nd1,
    nd2: bsResult.nd2,
    priceSource: 'last' as const,
    dataAge: 0,
    hasLiquidityWarning: hasLiquidityWarning(rawOption.volume, rawOption.openInterest),
    hasSpreadWarning: hasSpreadWarning(spreadPercent),
    hasStaleDataWarning: false
  };
}

/**
 * Search for options opportunities across multiple symbols
 */
export async function searchOptionsData(
  symbols: string[],
  options: SearchOptions
): Promise<OptionData[]> {
  const { onProgress, minEdge = 5, minVolume = 1, minPrice = 0.10 } = options;
  
  const allOpportunities: OptionData[] = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    // Report progress
    if (onProgress) {
      onProgress(i, symbols.length, symbol);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Get mock data for symbol
    const symbolData = MOCK_OPTIONS_DATA[symbol];
    if (!symbolData) {
      continue; // Skip unknown symbols
    }
    
    // Process each option for this symbol
    const symbolOptions = symbolData.options.map((option: RawOptionData) => 
      processOptionData(option, symbolData.price, symbolData.symbol)
    );
    
    // Filter based on criteria
    const filteredOptions = symbolOptions.filter((option: OptionData) => {
      return (
        option.edge >= minEdge &&
        option.volume >= minVolume &&
        option.lastPrice >= minPrice
      );
    });
    
    allOpportunities.push(...filteredOptions);
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(symbols.length, symbols.length, '');
  }
  
  // Sort by edge (best opportunities first)
  return allOpportunities.sort((a, b) => b.edge - a.edge);
}
