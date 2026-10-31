import type { CryptoAsset, CryptoNetwork } from './schema';

export interface CryptoRate {
  asset: CryptoAsset;
  name: string;
  usdPrice: number;
  ngnPrice: number;
  change24h: number;
  networks: CryptoNetwork[];
  decimals: number;
}

export interface CryptoQuote {
  asset: CryptoAsset;
  network: CryptoNetwork;
  amountNgn: number;
  cryptoAmount: string;
  networkFeeCrypto: string;
  totalCrypto: string;
  exchangeRateNgn: string;
  depositAddress: string;
  qrPayload: string;
  expiresAt: string;
  expiresInSeconds: number;
}

// Resilient fallback rates in case of network partition or external rate limiter
const FALLBACK_RATES: Record<CryptoAsset, { usdPrice: number; change24h: number }> = {
  USDT: { usdPrice: 1.0, change24h: 0.01 },
  BTC: { usdPrice: 77000.0, change24h: 1.45 },
  ETH: { usdPrice: 2200.0, change24h: -0.85 },
  SOL: { usdPrice: 95.0, change24h: 3.2 },
};

// Standard network fees in crypto units
export const NETWORK_FEES: Record<CryptoNetwork, string> = {
  TRC20: '1.000000',     // 1 USDT
  ERC20: '3.500000',     // 3.5 USDT
  Bitcoin: '0.00005000', // ~0.00005 BTC
  Solana: '0.0010',      // 0.001 SOL
};

// Asset decimal precision
export const ASSET_DECIMALS: Record<CryptoAsset, number> = {
  USDT: 6,
  BTC: 8,
  ETH: 8,
  SOL: 4,
};

// Networks supported per asset
export const ASSET_NETWORKS: Record<CryptoAsset, CryptoNetwork[]> = {
  USDT: ['TRC20', 'ERC20'],
  BTC: ['Bitcoin'],
  ETH: ['ERC20'],
  SOL: ['Solana'],
};

// Destination deposit addresses (configurable via ENV, with enterprise escrow defaults)
export function getDepositAddress(asset: CryptoAsset, network: CryptoNetwork): string {
  const envKey = `CRYPTO_${asset}_${network.toUpperCase()}_ADDRESS`;
  if (process.env[envKey]) return process.env[envKey]!;

  switch (network) {
    case 'TRC20':
      return process.env.CRYPTO_USDT_TRC20_ADDRESS || 'TLsV52sRDL79HXGGm9yzwKZsEpx81iF3n9';
    case 'ERC20':
      return process.env.CRYPTO_ERC20_ADDRESS || '0x71C8360f3E2823567D284534433D41662973715c';
    case 'Bitcoin':
      return process.env.CRYPTO_BTC_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    case 'Solana':
      return process.env.CRYPTO_SOL_ADDRESS || '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    default:
      return '0x71C8360f3E2823567D284534433D41662973715c';
  }
}

// In-memory cache for market rates (TTL: 30 seconds)
let ratesCache: { data: Record<CryptoAsset, CryptoRate>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

/** Live NGN/USD rate (official/parallel reference, configurable via USD_NGN_RATE). */
export function getUsdNgnRate(): number {
  const custom = process.env.USD_NGN_RATE ? parseFloat(process.env.USD_NGN_RATE) : NaN;
  return Number.isFinite(custom) && custom > 0 ? custom : 1550.0;
}

/** Fetches real-time market rates from Binance API, falling back gracefully if needed. */
export async function getLiveCryptoRates(): Promise<Record<CryptoAsset, CryptoRate>> {
  const now = Date.now();
  if (ratesCache && now - ratesCache.fetchedAt < CACHE_TTL_MS) {
    return ratesCache.data;
  }

  const usdNgn = getUsdNgnRate();
  const prices: Record<CryptoAsset, { usdPrice: number; change24h: number }> = { ...FALLBACK_RATES };

  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=[%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22]',
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const tickers: { symbol: string; lastPrice: string; priceChangePercent: string }[] = await res.json();
      for (const t of tickers) {
        if (t.symbol === 'BTCUSDT') {
          prices.BTC = { usdPrice: parseFloat(t.lastPrice), change24h: parseFloat(t.priceChangePercent) };
        } else if (t.symbol === 'ETHUSDT') {
          prices.ETH = { usdPrice: parseFloat(t.lastPrice), change24h: parseFloat(t.priceChangePercent) };
        } else if (t.symbol === 'SOLUSDT') {
          prices.SOL = { usdPrice: parseFloat(t.lastPrice), change24h: parseFloat(t.priceChangePercent) };
        }
      }
    }
  } catch {
    // Retain fallback rates if external API is temporarily down
  }

  const result: Record<CryptoAsset, CryptoRate> = {
    USDT: {
      asset: 'USDT',
      name: 'Tether USD',
      usdPrice: prices.USDT.usdPrice,
      ngnPrice: Math.round(prices.USDT.usdPrice * usdNgn),
      change24h: prices.USDT.change24h,
      networks: ASSET_NETWORKS.USDT,
      decimals: ASSET_DECIMALS.USDT,
    },
    BTC: {
      asset: 'BTC',
      name: 'Bitcoin',
      usdPrice: prices.BTC.usdPrice,
      ngnPrice: Math.round(prices.BTC.usdPrice * usdNgn),
      change24h: prices.BTC.change24h,
      networks: ASSET_NETWORKS.BTC,
      decimals: ASSET_DECIMALS.BTC,
    },
    ETH: {
      asset: 'ETH',
      name: 'Ethereum',
      usdPrice: prices.ETH.usdPrice,
      ngnPrice: Math.round(prices.ETH.usdPrice * usdNgn),
      change24h: prices.ETH.change24h,
      networks: ASSET_NETWORKS.ETH,
      decimals: ASSET_DECIMALS.ETH,
    },
    SOL: {
      asset: 'SOL',
      name: 'Solana',
      usdPrice: prices.SOL.usdPrice,
      ngnPrice: Math.round(prices.SOL.usdPrice * usdNgn),
      change24h: prices.SOL.change24h,
      networks: ASSET_NETWORKS.SOL,
      decimals: ASSET_DECIMALS.SOL,
    },
  };

  ratesCache = { data: result, fetchedAt: now };
  return result;
}

/** Formats a floating-point number to exact decimal precision string without scientific notation. */
export function formatCryptoDecimals(amount: number, decimals: number): string {
  return amount.toFixed(decimals);
}

/** Calculates an exact crypto quote for an order amount in kobo. */
export async function calculateCryptoQuote(
  amountKobo: number,
  asset: CryptoAsset,
  network: CryptoNetwork
): Promise<CryptoQuote> {
  const rates = await getLiveCryptoRates();
  const rateInfo = rates[asset];
  const amountNgn = amountKobo / 100;
  const decimals = ASSET_DECIMALS[asset];

  // Raw crypto equivalent = amountNgn / ngnPrice
  const rawCryptoAmount = amountNgn / rateInfo.ngnPrice;
  const cryptoAmount = formatCryptoDecimals(rawCryptoAmount, decimals);

  const fee = NETWORK_FEES[network] || '0';
  const totalNumber = parseFloat(cryptoAmount) + parseFloat(fee);
  const totalCrypto = formatCryptoDecimals(totalNumber, decimals);

  const depositAddress = getDepositAddress(asset, network);
  const quoteTtlMinutes = 15;
  const expiresAtDate = new Date(Date.now() + quoteTtlMinutes * 60_000);

  // Generate standardized URI for QR scanning
  let qrPayload = depositAddress;
  if (network === 'Bitcoin') {
    qrPayload = `bitcoin:${depositAddress}?amount=${totalCrypto}&label=Desla%20Order`;
  } else if (network === 'ERC20') {
    qrPayload = `ethereum:${depositAddress}?value=${totalCrypto}`;
  } else if (network === 'Solana') {
    qrPayload = `solana:${depositAddress}?amount=${totalCrypto}`;
  }

  return {
    asset,
    network,
    amountNgn,
    cryptoAmount,
    networkFeeCrypto: fee,
    totalCrypto,
    exchangeRateNgn: rateInfo.ngnPrice.toFixed(2),
    depositAddress,
    qrPayload,
    expiresAt: expiresAtDate.toISOString(),
    expiresInSeconds: quoteTtlMinutes * 60,
  };
}

