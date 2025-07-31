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

/**
 * Convert raw option data to processed OptionData with all calculations
 */
function processOptionData(
  rawOption: RawOptionData, 
  stockPrice: number, 
  ticker: string
): OptionData {
  const timeToExpiration = calculateTimeToExpiration(rawOption.expiration);
  
  // Calculate Black-Scholes theoretical price
  const bsResult = blackScholes(
    stockPrice,
    rawOption.strike,
    timeToExpiration,
    RISK_FREE_RATE,
    rawOption.impliedVolatility
  );
  
  const theoreticalPrice = rawOption.optionType === 'call' 
    ? bsResult.callPrice 
    : bsResult.putPrice;
  
  // Calculate Greeks
  const greeks = calculateGreeks(
    stockPrice,
    rawOption.strike,
    timeToExpiration,
    RISK_FREE_RATE,
    rawOption.impliedVolatility,
    rawOption.optionType
  );
  
  // Calculate edge
  const edge = calculateEdge(rawOption.lastPrice, theoreticalPrice);
  
  // Calculate additional metrics
  const moneyness = calculateMoneyness(stockPrice, rawOption.strike);
  const bidAskSpread = rawOption.ask - rawOption.bid;
  const bidAskSpreadPercent = calculateSpreadPercent(rawOption.bid, rawOption.ask);
  
  // Strategy analysis
  const strategyType = rawOption.optionType === 'call' ? 'covered-call' : 'cash-secured-put';
  const breakevenPrice = rawOption.optionType === 'call' 
    ? rawOption.strike + rawOption.lastPrice 
    : rawOption.strike - rawOption.lastPrice;
  const maxProfit = rawOption.lastPrice * 100; // Premium collected
  const collateralRequired = rawOption.optionType === 'call' 
    ? stockPrice * 100 // 100 shares
    : rawOption.strike * 100; // Cash for put
  
  // Annualized return calculation
  const daysToExpiration = timeToExpiration * 365;
  const annualizedReturn = daysToExpiration > 0 
    ? (maxProfit / collateralRequired) * (365 / daysToExpiration) * 100
    : 0;
  
  const assignmentProbability = calculateAssignmentProbability(greeks.delta, rawOption.optionType);
  
  // Data quality checks
  const hasLiquidityWarn = hasLiquidityWarning(rawOption.volume, rawOption.openInterest);
  const hasSpreadWarn = hasSpreadWarning(bidAskSpreadPercent);
  const dataAge = Math.random() * 5; // Mock data age in minutes
  const hasStaleDataWarn = dataAge > 15;
  
  return {
    symbol: rawOption.contractSymbol,
    ticker,
    strike: rawOption.strike,
    expiration: rawOption.expiration,
    optionType: rawOption.optionType,
    lastPrice: rawOption.lastPrice,
    bid: rawOption.bid,
    ask: rawOption.ask,
    volume: rawOption.volume,
    openInterest: rawOption.openInterest,
    stockPrice,
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
    bidAskSpread,
    bidAskSpreadPercent,
    strategyType,
    breakevenPrice,
    maxProfit,
    collateralRequired,
    annualizedReturn,
    assignmentProbability,
    d1: bsResult.d1,
    d2: bsResult.d2,
    nd1: bsResult.nd1,
    nd2: bsResult.nd2,
    priceSource: 'last',
    dataAge,
    hasLiquidityWarning: hasLiquidityWarn,
    hasSpreadWarning: hasSpreadWarn,
    hasStaleDataWarning: hasStaleDataWarn
  };
}

/**
 * Search for options opportunities across multiple symbols
 */
export async function searchOptionsData(
  symbols: string[], 
  options: SearchOptions
): Promise<OptionData[]> {
  const allOpportunities: OptionData[] = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    // Update progress
    if (options.onProgress) {
      options.onProgress(i, symbols.length, symbol);
    }
    
    try {
      // Fetch options for this symbol
      const response = await fetch(`/api/options?symbols=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch options for ${symbol}: ${response.statusText}`);
      }
      
      const results = await response.json();
      
      if (results.length > 0) {
        const symbolData = results[0]; // First result for single symbol
        const symbolOptions = symbolData.options.map((option: RawOptionData) => 
          processOptionData(option, symbolData.price, symbolData.symbol)
        );
        
        // Filter based on criteria
        const filteredOptions = symbolOptions.filter((option: OptionData) => {
          return (
            option.edge >= options.minEdge &&
            option.volume >= options.minVolume &&
            option.lastPrice >= options.minPrice
          );
        });
        
        allOpportunities.push(...filteredOptions);
      }
      
      // Add delay to simulate real API behavior
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      // Continue with other symbols
    }
  }
  
  // Final progress update
  if (options.onProgress) {
    options.onProgress(symbols.length, symbols.length, 'Complete');
  }
  
  // Sort by edge percentage (highest first)
  return allOpportunities.sort((a, b) => b.edge - a.edge);
}

/**
 * Real implementation would use actual options data API
 * Example with Yahoo Finance or Alpha Vantage:
 */
/*
async function fetchRealOptionsData(symbol: string): Promise<RawOptionData[]> {
  const response = await fetch(`/api/options/${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch options for ${symbol}`);
  }
  return response.json();
}
*/
