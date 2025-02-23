import { Program, CustomerActivity } from './program-utils';
import { WalletData } from '@/types';

const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return null;
};

export function initTestData() {
  const localStorage = getLocalStorage();
  if (!localStorage) return;

  // Initialize global programs
  const globalPrograms: Program[] = [
    {
      id: '1',
      name: "Coffee Lovers Rewards",
      business: "Brew Haven",
      type: "punch-card",
      category: "Food & Beverage",
      description: "Earn a free coffee after 10 purchases",
      participants: [],
      rewards_claimed: 0,
      transactions: 0,
      created_at: new Date().toISOString(),
      merchantId: 'merchant1',
      nftDesign: {
        layers: [
          {
            type: 'gradient',
            content: 'linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%)'
          },
          {
            type: 'icon',
            content: '☕',
            opacity: 0.2,
            blendMode: 'overlay'
          }
        ],
        aspectRatio: '2:1',
        borderRadius: '0.5rem',
        animation: {
          type: 'pulse',
          duration: 2
        }
      }
    },
    // Add more test programs here
  ];

  localStorage.setItem('globalPrograms', JSON.stringify(globalPrograms));

  // Initialize test wallets
  const testWallets: { [key: string]: WalletData } = {
    'merchant1': {
      publicAddress: 'merchant1',
      privateKey: 'merchant1_private_key',
      type: 'merchant'
    },
    'user1': {
      publicAddress: 'user1',
      privateKey: 'user1_private_key',
      type: 'user'
    },
    // Add more test wallets here
  };

  Object.entries(testWallets).forEach(([address, walletData]) => {
    localStorage.setItem(`wallet_${address}`, JSON.stringify(walletData));
    
    if (walletData.type === 'merchant') {
      const merchantPrograms = globalPrograms.filter(p => p.merchantId === address);
      localStorage.setItem(`merchantPrograms_${address}`, JSON.stringify(merchantPrograms));
    } else if (walletData.type === 'user') {
      const userParticipation: CustomerActivity[] = [];
      localStorage.setItem(`userPrograms_${address}`, JSON.stringify(userParticipation));
    }
  });
}