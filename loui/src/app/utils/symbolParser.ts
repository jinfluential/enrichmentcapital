/**
 * Parse comma or space separated stock symbols
 * Examples: "AAPL, MSFT" or "AAPL MSFT" -> ["AAPL", "MSFT"]
 */
export function parseSymbols(input: string): string[] {
  if (!input.trim()) return [];
  
  // Split by comma first, then by spaces
  const symbols = input
    .split(/[,\s]+/)
    .map(symbol => symbol.trim().toUpperCase())
    .filter(symbol => symbol.length > 0 && /^[A-Z]{1,5}$/.test(symbol));
  
  // Remove duplicates
  return [...new Set(symbols)];
}

/**
 * Validate if a string looks like a valid stock symbol
 */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}

/**
 * Format symbols for display
 */
export function formatSymbolsForDisplay(symbols: string[]): string {
  return symbols.join(', ');
}
