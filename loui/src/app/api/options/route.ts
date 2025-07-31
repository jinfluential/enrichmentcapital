import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = false;

// Generate future expiration dates
const getNextFriday = (weeksOut: number): string => {
  const now = new Date();
  const daysUntilFriday = (5 - now.getDay() + 7) % 7;
  const nextFriday = new Date(now.getTime() + (daysUntilFriday + (weeksOut * 7)) * 24 * 60 * 60 * 1000);
  return nextFriday.toISOString().split('T')[0];
};

// Mock options data with future expiration dates
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
        contractSymbol: 'AAPL250207C00180000',
        strike: 180,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'call',
        lastPrice: 8.50,
        bid: 8.20,
        ask: 8.80,
        volume: 150,
        openInterest: 1200,
        impliedVolatility: 0.25
      },
      {
        contractSymbol: 'AAPL250214C00190000',
        strike: 190,
        expiration: getNextFriday(2), // 2 weeks out
        optionType: 'call',
        lastPrice: 3.20,
        bid: 3.00,
        ask: 3.40,
        volume: 75,
        openInterest: 800,
        impliedVolatility: 0.28
      },
      {
        contractSymbol: 'AAPL250207P00175000',
        strike: 175,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'put',
        lastPrice: 2.80,
        bid: 2.60,
        ask: 3.00,
        volume: 45,
        openInterest: 600,
        impliedVolatility: 0.26
      },
      {
        contractSymbol: 'AAPL250321C00185000',
        strike: 185,
        expiration: getNextFriday(8), // ~2 months out
        optionType: 'call',
        lastPrice: 12.75,
        bid: 12.50,
        ask: 13.00,
        volume: 89,
        openInterest: 950,
        impliedVolatility: 0.22
      }
    ]
  },
  'MSFT': {
    symbol: 'MSFT',
    price: 420.75,
    options: [
      {
        contractSymbol: 'MSFT250207C00415000',
        strike: 415,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'call',
        lastPrice: 12.50,
        bid: 12.00,
        ask: 13.00,
        volume: 200,
        openInterest: 1500,
        impliedVolatility: 0.22
      },
      {
        contractSymbol: 'MSFT250214P00420000',
        strike: 420,
        expiration: getNextFriday(2), // 2 weeks out
        optionType: 'put',
        lastPrice: 8.75,
        bid: 8.50,
        ask: 9.00,
        volume: 120,
        openInterest: 900,
        impliedVolatility: 0.24
      },
      {
        contractSymbol: 'MSFT250321C00425000',
        strike: 425,
        expiration: getNextFriday(8), // ~2 months out
        optionType: 'call',
        lastPrice: 15.25,
        bid: 15.00,
        ask: 15.50,
        volume: 167,
        openInterest: 1100,
        impliedVolatility: 0.21
      }
    ]
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 128.45,
    options: [
      {
        contractSymbol: 'NVDA250207C00125000',
        strike: 125,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'call',
        lastPrice: 6.80,
        bid: 6.60,
        ask: 7.00,
        volume: 325,
        openInterest: 2100,
        impliedVolatility: 0.35
      },
      {
        contractSymbol: 'NVDA250214P00130000',
        strike: 130,
        expiration: getNextFriday(2), // 2 weeks out
        optionType: 'put',
        lastPrice: 4.25,
        bid: 4.10,
        ask: 4.40,
        volume: 198,
        openInterest: 1650,
        impliedVolatility: 0.33
      }
    ]
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 248.50,
    options: [
      {
        contractSymbol: 'TSLA250207C00245000',
        strike: 245,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'call',
        lastPrice: 9.75,
        bid: 9.50,
        ask: 10.00,
        volume: 145,
        openInterest: 890,
        impliedVolatility: 0.42
      },
      {
        contractSymbol: 'TSLA250214P00250000',
        strike: 250,
        expiration: getNextFriday(2), // 2 weeks out
        optionType: 'put',
        lastPrice: 7.30,
        bid: 7.10,
        ask: 7.50,
        volume: 87,
        openInterest: 675,
        impliedVolatility: 0.40
      }
    ]
  },
  'GOOGL': {
    symbol: 'GOOGL',
    price: 162.85,
    options: [
      {
        contractSymbol: 'GOOGL250207C00160000',
        strike: 160,
        expiration: getNextFriday(1), // Next Friday
        optionType: 'call',
        lastPrice: 5.40,
        bid: 5.20,
        ask: 5.60,
        volume: 112,
        openInterest: 780,
        impliedVolatility: 0.28
      },
      {
        contractSymbol: 'GOOGL250214P00165000',
        strike: 165,
        expiration: getNextFriday(2), // 2 weeks out
        optionType: 'put',
        lastPrice: 4.85,
        bid: 4.70,
        ask: 5.00,
        volume: 94,
        openInterest: 620,
        impliedVolatility: 0.30
      }
    ]
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  
  if (!symbols) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const results: { symbol: string; price: number; options: Array<{
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
  }> }[] = [];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  for (const symbol of symbolList) {
    const data = MOCK_OPTIONS_DATA[symbol];
    if (data) {
      results.push(data);
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ error: `No data found for symbols: ${symbolList.join(', ')}` }, { status: 404 });
  }

  return NextResponse.json(results);
}
