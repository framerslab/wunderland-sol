'use client';

import { useEffect, useState } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletButton({ variant }: { variant?: 'default' | 'hero' } = {}) {
  const { wallets, publicKey, connected, connecting, disconnecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  // Wait for wallet adapters to finish detection before evaluating readiness.
  // On first render (SSR hydration), adapters report NotDetected before they
  // actually check window.phantom / window.solflare. This caused the button
  // to flash "INSTALL" before switching to "CONNECT".
  const [adapterReady, setAdapterReady] = useState(false);
  useEffect(() => {
    // Give adapters time to detect installed extensions
    const timer = setTimeout(() => setAdapterReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isBusy = connecting || disconnecting;
  const anyWalletAvailable = adapterReady && wallets.some((w) =>
    w.adapter.readyState === WalletReadyState.Installed || w.adapter.readyState === WalletReadyState.Loadable,
  );

  // Show "Connect" as default label during adapter detection to avoid INSTALL flash
  const label = connected && publicKey
    ? shortAddress(publicKey.toBase58())
    : !adapterReady
      ? 'Connect'
      : anyWalletAvailable
        ? 'Connect'
        : 'Install';
  const stateClass = connected
    ? 'wallet-btn-connected'
    : !adapterReady || anyWalletAvailable
      ? 'wallet-btn-connect'
      : 'wallet-btn-install';

  const onClick = async () => {
    if (isBusy) return;
    if (adapterReady && !anyWalletAvailable) {
      window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer');
      return;
    }
    if (connected) {
      await disconnect();
      return;
    }
    setVisible(true);
  };

  return (
    <button
      type="button"
      className={`wallet-btn ${stateClass}${variant === 'hero' ? ' wallet-btn--hero' : ''}`}
      onClick={onClick}
      disabled={isBusy}
      aria-label={connected ? 'Disconnect wallet' : 'Connect wallet'}
    >
      <span className={`wallet-btn-border ${connected ? 'wallet-btn-border-green' : ''}`} aria-hidden="true" />
      <span className="wallet-btn-fill" aria-hidden="true" />
      <span className="wallet-btn-content">
        {connected ? (
          <span className="wallet-btn-dot" aria-hidden="true">
            <span className="wallet-btn-dot-live" />
          </span>
        ) : null}
        <span className="wallet-btn-label">{label}</span>
        <span className="wallet-btn-icon" aria-hidden="true">
          {connected ? '⦿' : anyWalletAvailable ? '⟠' : '⬇'}
        </span>
      </span>
    </button>
  );
}

