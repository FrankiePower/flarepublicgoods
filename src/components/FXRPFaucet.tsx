import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { formatUnits } from 'viem';
import { mockFxrpAbi, CONTRACTS } from '../contracts/FlarePublicGoods';
import { useToast } from './ui/use-toast';

const FXRPFaucet: React.FC = () => {
  const { address, chain, isConnected } = useAccount();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const isSupportedNetwork = chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114;
  const fxrpAddress = CONTRACTS[targetChainId as keyof typeof CONTRACTS]?.fxrp;

  // Get user's FXRP balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: fxrpAddress as `0x${string}`,
    abi: mockFxrpAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && fxrpAddress),
    },
  });

  // Check if user can claim
  const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
    address: fxrpAddress as `0x${string}`,
    abi: mockFxrpAbi,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && fxrpAddress),
    },
  });

  // Get time until next claim
  const { data: timeUntilNextClaim, refetch: refetchTimeUntilNextClaim } = useReadContract({
    address: fxrpAddress as `0x${string}`,
    abi: mockFxrpAbi,
    functionName: 'timeUntilNextClaim',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && fxrpAddress),
      refetchInterval: 1000, // Update every second
    },
  });

  // Get faucet amount
  const { data: faucetAmount } = useReadContract({
    address: fxrpAddress as `0x${string}`,
    abi: mockFxrpAbi,
    functionName: 'FAUCET_AMOUNT',
    query: {
      enabled: Boolean(fxrpAddress),
    },
  });

  // Claim from faucet
  const { writeContract: claimFaucet, data: claimHash } = useWriteContract();

  const { isSuccess: isClaimConfirmed, isLoading: isConfirmingClaim } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  useEffect(() => {
    if (isClaimConfirmed) {
      toast({
        title: 'Faucet Claim Successful',
        description: `You received ${faucetAmount ? formatUnits(faucetAmount as bigint, 18) : '1000'} MFXRP!`,
      });
      refetchBalance();
      refetchCanClaim();
      refetchTimeUntilNextClaim();
    }
  }, [isClaimConfirmed, faucetAmount, toast, refetchBalance, refetchCanClaim, refetchTimeUntilNextClaim]);

  useEffect(() => {
    if (timeUntilNextClaim) {
      setTimeRemaining(Number(timeUntilNextClaim));
    }
  }, [timeUntilNextClaim]);

  const handleClaim = () => {
    if (!fxrpAddress) return;
    claimFaucet({
      address: fxrpAddress as `0x${string}`,
      abi: mockFxrpAbi,
      functionName: 'faucet',
    });
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return 'Now';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const userBalance = balance ? parseFloat(formatUnits(balance as bigint, 18)) : 0;
  const claimAmount = faucetAmount ? formatUnits(faucetAmount as bigint, 18) : '1000';

  return (
    <Card className='bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
              <span className='text-2xl'>💧</span>
              Mock FXRP Faucet
            </h3>
            <p className='text-sm text-muted-foreground mt-1'>
              Get free test tokens to try the platform
            </p>
          </div>
          <div className='text-right'>
            <div className='text-xs text-muted-foreground'>Your Balance</div>
            <div className='text-2xl font-bold text-foreground'>
              {userBalance.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className='text-xs text-muted-foreground'>MFXRP</div>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Claim Amount:</span>
            <span className='font-semibold text-foreground'>{claimAmount} MFXRP</span>
          </div>

          <Button
            onClick={handleClaim}
            disabled={!isConnected || !canClaim || isConfirmingClaim}
            className='w-full h-12 text-base font-semibold'
          >
            {!isConnected
              ? 'Connect Wallet'
              : isConfirmingClaim
              ? 'Claiming...'
              : canClaim
              ? '🎁 Claim Free MFXRP'
              : `⏳ Available in ${formatTime(timeRemaining)}`}
          </Button>

          <p className='text-xs text-center text-muted-foreground'>
            Cooldown: 1 hour between claims
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FXRPFaucet;
