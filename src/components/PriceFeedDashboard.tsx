import React, { useEffect, useState } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { Card, CardContent } from './ui/card';
import { formatUnits } from 'viem';

interface PriceFeed {
  symbol: string;
  price: string;
  change24h?: string;
  icon: string;
}

interface PriceFeedDashboardProps {
  contractAddress: `0x${string}`;
  contractAbi: any;
}

const PriceFeedDashboard: React.FC<PriceFeedDashboardProps> = ({
  contractAddress,
  contractAbi,
}) => {
  const { chain } = useAccount();
  const [priceFeeds, setPriceFeeds] = useState<PriceFeed[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const isCoston2 = chain?.id === 114;

  // Get all prices from contract
  const { data: pricesData, refetch: refetchPrices, error: pricesError, isLoading: pricesLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllPrices',
    chainId: chain?.id || 114,
    query: {
      refetchInterval: 90000, // 90 seconds (FTSO update interval)
      enabled: Boolean(contractAddress),
    },
  });

  // Get FLR price separately for allocation calculations
  const { data: flrPriceData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getFLRPrice',
    chainId: chain?.id || 114,
    query: {
      refetchInterval: 90000,
      enabled: Boolean(contractAddress),
    },
  });

  // Get allocation config
  const { data: allocationConfigData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'allocationConfig',
    chainId: chain?.id || 114,
  });

  useEffect(() => {
    if (pricesData && Array.isArray(pricesData) && pricesData.length >= 2) {
      const prices = pricesData[0] as bigint[];

      const feeds: PriceFeed[] = [
        {
          symbol: 'FLR/USD',
          price: formatPrice(prices[0]),
          icon: '🔥',
        },
        {
          symbol: 'BTC/USD',
          price: formatPrice(prices[1]),
          icon: '₿',
        },
        {
          symbol: 'XRP/USD',
          price: formatPrice(prices[2]),
          icon: '✨',
        },
        {
          symbol: 'ETH/USD',
          price: formatPrice(prices[3]),
          icon: '⟠',
        },
        {
          symbol: 'DOGE/USD',
          price: formatPrice(prices[4]),
          icon: '🐕',
        },
      ];

      setPriceFeeds(feeds);
      setLastUpdate(new Date());
    }
  }, [pricesData]);

  const formatPrice = (priceWei: bigint): string => {
    const price = parseFloat(formatUnits(priceWei, 18));
    if (price < 0.01) {
      return price.toFixed(6);
    } else if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  const getMinPriceThreshold = (): string => {
    if (!allocationConfigData || !Array.isArray(allocationConfigData)) return '0.00';
    const threshold = allocationConfigData[0] as bigint;
    return formatPrice(threshold);
  };

  const getPriceMultiplier = (): string => {
    if (!allocationConfigData || !Array.isArray(allocationConfigData)) return '100';
    const multiplier = allocationConfigData[1] as bigint;
    return (Number(multiplier) / 100).toFixed(0);
  };

  // Debug logging
  useEffect(() => {
    console.log('PriceFeedDashboard - pricesData:', pricesData);
    console.log('PriceFeedDashboard - pricesError:', pricesError);
    console.log('PriceFeedDashboard - contractAddress:', contractAddress);
  }, [pricesData, pricesError, contractAddress]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-foreground'>
            Live Price Feeds
          </h2>
          <p className='text-sm text-muted-foreground'>
            Updated every 90 seconds via FTSO
          </p>
        </div>
        <div className='text-right'>
          <div className='text-xs text-muted-foreground'>Last Update</div>
          <div className='text-sm font-medium text-foreground'>
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {pricesLoading && (
        <div className='text-center py-8 text-muted-foreground'>
          Loading price feeds...
        </div>
      )}
      {pricesError && (
        <div className='text-center py-8 text-destructive'>
          Error loading prices: {pricesError.message}
        </div>
      )}
      {!pricesLoading && priceFeeds.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          No price data available. Waiting for FTSO update...
        </div>
      )}

      {/* Price Grid */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        {priceFeeds.map((feed) => (
          <Card key={feed.symbol} className='bg-card border-border'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-2xl'>{feed.icon}</span>
                <span className='text-xs font-medium text-muted-foreground'>
                  {feed.symbol}
                </span>
              </div>
              <div className='text-2xl font-bold text-foreground'>
                ${feed.price}
              </div>
              {feed.change24h && (
                <div className={`text-xs mt-1 ${
                  feed.change24h.startsWith('+')
                    ? 'text-success'
                    : 'text-destructive'
                }`}>
                  {feed.change24h}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Allocation Info */}
      <Card className='bg-card border-border'>
        <CardContent className='p-6'>
          <h3 className='text-lg font-semibold text-foreground mb-4'>
            Price-Based Allocation Config
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <div className='text-sm text-muted-foreground'>Min FLR Price</div>
              <div className='text-xl font-bold text-foreground'>
                ${getMinPriceThreshold()}
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Threshold for allocation
              </div>
            </div>
            <div>
              <div className='text-sm text-muted-foreground'>Price Multiplier</div>
              <div className='text-xl font-bold text-foreground'>
                {getPriceMultiplier()}%
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Allocation weight factor
              </div>
            </div>
            <div>
              <div className='text-sm text-muted-foreground'>Current FLR Price</div>
              <div className='text-xl font-bold text-success'>
                ${flrPriceData && Array.isArray(flrPriceData)
                  ? formatPrice(flrPriceData[0] as bigint)
                  : '0.00'}
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Affects next allocation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className='bg-card border-border'>
        <CardContent className='p-6'>
          <h3 className='text-lg font-semibold text-foreground mb-3'>
            How Price Feeds Work
          </h3>
          <div className='space-y-2 text-sm text-muted-foreground'>
            <p>
              • <strong>FTSO (Flare Time Series Oracle)</strong> provides decentralized price data updated every 90 seconds
            </p>
            <p>
              • ~100 independent data providers submit prices, ensuring no single point of failure
            </p>
            <p>
              • <strong>Dynamic Allocation:</strong> When FLR price is high, more funds are allocated to developers
            </p>
            <p>
              • All price feeds are <strong>free to use</strong> - no oracle fees!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceFeedDashboard;
