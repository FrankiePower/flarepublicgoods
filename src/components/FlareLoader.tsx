import React from 'react';

interface FlareLoaderProps {
  isLoading: boolean;
}

const FlareLoader: React.FC<FlareLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-foreground mb-4'>
          Flare Public Goods
        </h2>

        <div className='flex justify-center space-x-2 mb-4'>
          <div className='w-2 h-2 bg-primary rounded-full' />
          <div className='w-2 h-2 bg-primary rounded-full' />
          <div className='w-2 h-2 bg-primary rounded-full' />
        </div>

        <p className='text-muted-foreground text-sm'>
          Loading...
        </p>
      </div>
    </div>
  );
};

export default FlareLoader;
