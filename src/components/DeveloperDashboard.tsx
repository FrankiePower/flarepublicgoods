import React, { useState } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatUnits } from 'viem';
import { useToast } from './ui/use-toast';

interface DeveloperDashboardProps {
  contractAddress: `0x${string}`;
  contractAbi: any;
}

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  contractAddress,
  contractAbi,
}) => {
  const { address, chain, isConnected } = useAccount();
  const { toast } = useToast();
  const [githubRepo, setGithubRepo] = useState('');
  const [registerHash, setRegisterHash] = useState<`0x${string}` | undefined>();

  // Read developer data
  const { data: developerData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getDeveloper',
    args: [address],
    chainId: chain?.id || 114,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Read stats
  const { data: totalDevsData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getDeveloperCount',
    chainId: chain?.id || 114,
  });

  const { data: verifiedDevsData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getVerifiedDeveloperCount',
    chainId: chain?.id || 114,
  });

  const { data: lastFundedDevData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'lastFundedDev',
    chainId: chain?.id || 114,
  });

  const { data: lastAllocationAmountData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'lastAllocationAmount',
    chainId: chain?.id || 114,
  });

  const { data: nextAllocationData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'nextAllocationTimestamp',
    chainId: chain?.id || 114,
  });

  // Register developer
  const { writeContract: registerDeveloper, isPending: isRegistering } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setRegisterHash(hash);
        toast({
          title: '✅ Registration Submitted',
          description: 'Waiting for confirmation...',
        });
      },
      onError: (error) => {
        toast({
          title: '❌ Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  });

  // Wait for registration
  const { isSuccess: isRegistered } = useWaitForTransactionReceipt({
    hash: registerHash,
  });

  React.useEffect(() => {
    if (isRegistered) {
      toast({
        title: '🎉 Successfully Registered!',
        description: 'Your GitHub repo will be verified soon.',
      });
      setGithubRepo('');
      setRegisterHash(undefined);
    }
  }, [isRegistered, toast]);

  const handleRegister = () => {
    if (!githubRepo) {
      toast({
        title: '⚠️ Invalid Input',
        description: 'Please enter a valid GitHub repo (e.g., owner/repo)',
        variant: 'destructive',
      });
      return;
    }

    registerDeveloper({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'registerDeveloper',
      args: [githubRepo],
    });
  };

  const isDevRegistered = developerData && Array.isArray(developerData) && developerData[0] !== '0x0000000000000000000000000000000000000000';
  const devWallet = isDevRegistered ? developerData[0] as string : '';
  const devRepo = isDevRegistered ? developerData[1] as string : '';
  const devTotalFunded = isDevRegistered ? developerData[2] as bigint : 0n;
  const devStars = isDevRegistered ? Number(developerData[3] as bigint) : 0;
  const devVerified = isDevRegistered ? developerData[4] as boolean : false;

  const formatTimeUntilAllocation = (): string => {
    if (!nextAllocationData) return 'Unknown';
    const nextTime = Number(nextAllocationData as bigint) * 1000;
    const now = Date.now();
    const diff = nextTime - now;

    if (diff <= 0) return 'Now!';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-foreground'>Developer Dashboard</h2>
        <p className='text-sm text-muted-foreground'>
          Register your GitHub project to receive funding
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='text-sm text-muted-foreground mb-1'>Total Developers</div>
            <div className='text-3xl font-bold text-foreground'>
              {totalDevsData ? Number(totalDevsData as bigint) : 0}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='text-sm text-muted-foreground mb-1'>Verified</div>
            <div className='text-3xl font-bold text-success'>
              {verifiedDevsData ? Number(verifiedDevsData as bigint) : 0}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='text-sm text-muted-foreground mb-1'>Last Funded</div>
            <div className='text-xl font-bold text-primary'>
              {lastFundedDevData && lastAllocationAmountData
                ? `${formatUnits(lastAllocationAmountData as bigint, 18)} FXRP`
                : 'None yet'}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='text-sm text-muted-foreground mb-1'>Next Allocation</div>
            <div className='text-2xl font-bold text-foreground'>
              {formatTimeUntilAllocation()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration or Profile */}
      {!isDevRegistered ? (
        <Card className='bg-card border-border'>
          <CardContent className='p-6'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
              Register as Developer
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-foreground'>
                  GitHub Repository
                </label>
                <Input
                  type='text'
                  placeholder='owner/repo (e.g., flare-foundation/flare-smart-contracts)'
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className='mt-2'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Your repo will be verified using GitHub's API via FDC JsonApi attestation
                </p>
              </div>
              <Button
                onClick={handleRegister}
                disabled={!isConnected || isRegistering || !githubRepo}
                className='w-full'
              >
                {isRegistering ? 'Registering...' : 'Register Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className='bg-card border-border'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-foreground'>Your Project</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                devVerified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
              }`}>
                {devVerified ? '✓ Verified' : '⏳ Pending Verification'}
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <div className='text-sm text-muted-foreground'>GitHub Repository</div>
                <div className='text-lg font-medium text-foreground'>
                  <a
                    href={`https://github.com/${devRepo}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:text-primary transition-colors'
                  >
                    {devRepo} →
                  </a>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>GitHub Stars</div>
                  <div className='text-2xl font-bold text-foreground'>⭐ {devStars}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Total Funded</div>
                  <div className='text-2xl font-bold text-success'>
                    {formatUnits(devTotalFunded, 18)} FXRP
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Status</div>
                  <div className='text-2xl font-bold text-foreground'>
                    {devVerified ? '✅' : '⏳'}
                  </div>
                </div>
              </div>

              {!devVerified && (
                <div className='p-4 rounded-lg bg-warning/10 border border-warning/20'>
                  <p className='text-sm text-warning'>
                    <strong>Pending Verification:</strong> Your project needs at least 100 GitHub stars to be eligible for funding.
                    Once verified, you'll be eligible for random allocation every week!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className='bg-card border-border'>
        <CardContent className='p-6'>
          <h3 className='text-lg font-semibold text-foreground mb-3'>
            How Developer Funding Works
          </h3>
          <div className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex items-start gap-3'>
              <span className='text-xl'>1️⃣</span>
              <div>
                <strong className='text-foreground'>Register:</strong> Submit your GitHub repo to register your project
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <span className='text-xl'>2️⃣</span>
              <div>
                <strong className='text-foreground'>Verification:</strong> FDC JsonApi verifies your GitHub stars (min 100 stars required)
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <span className='text-xl'>3️⃣</span>
              <div>
                <strong className='text-foreground'>Weekly Allocation:</strong> Flare's Secure Random selects one verified developer each week
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <span className='text-xl'>4️⃣</span>
              <div>
                <strong className='text-foreground'>Price-Weighted Funding:</strong> Allocation amount varies based on FLR/USD price from FTSO
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperDashboard;
