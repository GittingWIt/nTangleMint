import React, { useState } from 'react';
import { createWallet, formatWalletInfo } from '@/bsvUtilities/bsvWallet';
import { Button } from "@/components/ui/button"

const WalletComponent: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<string[]>([]);

  const handleCreateWallet = () => {
    const wallet = createWallet();
    const formattedInfo = formatWalletInfo(wallet);
    setWalletInfo(formattedInfo);
  };

  return (
    <div>
      {walletInfo.length === 0 ? (
        <Button onClick={handleCreateWallet}>Create Wallet</Button>
      ) : (
        <ul className="list-disc list-inside">
          {walletInfo.map((info, index) => (
            <li key={index} className="text-sm text-gray-600">{info}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WalletComponent;