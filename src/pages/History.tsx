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
import { useIsMobile } from '../hooks/use-mobile';

const History = () => {
  const { isConnected, chain, address } = useAccount();
  const isMobile = useIsMobile();

  // Check if we're on a supported network
  const isSupportedNetwork =
    chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114; // Default to Coston2
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
    <div className={`p-4 space-y-6 ${isMobile ? '' : 'max-w-6xl mx-auto'}`}>
      {/* Page Header */}
      <div className='text-center'>
        <h1
          className={`font-bold text-foreground ${
            isMobile ? 'text-3xl' : 'text-4xl'
          }`}
        >
          📜 Activity History
        </h1>
        <p className='text-muted-foreground mt-2'>
          Track your deposits and view funding allocations
        </p>
      </div>

      {/* Network Status */}
      {isConnected && !isSupportedNetwork && (
        <div className='p-4 rounded-lg border bg-amber-50 border-amber-200 text-amber-800'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='h-5 w-5 text-amber-600' />
            <div>
              <p className='font-medium'>Network not supported</p>
              <p className='text-sm'>Please switch to Coston2 network</p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Not Deployed Warning */}
      {isConnected && !isContractDeployed && (
        <div className='p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='h-5 w-5 text-blue-600' />
            <div>
              <p className='font-medium'>Contract not deployed yet</p>
              <p className='text-sm'>
                The Flare Public Goods contract will be available soon on
                Coston2
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {/* Deposit Balance - Left Column on Desktop */}
        <div className={`${isMobile ? '' : 'col-span-1'}`}>
          <div className='flex flex-col gap-2 rounded-lg p-6 bg-red-50'>
            <div className='flex items-center gap-3'>
              <span className='text-2xl'>💰</span>
              <div>
                <p className='text-[#181411] text-base font-medium leading-normal'>
                  Your Deposit Balance
                </p>
                <p className='text-[#181411] tracking-light text-2xl font-bold leading-tight'>
                  {isContractDeployed && !balanceError
                    ? userBalance.toLocaleString()
                    : '0'}{' '}
                  USDC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Right Columns on Desktop */}
        <div className={`${isMobile ? '' : 'col-span-2'}`}>
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-[#181411]'>
              How it works
            </h3>
            <div className='space-y-3'>
              <div className='p-4 rounded-lg border border-red-100'>
                <p className='text-sm text-[#181411]'>
                  Deposit USDC to support public goods. Your deposits generate yield
                  through DeFi lending strategies. The longer you hold, the more impact
                  you create!
                </p>
              </div>

              <div className='p-4 rounded-lg border border-red-100'>
                <p className='text-sm text-[#181411]'>
                  Your principal is always safe and can be withdrawn at any
                  time. Only the generated yield is allocated to the public goods fund.
                </p>
              </div>

              <div className='p-4 rounded-lg border border-red-100'>
                <p className='text-sm text-[#181411]'>
                  Recipients are selected based on deposit duration and random selection.
                  The longer you contribute, the more you help fund open-source projects!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funding History - Full Width */}
      <FundingHistory />
    </div>
  );
};

export default History;
