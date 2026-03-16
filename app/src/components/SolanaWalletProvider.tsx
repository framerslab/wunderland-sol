'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

import { CLUSTER, SOLANA_RPC } from '@/lib/solana';
import { TestKeypairWalletAdapter, TestKeypairWalletName } from '@/lib/e2e/TestKeypairWalletAdapter';

function solflareNetwork(cluster: typeof CLUSTER): WalletAdapterNetwork {
  if (cluster === 'mainnet-beta') return WalletAdapterNetwork.Mainnet;
  return WalletAdapterNetwork.Devnet;
}

function E2EWalletAutoSelect({ enabled }: { enabled: boolean }) {
  const { wallet, select } = useWallet();
  const didSelect = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (wallet?.adapter?.name === TestKeypairWalletName) return;
    if (didSelect.current) return;
    didSelect.current = true;
    select(TestKeypairWalletName);
  }, [enabled, select, wallet?.adapter?.name]);

  return null;
}

/**
 * Re-establish wallet connection on route changes.
 * After minting, navigating away and back can leave the adapter in a
 * disconnected state even though localStorage remembers the wallet.
 * This component detects navigation and attempts to reconnect.
 */
function WalletReconnectOnNavigation() {
  const pathname = usePathname();
  const { wallet, connected, connecting, connect } = useWallet();
  const prevPathname = useRef(pathname);

  const attemptReconnect = useCallback(async () => {
    if (connected || connecting || !wallet) return;
    try {
      await connect();
    } catch {
      // Wallet extension may not be ready yet — ignore silently
    }
  }, [connected, connecting, wallet, connect]);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // Small delay to let the adapter settle after navigation
      const timer = setTimeout(attemptReconnect, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, attemptReconnect]);

  // Also attempt reconnect on window focus (user coming back from Solflare tab)
  useEffect(() => {
    const onFocus = () => {
      if (!connected && !connecting && wallet) {
        setTimeout(attemptReconnect, 300);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [connected, connecting, wallet, attemptReconnect]);

  return null;
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = SOLANA_RPC;
  const e2eEnabled = process.env.NEXT_PUBLIC_E2E_WALLET === 'true';
  const e2eSecretKeyJson = process.env.NEXT_PUBLIC_E2E_WALLET_SECRET_KEY_JSON || '';
  const wallets = useMemo(
    () =>
      e2eEnabled
        ? [new TestKeypairWalletAdapter(e2eSecretKeyJson)]
        : [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network: solflareNetwork(CLUSTER) }),
          ],
    [e2eEnabled, e2eSecretKeyJson],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <E2EWalletAutoSelect enabled={e2eEnabled} />
          <WalletReconnectOnNavigation />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
