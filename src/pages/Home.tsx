import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  flarePublicGoodsAddress,
  flarePublicGoodsAbi,
  CONTRACTS,
  SUPPORTED_TOKENS,
} from '../contracts/FlarePublicGoods';
import { usdcAbi, usdcAddress } from '../contracts/USDC';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { AlertCircle, X } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { useToast } from '../components/ui/use-toast';
import {
  cardVariants,
  staggerContainer,
  buttonVariants,
  modalVariants,
  backdropVariants,
  fadeUp,
  scaleIn,
} from '../lib/animations';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import PriceFeedDashboard from '../components/PriceFeedDashboard';
import FXRPFaucet from '../components/FXRPFaucet';

const PSLHome = () => {
  const { isConnected, chain, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isRightStackOpen, setIsRightStackOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw'>(
    'deposit'
  );
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [pendingDepositAmount, setPendingDepositAmount] = useState<
    bigint | undefined
  >(undefined);
  const autoDepositTriggeredRef = useRef(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [awardHash, setAwardHash] = useState<`0x${string}` | undefined>(
    undefined
  );

  // Add state for tracking the award outcome
  const [awardOutcome, setAwardOutcome] = useState<
    'pending' | 'success' | 'no-prize' | null
  >(null);
  const [awardResult, setAwardResult] = useState<{
    winner?: string;
    amount?: bigint;
    caller?: string;
  } | null>(null);

  // Step tracking for deposit flow
  const [depositStep, setDepositStep] = useState<
    'idle' | 'approving' | 'approved' | 'depositing' | 'completed'
  >('idle');

  // Step tracking for withdraw flow
  const [withdrawStep, setWithdrawStep] = useState<
    'idle' | 'withdrawing' | 'completed'
  >('idle');

  // Check if we're on a supported network
  const isSupportedNetwork =
    chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114;
  const contractAddress =
    CONTRACTS[targetChainId as keyof typeof CONTRACTS]?.flarePublicGoods ??
    flarePublicGoodsAddress;

  // Prefer on-chain FXRP to avoid mismatches
  const { data: assetOnChain } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'FXRP',
    chainId: targetChainId,
    query: {
      enabled: Boolean(contractAddress),
      staleTime: 60_000,
      refetchInterval: 60_000,
    },
  } as any);

  const mappedTokenAddress =
    (CONTRACTS as any)[targetChainId]?.usdc ?? usdcAddress;
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const onChainAsset =
    typeof assetOnChain === 'string' ? (assetOnChain as string) : undefined;
  const currentTokenAddress =
    onChainAsset &&
    isAddress(onChainAsset) &&
    onChainAsset.toLowerCase() !== zeroAddress
      ? (onChainAsset as `0x${string}`)
      : (mappedTokenAddress as `0x${string}`);

  const { data: userBalanceData, refetch: refetchUserBalance } =
    useReadContract({
      address: contractAddress,
      abi: flarePublicGoodsAbi,
      functionName: 'depositBalances',
      chainId: targetChainId,
      args: [address as `0x${string}`],
      query: {
        refetchInterval: 30000,
        enabled: isConnected && !!address,
      },
    });

  const userPSLBalance = userBalanceData
    ? parseFloat(formatUnits(userBalanceData as bigint, 18))
    : 0;

  // Total deposits
  const { data: totalAssetsBn, refetch: refetchTotalAssets } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'totalDeposits',
    chainId: targetChainId,
    query: {
      refetchInterval: 10000,
      enabled: Boolean(contractAddress),
    },
  } as any);

  const { data: verifiedDevsData } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'getVerifiedDeveloperCount',
    chainId: targetChainId,
    query: {
      refetchInterval: 30000,
      enabled: Boolean(contractAddress),
    },
  } as any);

  const verifiedDevelopers = useMemo(() => {
    return Number(verifiedDevsData ?? 0n);
  }, [verifiedDevsData]);

  // Formatted display for total deposits (FXRP, 18 decimals)
  const totalAssetsDisplay = useMemo(() => {
    try {
      const v = (totalAssetsBn as bigint) ?? 0n;
      const num = parseFloat(formatUnits(v, 18));
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return '0.00';
    }
  }, [totalAssetsBn]);

  // Wallet allowance and balance for USDC
  const contractAddressHex = contractAddress as `0x${string}`;
  const accountAddress = address as `0x${string}` | undefined;

  const { data: allowance = 0n, refetch: refetchAllowance } = useReadContract({
    address: currentTokenAddress,
    abi: usdcAbi,
    functionName: 'allowance',
    chainId: targetChainId,
    args: [accountAddress as `0x${string}`, contractAddressHex],
    query: {
      enabled: isConnected && !!address && !!isSupportedNetwork,
      refetchInterval: 30000,
    },
  });

  const { data: walletBalance = 0n } = useReadContract({
    address: currentTokenAddress,
    abi: usdcAbi,
    functionName: 'balanceOf',
    chainId: targetChainId,
    args: [accountAddress as `0x${string}`],
    query: {
      enabled: isConnected && !!address && !!isSupportedNetwork,
      refetchInterval: 30000,
    },
  } as any);

  // Winner/prize reads (refetched upon award confirmation)
  const { data: lastWinner, refetch: refetchLastWinner } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'lastWinner',
    chainId: targetChainId,
    query: { enabled: false },
  } as any);
  const { data: lastPrizeAmount, refetch: refetchLastPrize } = useReadContract({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    functionName: 'lastPrizeAmount',
    chainId: targetChainId,
    query: { enabled: false },
  } as any);

  const parsedAmount: bigint = useMemo(() => {
    if (!amount || Number(amount) <= 0) return 0n;
    try {
      return parseUnits(amount, 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const walletUSDCDisplay = useMemo(() => {
    try {
      return parseFloat(formatUnits(walletBalance as bigint, 18));
    } catch {
      return 0;
    }
  }, [walletBalance]);

  const { writeContract: approve, isPending: isApproving } = useWriteContract({
    onSuccess: (hash: `0x${string}`) => {
      setApprovalHash(hash);
      toast({
        title: 'Approval submitted',
        description: 'Waiting for confirmation...',
      });
    },
    onError: (error) => {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  } as any);

  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalConfirmed,
    error: approvalError,
  } = useWaitForTransactionReceipt({
    chainId: targetChainId,
    hash: approvalHash,
    confirmations: 1,
    query: { enabled: Boolean(approvalHash), refetchInterval: 1000 },
  } as any);

  const {
    writeContract: deposit,
    writeContractAsync: depositAsync,
    isPending: isDepositing,
  } = useWriteContract({
    onSuccess: (hash: `0x${string}`) => {
      console.log('Deposit onSuccess called with hash:', hash);
      setDepositHash(hash);
      toast({
        title: 'Deposit submitted',
        description: 'Waiting for confirmation...',
      });
    },
    onError: (error) => {
      console.log('Deposit onError called:', error);
      toast({
        title: 'Deposit Failed',
        description: error.message,
        variant: 'destructive',
      });
      autoDepositTriggeredRef.current = false;
    },
  } as any);

  const {
    isLoading: isConfirmingDeposit,
    isSuccess: isDepositConfirmed,
    error: depositError,
  } = useWaitForTransactionReceipt({
    chainId: targetChainId,
    hash: depositHash,
    confirmations: 1,
    query: { enabled: Boolean(depositHash), refetchInterval: 1000 },
  } as any);

  const {
    writeContract: withdraw,
    writeContractAsync: withdrawAsync,
    isPending: isWithdrawing,
  } = useWriteContract({
    onSuccess: (hash: `0x${string}`) => {
      console.log('Withdraw onSuccess called with hash:', hash);
      setWithdrawHash(hash);
      toast({
        title: 'Withdrawal submitted',
        description: 'Waiting for confirmation...',
      });
    },
    onError: (error) => {
      console.log('Withdraw onError called:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message,
        variant: 'destructive',
      });
      setWithdrawStep('idle');
    },
  } as any);

  const {
    isLoading: isConfirmingWithdraw,
    isSuccess: isWithdrawConfirmed,
    error: withdrawError,
  } = useWaitForTransactionReceipt({
    chainId: targetChainId,
    hash: withdrawHash,
    confirmations: 1,
    query: { enabled: Boolean(withdrawHash), refetchInterval: 1000 },
  } as any);

  // Award prize write + receipt
  const { writeContract: tryAwardPrize, isPending: isAwarding } =
    useWriteContract({
      onSuccess: (hash: `0x${string}`) => {
        setAwardHash(hash);
        // Reset the award outcome when starting a new transaction
        setAwardOutcome('pending');
        setAwardResult(null);
        toast({
          title: '🔄 Allocation submitted!',
          description: 'Waiting for secure randomness verification...',
        });
      },
      onError: (error) => {
        toast({
          title: '⏳ Not ready yet',
          description:
            error.message || 'Not enough yield generated. Try again soon!',
          variant: 'destructive',
        });
      },
    } as any);

  const {
    isLoading: isConfirmingAward,
    isSuccess: isAwardConfirmed,
    error: awardError,
  } = useWaitForTransactionReceipt({
    chainId: targetChainId,
    hash: awardHash,
    confirmations: 1,
    query: { enabled: Boolean(awardHash), refetchInterval: 1000 },
  } as any);

  // Watch for FundsAllocated events
  useWatchContractEvent({
    address: contractAddress,
    abi: flarePublicGoodsAbi,
    eventName: 'FundsAllocated',
    onLogs: (logs) => {
      console.log('🎉 FundsAllocated event received:', logs);
      if (logs.length > 0) {
        const log = logs[logs.length - 1];
        if (log.args.developer && log.args.amount) {
          setAwardOutcome('success');
          setAwardResult({
            winner: log.args.developer,
            amount: log.args.amount,
          });
          toast({
            title: '💚 Funding Allocated!',
            description: `${formatUnits(
              log.args.amount,
              18
            )} FXRP allocated to developer ${log.args.developer.slice(
              0,
              6
            )}...${log.args.developer.slice(-4)}!`,
          });
        }
      }
    },
    enabled: Boolean(contractAddress) && Boolean(awardHash),
  });

  useEffect(() => {
    if (approvalError) {
      toast({
        title: 'Approval Error',
        description: approvalError.message,
        variant: 'destructive',
      });
      setDepositStep('idle');
    }
  }, [approvalError, toast]);

  useEffect(() => {
    if (depositError) {
      toast({
        title: 'Deposit Error',
        description: depositError.message,
        variant: 'destructive',
      });
      setDepositStep('idle');
    }
  }, [depositError, toast]);

  useEffect(() => {
    if (withdrawError) {
      toast({
        title: 'Withdrawal Error',
        description: withdrawError.message,
        variant: 'destructive',
      });
    }
  }, [withdrawError, toast]);

  useEffect(() => {
    if (awardError) {
      toast({
        title: '⏳ Not ready yet',
        description: awardError.message,
        variant: 'destructive',
      });
    }
  }, [awardError, toast]);

  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance();
      if (
        !autoDepositTriggeredRef.current &&
        pendingDepositAmount &&
        isAddress(contractAddress)
      ) {
        console.log(
          'Approval confirmed: Triggering auto-deposit with amount:',
          pendingDepositAmount
        );
        autoDepositTriggeredRef.current = true;
        setDepositStep('depositing');

        // Use async version to get the hash directly
        depositAsync({
          address: contractAddress,
          abi: flarePublicGoodsAbi,
          functionName: 'deposit',
          args: [pendingDepositAmount],
        })
          .then((hash) => {
            console.log('Auto-deposit hash received:', hash);
            setDepositHash(hash);
          })
          .catch((error) => {
            console.error('Auto-deposit failed:', error);
            setDepositStep('idle');
          });
      }
      setApprovalHash(undefined);
    }
  }, [
    isApprovalConfirmed,
    pendingDepositAmount,
    contractAddress,
    deposit,
    refetchAllowance,
  ]);

  // Poll allowance while waiting for approval indexers – auto deposit when ready
  useEffect(() => {
    if (!isConnected || !address || !isSupportedNetwork) return;
    if (!pendingDepositAmount || pendingDepositAmount === 0n) return;

    const intervalId = setInterval(async () => {
      try {
        const result = await (refetchAllowance() as unknown as Promise<
          { data?: bigint } | undefined
        >);
        const latestAllowance =
          result && result.data !== undefined ? result.data! : allowance;
        if (latestAllowance >= pendingDepositAmount) {
          if (!autoDepositTriggeredRef.current && isAddress(contractAddress)) {
            console.log(
              'Polling: Triggering auto-deposit with amount:',
              pendingDepositAmount
            );
            autoDepositTriggeredRef.current = true;
            setDepositStep('depositing');
            depositAsync({
              address: contractAddress,
              abi: flarePublicGoodsAbi,
              functionName: 'deposit',
              args: [pendingDepositAmount],
            })
              .then((hash) => {
                console.log('Polling auto-deposit hash received:', hash);
                setDepositHash(hash);
              })
              .catch((error) => {
                console.error('Polling auto-deposit failed:', error);
                setDepositStep('idle');
              });
          }
          clearInterval(intervalId);
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    isConnected,
    address,
    isSupportedNetwork,
    pendingDepositAmount,
    refetchAllowance,
    allowance,
    contractAddress,
    deposit,
  ]);

  useEffect(() => {
    console.log('Deposit confirmation check:', {
      isDepositConfirmed,
      depositHash,
    });
    if (isDepositConfirmed) {
      console.log('Deposit confirmed! Setting step to completed');
      // Mark deposit as completed
      setDepositStep('completed');

      toast({
        title: 'Deposit Successful',
        description: 'Your FXRP has been deposited.',
      });

      // Wait a moment to show the completed state, then dismiss modal
      setTimeout(() => {
        console.log('Dismissing modal after completion');
        setIsRightStackOpen(false);
        setDepositStep('idle');
        setAmount('');
        setDepositHash(undefined);
        setPendingDepositAmount(undefined);
        autoDepositTriggeredRef.current = false;
        refetchAllowance();

        // Refresh user balance and other contract data
        if (address) {
          // Refetch user's PSL balance
          refetchUserBalance();
          // Refetch total assets
          refetchTotalAssets();
        }
      }, 1500);
    }
  }, [
    isDepositConfirmed,
    depositHash,
    refetchAllowance,
    refetchUserBalance,
    refetchTotalAssets,
    toast,
    address,
  ]);

  useEffect(() => {
    console.log('Withdraw confirmation check:', {
      isWithdrawConfirmed,
      withdrawHash,
    });
    if (isWithdrawConfirmed) {
      console.log('Withdraw confirmed! Setting step to completed');
      // Mark withdraw as completed
      setWithdrawStep('completed');

      toast({
        title: 'Withdrawal Successful',
        description: 'Your FXRP has been withdrawn.',
      });

      // Wait a moment to show the completed state, then dismiss modal
      setTimeout(() => {
        console.log('Dismissing withdraw modal after completion');
        setIsRightStackOpen(false);
        setWithdrawStep('idle');
        setAmount('');
        setWithdrawHash(undefined);

        // Refresh user balance and other contract data
        if (address) {
          // Refetch user's PSL balance
          refetchUserBalance();
          // Refetch total assets
          refetchTotalAssets();
        }
      }, 1500);
    }
  }, [
    isWithdrawConfirmed,
    withdrawHash,
    refetchUserBalance,
    refetchTotalAssets,
    toast,
    address,
  ]);

  useEffect(() => {
    if (isAwardConfirmed) {
      // Best-effort refresh and then celebrate
      Promise.allSettled([refetchLastWinner(), refetchLastPrize()]).then(
        (results) => {
          const prize =
            results[1].status === 'fulfilled' && results[1].value?.data
              ? (results[1].value.data as bigint)
              : 0n;
          const winner =
            results[0].status === 'fulfilled' && results[0].value?.data
              ? (results[0].value.data as string)
              : undefined;
          const prizeDisplay = prize
            ? `${formatUnits(prize, 6)} USDC`
            : 'a mystery prize';
          const youReceived =
            winner && address && winner.toLowerCase() === address.toLowerCase();
          toast({
            title: youReceived ? '💚 You received funding!' : '💚 Funding Allocated!',
            description: youReceived
              ? `You received ${prizeDisplay}!`
              : `Funding of ${prizeDisplay} was allocated to a contributor.`,
          });
        }
      );
      setAwardHash(undefined);
    }
  }, [isAwardConfirmed, refetchLastWinner, refetchLastPrize, toast, address]);

  const handleActionClick = (action: 'deposit' | 'withdraw') => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setActiveAction(action);
    setDepositStep('idle');
    setWithdrawStep('idle');
    setIsRightStackOpen(true);
  };

  // Track approval step
  useEffect(() => {
    console.log('Approval step tracking:', {
      isApproving,
      isApprovalConfirmed,
      depositStep,
    });

    if (isApproving) {
      setDepositStep('approving');
    }

    if (
      isApprovalConfirmed &&
      (depositStep === 'approving' || depositStep === 'idle')
    ) {
      setDepositStep('approved');
    }
  }, [isApproving, isApprovalConfirmed, depositStep]);

  // Track deposit step
  useEffect(() => {
    console.log('Deposit step tracking:', {
      isDepositing,
      isConfirmingDeposit,
      depositStep,
    });

    if (
      (isDepositing || isConfirmingDeposit) &&
      (depositStep === 'approved' || depositStep === 'idle')
    ) {
      setDepositStep('depositing');
    }
  }, [isDepositing, isConfirmingDeposit, depositStep]);

  // Debug: Log all step changes
  useEffect(() => {
    console.log('Step changed to:', depositStep);
  }, [depositStep]);

  // Track withdraw step
  useEffect(() => {
    console.log('Withdraw step tracking:', {
      isWithdrawing,
      isConfirmingWithdraw,
      withdrawStep,
    });

    if ((isWithdrawing || isConfirmingWithdraw) && withdrawStep === 'idle') {
      setWithdrawStep('withdrawing');
    }
  }, [isWithdrawing, isConfirmingWithdraw, withdrawStep]);

  // Debug: Log all withdraw step changes
  useEffect(() => {
    console.log('Withdraw step changed to:', withdrawStep);
  }, [withdrawStep]);

  // Auto focus/select amount input when opening the modal
  useEffect(() => {
    if (isRightStackOpen) {
      const t = setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus();
          amountInputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isRightStackOpen, activeAction]);

  const closeRightStack = () => {
    setIsRightStackOpen(false);
    setAmount('');
    setDepositStep('idle');
    setWithdrawStep('idle');
  };

  const handleConfirm = async () => {
    if (!isConnected || !isSupportedNetwork || !isAddress(contractAddress))
      return;
    if (parsedAmount === 0n) return;

    setIsProcessing(true);

    try {
      if (activeAction === 'deposit') {
        if (allowance < parsedAmount) {
          setPendingDepositAmount(parsedAmount);
          autoDepositTriggeredRef.current = false;
          setDepositStep('approving');
          approve({
            address: currentTokenAddress,
            abi: usdcAbi,
            functionName: 'approve',
            args: [contractAddress, parsedAmount],
          });
        } else {
          setPendingDepositAmount(undefined);
          setDepositStep('depositing');
          deposit({
            address: contractAddress,
            abi: flarePublicGoodsAbi,
            functionName: 'deposit',
            args: [parsedAmount],
          });
        }
      } else {
        // withdraw
        setWithdrawStep('withdrawing');
        withdrawAsync({
          address: contractAddress,
          abi: flarePublicGoodsAbi,
          functionName: 'withdraw',
          args: [parsedAmount],
        })
          .then((hash) => {
            console.log('Withdraw hash received:', hash);
            setWithdrawHash(hash);
          })
          .catch((error) => {
            console.error('Withdraw failed:', error);
            setWithdrawStep('idle');
          });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isAmountValid = amount && parseFloat(amount) > 0;
  const canWithdraw = parseFloat(amount) <= userPSLBalance;
  const isBusy =
    isApproving ||
    isDepositing ||
    isConfirmingApproval ||
    isConfirmingDeposit ||
    isWithdrawing ||
    isConfirmingWithdraw;
  const isTryLuckBusy = isAwarding || isConfirmingAward;

  return (
    <div className='min-h-screen bg-background p-4 md:p-8'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Network Status */}
        {isConnected && !isSupportedNetwork && (
          <div className='p-4 rounded-lg border border-warning/50 bg-warning/10 text-warning'>
            <div className='flex items-center gap-3'>
              <AlertCircle className='h-5 w-5' />
              <p className='font-medium'>Network not supported</p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-center space-y-4 py-8'
        >
          <h1 className='text-4xl md:text-6xl font-bold text-foreground'>
            Fund the Future of Flare
          </h1>
          <p className='text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto'>
            Support open-source developers building on Flare through transparent, automated, and fair public goods funding
          </p>
          <div className='flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>🔥</span>
              <span>Powered by FTSO v2</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>🎲</span>
              <span>Secure Random Selection</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>📊</span>
              <span>GitHub-Verified Projects</span>
            </div>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <Card className='bg-card border-border'>
          <CardContent className='p-6 md:p-8'>
            <h2 className='text-2xl md:text-3xl font-bold text-foreground mb-6 text-center'>
              How It Works
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* Step 1 */}
              <div className='text-center space-y-3'>
                <div className='text-4xl mb-2'>💰</div>
                <h3 className='text-lg font-semibold text-foreground'>1. Deposit FXRP</h3>
                <p className='text-sm text-muted-foreground'>
                  Deposit Mock FXRP tokens to the pool. Get free test tokens from the faucet to try it out!
                </p>
              </div>

              {/* Step 2 */}
              <div className='text-center space-y-3'>
                <div className='text-4xl mb-2'>🎯</div>
                <h3 className='text-lg font-semibold text-foreground'>2. Automated Distribution</h3>
                <p className='text-sm text-muted-foreground'>
                  Funds are allocated to verified developers using Flare's secure randomness and FTSO price feeds for fair, transparent distribution.
                </p>
              </div>

              {/* Step 3 */}
              <div className='text-center space-y-3'>
                <div className='text-4xl mb-2'>✨</div>
                <h3 className='text-lg font-semibold text-foreground'>3. Track Impact</h3>
                <p className='text-sm text-muted-foreground'>
                  Watch your contribution support quality open-source projects. All allocations are transparent and on-chain.
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className='mt-8 pt-6 border-t border-border'>
              <h3 className='text-lg font-semibold text-foreground mb-4 text-center'>Why Flare Public Goods?</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='flex items-start gap-3'>
                  <span className='text-success text-xl'>✓</span>
                  <div>
                    <strong className='text-foreground'>Passive Impact Investment</strong>
                    <p className='text-muted-foreground'>Set it and forget it - funds allocate automatically</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-success text-xl'>✓</span>
                  <div>
                    <strong className='text-foreground'>Provably Fair</strong>
                    <p className='text-muted-foreground'>Flare's on-chain randomness ensures unbiased selection</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-success text-xl'>✓</span>
                  <div>
                    <strong className='text-foreground'>Price-Weighted Allocation</strong>
                    <p className='text-muted-foreground'>Higher FLR prices = more funding to developers</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-success text-xl'>✓</span>
                  <div>
                    <strong className='text-foreground'>GitHub Integration</strong>
                    <p className='text-muted-foreground'>Only verified, quality projects receive funding</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Feeds */}
        <PriceFeedDashboard
          contractAddress={contractAddress as `0x${string}`}
          contractAbi={flarePublicGoodsAbi}
        />

        {/* Faucet */}
        <FXRPFaucet />

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Your Deposit */}
          <Card className='bg-card border-border'>
            <CardContent className='p-6'>
              <p className='text-sm text-muted-foreground mb-2'>Your Deposit</p>
              <div className='text-4xl font-bold text-foreground'>
                {userPSLBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>
              <p className='text-sm text-muted-foreground mt-1'>FXRP</p>
            </CardContent>
          </Card>

          {/* Total Deposits */}
          <Card className='bg-card border-border'>
            <CardContent className='p-6'>
              <p className='text-sm text-muted-foreground mb-2'>Total Dev Funding</p>
              <div className='text-4xl font-bold text-success'>
                {totalAssetsDisplay}
              </div>
              <p className='text-sm text-muted-foreground mt-1'>FXRP</p>
            </CardContent>
          </Card>

          {/* Verified Developers */}
          <Card className='bg-card border-border'>
            <CardContent className='p-6'>
              <p className='text-sm text-muted-foreground mb-2'>Verified Developers</p>
              <div className='text-4xl font-bold text-primary'>
                {verifiedDevelopers}
              </div>
              <p className='text-sm text-muted-foreground mt-1'>Projects funded</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Button
            onClick={() => handleActionClick('deposit')}
            className='h-14 text-lg font-semibold bg-primary hover:bg-primary/90'
          >
            Deposit FXRP
          </Button>

          <Button
            onClick={() =>
              tryAwardPrize({
                address: contractAddress,
                abi: flarePublicGoodsAbi,
                functionName: 'allocateFunds',
              })
            }
            disabled={!isConnected || !isSupportedNetwork || isTryLuckBusy}
            variant='outline'
            className='h-14 text-lg font-semibold'
          >
            {isTryLuckBusy ? 'Processing…' : 'Allocate Funds to Developer'}
          </Button>
        </div>

        {/* Award Result */}
        {awardOutcome && (
          <Card className='bg-card border-border'>
            <CardContent className='p-6'>
              {awardOutcome === 'pending' && (
                <div className='text-center'>
                  <div className='text-2xl mb-2'>🔄</div>
                  <div className='text-sm font-medium'>Processing allocation...</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    Waiting for secure randomness verification
                  </div>
                </div>
              )}
              {awardOutcome === 'success' && awardResult?.winner && awardResult?.amount && (
                <div className='text-center'>
                  <div className='text-2xl mb-2'>💚</div>
                  <div className='text-sm font-medium text-success'>Funding Allocated!</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {formatUnits(awardResult.amount, 6)} USDC allocated to{' '}
                    <span className='font-mono'>
                      {awardResult.winner.slice(0, 6)}...{awardResult.winner.slice(-4)}
                    </span>
                  </div>
                </div>
              )}
              {awardOutcome === 'no-prize' && (
                <div className='text-center'>
                  <div className='text-2xl mb-2'>⏳</div>
                  <div className='text-sm font-medium'>No Allocation This Round</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    Not enough yield generated yet. Try again soon!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isRightStackOpen && (
          <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className='absolute inset-0 bg-black/80'
              onClick={closeRightStack}
            />

            {/* Modal Content */}
            <motion.div
              className='relative w-full max-w-md bg-card border border-border rounded-lg shadow-elevated'
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className='flex items-center justify-between p-6 border-b border-border'>
                <h2 className='text-xl font-bold text-foreground'>
                  {activeAction === 'deposit' ? 'Deposit FXRP' : 'Withdraw FXRP'}
                </h2>
                <button
                  onClick={closeRightStack}
                  className='p-2 hover:bg-secondary rounded-lg transition-colors'
                >
                  <X className='w-5 h-5 text-muted-foreground' />
                </button>
              </div>

              {/* Content */}
              <div className='p-6 space-y-6 max-h-[60vh] overflow-y-auto'>
                {/* Amount Input */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-foreground'>
                    Amount
                  </label>
                  <div className='relative'>
                    <Input
                      type='number'
                      placeholder='0.00'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      ref={amountInputRef}
                      className='text-2xl font-bold h-14 bg-secondary border-border focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    />
                    <div className='absolute right-4 top-1/2 transform -translate-y-1/2 text-right'>
                      <div className='text-xs text-muted-foreground'>Balance</div>
                      <div className='text-sm font-medium text-foreground'>
                        {activeAction === 'deposit'
                          ? walletUSDCDisplay.toLocaleString()
                          : userPSLBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                {activeAction === 'deposit' && (
                  <div className='p-4 rounded-lg bg-secondary border border-border'>
                    <p className='text-sm text-muted-foreground'>
                      Deposit FXRP to fund developers building on Flare. Allocations are made weekly using Flare's secure random number generator.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <Button
                  onClick={handleConfirm}
                  disabled={
                    !isAmountValid ||
                    (activeAction === 'withdraw' && !canWithdraw) ||
                    isProcessing
                  }
                  className='w-full h-12 text-base font-semibold'
                >
                  {isProcessing
                    ? 'Processing...'
                    : `Confirm ${activeAction === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                </Button>

                {/* Step Indicators */}
                {activeAction === 'deposit' && depositStep !== 'idle' && (
                  <div className='space-y-2 mt-4'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      {depositStep === 'approving' ? (
                        <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
                      ) : depositStep !== 'idle' ? (
                        <span className='text-success'>✓</span>
                      ) : null}
                      <span>Approve spending</span>
                    </div>
                    {depositStep === 'depositing' && (
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
                        <span>Executing deposit...</span>
                      </div>
                    )}
                  </div>
                )}

                {activeAction === 'withdraw' && withdrawStep === 'withdrawing' && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground mt-4'>
                    <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
                    <span>Executing withdrawal...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PSLHome;
