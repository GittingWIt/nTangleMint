'use client'

import { useWallet } from '@/contexts/wallet-context'
import { useState } from 'react'

export default function WalletDiagnosticsPage() {
  const { wallet } = useWallet()
  const [expanded, setExpanded] = useState(false)
  const faucetAddress = 'n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg'

  const addressMatch = wallet?.publicAddress === faucetAddress
  const addressLength = wallet?.publicAddress?.length || 0
  const faucetLength = faucetAddress.length

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Wallet Context Diagnostics</h1>
        <p className="text-slate-400 mb-8">Compare wallet address with faucet address</p>

        {!wallet ? (
          <div className="bg-red-900 text-red-200 p-6 rounded-lg mb-8">
            <p className="font-bold">ERROR: No wallet loaded in context</p>
            <p className="text-sm mt-2">Create a wallet first before running diagnostics.</p>
          </div>
        ) : (
          <>
            {/* Faucet Address */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Faucet Address (Expected)</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-slate-400 text-sm">Address:</p>
                  <code className="bg-slate-900 px-3 py-2 rounded block break-all font-mono text-sm">
                    {faucetAddress}
                  </code>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Length: {faucetLength} chars</p>
                </div>
              </div>
            </div>

            {/* Wallet Address */}
            <div className={`rounded-lg p-6 mb-6 border-2 ${addressMatch ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'}`}>
              <h2 className="text-xl font-semibold mb-4">Wallet Context Address (Actual)</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-slate-400 text-sm">Address:</p>
                  <code className="bg-slate-900 px-3 py-2 rounded block break-all font-mono text-sm">
                    {wallet.publicAddress}
                  </code>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Length: {addressLength} chars</p>
                </div>
                <div className="mt-4">
                  {addressMatch ? (
                    <p className="text-green-300 font-semibold">✓ ADDRESSES MATCH</p>
                  ) : (
                    <div>
                      <p className="text-red-300 font-semibold mb-2">✗ ADDRESSES DO NOT MATCH</p>
                      <details className="text-sm text-red-200 cursor-pointer">
                        <summary className="mb-2">Character-by-character comparison</summary>
                        <div className="bg-slate-900 p-3 rounded font-mono text-xs max-h-64 overflow-auto">
                          {Array.from({ length: Math.max(faucetLength, addressLength) }).map((_, i) => {
                            const faucetChar = faucetAddress[i] || '∅'
                            const walletChar = wallet.publicAddress[i] || '∅'
                            const match = faucetChar === walletChar
                            return (
                              <div key={i} className={match ? 'text-green-400' : 'text-red-400'}>
                                <span>Position {i}: </span>
                                <span className="font-bold">'{faucetChar}'</span>
                                <span> vs </span>
                                <span className="font-bold">'{walletChar}'</span>
                                {!match && <span> ← MISMATCH</span>}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Wallet Object */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-lg font-semibold mb-4 cursor-pointer hover:text-blue-400 transition"
              >
                {expanded ? '▼' : '▶'} Full Wallet Context Data
              </button>
              
              {expanded && (
                <pre className="bg-slate-900 p-4 rounded overflow-auto text-xs text-slate-300">
                  {JSON.stringify(wallet, null, 2)}
                </pre>
              )}
            </div>

            {/* Analysis */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Analysis</h2>
              <div className="space-y-3 text-sm">
                {addressMatch ? (
                  <div className="bg-green-900 border border-green-500 p-3 rounded">
                    <p className="font-semibold text-green-300">✓ Addresses Match</p>
                    <p className="text-green-200">The wallet address matches the faucet address. The issue is NOT an address mismatch.</p>
                  </div>
                ) : (
                  <div className="bg-red-900 border border-red-500 p-3 rounded">
                    <p className="font-semibold text-red-300">✗ Address Mismatch Found</p>
                    <p className="text-red-200">The wallet address does NOT match the faucet address. This is the root cause:</p>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>The balance API queries the wallet's publicAddress</li>
                      <li>But the faucet sent 55,000 satoshis to {faucetAddress}</li>
                      <li>These are different addresses, so the balance check returns zero</li>
                    </ul>
                  </div>
                )}

                {wallet.balance && (
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="font-semibold">Current Balance in Wallet Context:</p>
                    <p className="text-slate-300">{wallet.balance.total} satoshis (confirmed: {wallet.balance.confirmed}, unconfirmed: {wallet.balance.unconfirmed})</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Console Debug Button */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Console Debug</h2>
          <button
            onClick={() => {
              console.log('[DIAG] Wallet Address:', wallet?.publicAddress)
              console.log('[DIAG] Faucet Address:', faucetAddress)
              console.log('[DIAG] Match:', wallet?.publicAddress === faucetAddress)
              console.log('[DIAG] Full Wallet:', wallet)
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Log Wallet to Console
          </button>
          <p className="text-sm text-slate-400 mt-3">Click to output wallet data to browser console (F12)</p>
        </div>
      </div>
    </div>
  )
}