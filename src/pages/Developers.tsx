import React from 'react';
import { useAccount } from 'wagmi';
import { flarePublicGoodsAddress, flarePublicGoodsAbi, CONTRACTS } from '../contracts/FlarePublicGoods';
import DeveloperDashboard from '../components/DeveloperDashboard';

const Developers = () => {
  const { chain } = useAccount();

  const isSupportedNetwork = chain && CONTRACTS[chain.id as keyof typeof CONTRACTS];
  const targetChainId = isSupportedNetwork ? chain!.id : 114;
  const contractAddress = CONTRACTS[targetChainId as keyof typeof CONTRACTS]?.flarePublicGoods ?? flarePublicGoodsAddress;

  return (
    <div className='min-h-screen bg-background p-4 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        <DeveloperDashboard
          contractAddress={contractAddress as `0x${string}`}
          contractAbi={flarePublicGoodsAbi}
        />
      </div>
    </div>
  );
};

export default Developers;
