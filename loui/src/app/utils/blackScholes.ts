/**
 * Calculate the cumulative standard normal distribution
 * Approximation using Abramowitz and Stegun method
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Black-Scholes formula for European options
 */
export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  d1: number;
  d2: number;
  nd1: number;
  nd2: number;
  nMinusD1: number;
  nMinusD2: number;
}

export function blackScholes(
  S: number,  // Current stock price
  K: number,  // Strike price
  T: number,  // Time to expiration (years)
  r: number,  // Risk-free rate
  sigma: number // Volatility
): BlackScholesResult {
  if (T <= 0) {
    // Handle expired options
    const callPrice = Math.max(S - K, 0);
    const putPrice = Math.max(K - S, 0);
    return {
      callPrice,
      putPrice,
      d1: 0,
      d2: 0,
      nd1: S > K ? 1 : 0,
      nd2: S > K ? 1 : 0,
      nMinusD1: S > K ? 0 : 1,
      nMinusD2: S > K ? 0 : 1
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  
  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nMinusD1 = normalCDF(-d1);
  const nMinusD2 = normalCDF(-d2);
  
  const callPrice = S * nd1 - K * Math.exp(-r * T) * nd2;
  const putPrice = K * Math.exp(-r * T) * nMinusD2 - S * nMinusD1;
  
  return {
    callPrice,
    putPrice,
    d1,
    d2,
    nd1,
    nd2,
    nMinusD1,
    nMinusD2
  };
}

/**
 * Calculate Greeks for an option
 */
export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // per day
  vega: number;  // per 1% volatility change
  rho: number;   // per 1% interest rate change
}

export function calculateGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  optionType: 'call' | 'put'
): Greeks {
  if (T <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  
  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nMinusD1 = normalCDF(-d1);
  const nMinusD2 = normalCDF(-d2);
  
  // Standard normal probability density function
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const phiD1 = phi(d1);
  
  let delta: number;
  let rho: number;
  
  if (optionType === 'call') {
    delta = nd1;
    rho = K * T * Math.exp(-r * T) * nd2 / 100; // per 1% change
  } else {
    delta = -nMinusD1;
    rho = -K * T * Math.exp(-r * T) * nMinusD2 / 100; // per 1% change
  }
  
  const gamma = phiD1 / (S * sigma * sqrtT);
  const theta = (
    -S * phiD1 * sigma / (2 * sqrtT) - 
    r * K * Math.exp(-r * T) * (optionType === 'call' ? nd2 : nMinusD2)
  ) / 365; // per day
  
  const vega = S * phiD1 * sqrtT / 100; // per 1% volatility change
  
  return { delta, gamma, theta, vega, rho };
}

/**
 * Calculate the edge percentage
 */
export function calculateEdge(marketPrice: number, theoreticalPrice: number): number {
  if (theoreticalPrice === 0) return 0;
  return ((marketPrice - theoreticalPrice) / theoreticalPrice) * 100;
}

/**
 * Calculate time to expiration in years
 */
export function calculateTimeToExpiration(expirationDate: string): number {
  const expiry = new Date(expirationDate + 'T16:00:00-05:00'); // 4 PM ET
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, diffDays / 365.25);
}

/**
 * Calculate moneyness (how far ITM/OTM the option is)
 */
export function calculateMoneyness(stockPrice: number, strike: number): number {
  return ((strike - stockPrice) / stockPrice) * 100;
}

/**
 * Calculate bid-ask spread percentage
 */
export function calculateSpreadPercent(bid: number, ask: number): number {
  if (bid === 0 || ask === 0) return 0;
  const mid = (bid + ask) / 2;
  return ((ask - bid) / mid) * 100;
}

/**
 * Determine if option has liquidity warning
 */
export function hasLiquidityWarning(volume: number, openInterest: number): boolean {
  return volume < 1 || openInterest < 10;
}

/**
 * Determine if option has wide spread warning
 */
export function hasSpreadWarning(spreadPercent: number): boolean {
  return spreadPercent > 10; // More than 10% spread
}

/**
 * Calculate assignment probability using delta as approximation
 */
export function calculateAssignmentProbability(delta: number, optionType: 'call' | 'put'): number {
  if (optionType === 'call') {
    return Math.abs(delta) * 100;
  } else {
    return Math.abs(delta) * 100;
  }
}
