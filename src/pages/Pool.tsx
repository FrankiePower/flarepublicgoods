import React from 'react';
import { useReadContract, useAccount } from 'wagmi';
import {
  flarePublicGoodsAddress,
  flarePublicGoodsAbi,
  CONTRACTS,
} from '../contracts/FlarePublicGoods';
import { formatUnits } from 'viem';
import { Card, CardContent } from '../components/ui/card';
import { useIsMobile } from '../hooks/use-mobile';

const Pool = () => {
  const { isConnected, chain } = useAccount();
  const isMobile = useIsMobile();

  // Check if we're on a supported network
  const isSupportedNetwork =
    chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114;
  const contractAddress =
    CONTRACTS[targetChainId as keyof typeof CONTRACTS]?.flarePublicGoods ??
    flarePublicGoodsAddress;

  const { data: totalAssetsData } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'totalAssets',
    chainId: targetChainId,
    query: {
      refetchInterval: 30000,
      enabled: isConnected,
    },
  });

  const { data: prizePoolData } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'prizePool',
    chainId: targetChainId,
    query: {
      refetchInterval: 30000,
      enabled: isConnected,
    },
  });

  const { data: totalPrincipalData } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'totalPrincipal',
    chainId: targetChainId,
    query: {
      refetchInterval: 30000,
      enabled: isConnected,
    },
  });

  // Parse the data values
  const totalAssets = totalAssetsData
    ? parseFloat(formatUnits(totalAssetsData as bigint, 6))
    : 0;
  const prizePool = prizePoolData
    ? parseFloat(formatUnits(prizePoolData as bigint, 6))
    : 0;
  const totalPrincipal = totalPrincipalData
    ? parseFloat(formatUnits(totalPrincipalData as bigint, 6))
    : 0;

  return (
    <div className={`p-4 space-y-6 ${isMobile ? '' : 'max-w-4xl mx-auto'}`}>
      {/* Pool Overview */}
      <div className='space-y-6'>
        <div className='text-center'>
          <h1
            className={`font-bold text-foreground ${
              isMobile ? 'text-3xl' : 'text-4xl'
            }`}
          >
            🌍 Funding Overview
          </h1>
          <p className='text-muted-foreground mt-2'>
            Current state of the Flare Public Goods fund
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}
        >
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl mb-2'>💰</div>
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Total Assets
              </h3>
              <p
                className={`font-bold text-foreground ${
                  isMobile ? 'text-2xl' : 'text-3xl'
                }`}
              >
                ${totalAssets}
              </p>
              <p className='text-sm text-muted-foreground'>USDC</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl mb-2'>💚</div>
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Public Goods Fund
              </h3>
              <p
                className={`font-bold text-foreground ${
                  isMobile ? 'text-2xl' : 'text-3xl'
                }`}
              >
                ${prizePool}
              </p>
              <p className='text-sm text-muted-foreground'>USDC</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl mb-2'>📊</div>
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Total Principal
              </h3>
              <p
                className={`font-bold text-foreground ${
                  isMobile ? 'text-2xl' : 'text-3xl'
                }`}
              >
                ${totalPrincipal}
              </p>
              <p className='text-sm text-muted-foreground'>USDC</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div
          className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
                <span className='text-2xl'>📈</span>
                How It Works
              </h3>
              <div className='space-y-3 text-sm text-muted-foreground'>
                <p>
                  Users deposit USDC into the protocol. Your principal remains safe
                  and can be withdrawn at any time with no loss.
                </p>
                <p>
                  The protocol generates yield through DeFi lending strategies.
                  All generated yield is allocated to the Public Goods Fund to
                  support open-source projects and community initiatives.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
                <span className='text-2xl'>🎯</span>
                Key Features
              </h3>
              <div className='space-y-3 text-sm text-muted-foreground'>
                <p>
                  <strong>Safe Principal:</strong> Your deposited USDC is always
                  safe and can be withdrawn at any time.
                </p>
                <p>
                  <strong>Automated Impact:</strong> Yield is automatically
                  allocated to fund public goods and open-source projects.
                </p>
                <p>
                  <strong>No Fees:</strong> No fees on deposits or withdrawals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pool;
