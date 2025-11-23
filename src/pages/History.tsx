import React from 'react';
import { useReadContract, useAccount } from 'wagmi';
import {
  flarePublicGoodsAddress,
  flarePublicGoodsAbi,
  CONTRACTS,
} from '../contracts/FlarePublicGoods';
import { formatUnits } from 'viem';
import { AlertCircle } from 'lucide-react';
import FundingHistory from '../components/FundingHistory';
import { Card, CardContent } from '../components/ui/card';

const History = () => {
  const { isConnected, chain, address } = useAccount();

  // Check if we're on a supported network
  const isSupportedNetwork =
    chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114;
  const contractAddress =
    CONTRACTS[targetChainId as keyof typeof CONTRACTS]?.flarePublicGoods ??
    flarePublicGoodsAddress;

  const { data: userBalanceData, isError: balanceError } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'balanceOf',
    chainId: targetChainId,
    args: [address as `0x${string}`],
    query: {
      refetchInterval: 30000,
      enabled:
        isConnected &&
        !!address &&
        contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  const userBalance = userBalanceData
    ? parseFloat(formatUnits(userBalanceData as bigint, 6))
    : 0;

  const isContractDeployed =
    contractAddress !== '0x0000000000000000000000000000000000000000';

  return (
    <div className='min-h-screen bg-background p-4 md:p-8'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Page Header */}
        <div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Activity History
          </h1>
          <p className='text-muted-foreground'>
            Track your deposits and view funding allocations
          </p>
        </div>

        {/* Network Status */}
        {isConnected && !isSupportedNetwork && (
          <div className='p-4 rounded-lg border border-warning/50 bg-warning/10 text-warning'>
            <div className='flex items-center gap-3'>
              <AlertCircle className='h-5 w-5' />
              <div>
                <p className='font-medium'>Network not supported</p>
                <p className='text-sm'>Please switch to Coston2 network</p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Not Deployed Warning */}
        {isConnected && !isContractDeployed && (
          <div className='p-4 rounded-lg border border-border bg-card'>
            <div className='flex items-center gap-3'>
              <AlertCircle className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='font-medium text-foreground'>Contract not deployed yet</p>
                <p className='text-sm text-muted-foreground'>
                  The Flare Public Goods contract will be available soon on Coston2
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <Card className='bg-card border-border'>
          <CardContent className='p-6'>
            <p className='text-sm text-muted-foreground mb-2'>Your Deposit Balance</p>
            <div className='text-4xl font-bold text-foreground'>
              {isContractDeployed && !balanceError
                ? userBalance.toLocaleString()
                : '0'}{' '}
              <span className='text-lg text-muted-foreground'>USDC</span>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className='bg-card border-border'>
          <CardContent className='p-6 space-y-4'>
            <h3 className='text-lg font-semibold text-foreground'>How it works</h3>
            <div className='space-y-3 text-sm text-muted-foreground'>
              <p>
                Deposit USDC to support public goods. Your deposits generate yield
                through DeFi lending strategies. The longer you hold, the more impact
                you create!
              </p>
              <p>
                Your principal is always safe and can be withdrawn at any
                time. Only the generated yield is allocated to the public goods fund.
              </p>
              <p>
                Recipients are selected based on deposit duration and random selection.
                The longer you contribute, the more you help fund open-source projects!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Funding History */}
        <FundingHistory />
      </div>
    </div>
  );
};

export default History;
