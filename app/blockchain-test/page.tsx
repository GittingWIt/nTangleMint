'use client'

import { useState } from 'react'
import { useWallet } from '@/contexts/wallet-context'

export default function BlockchainTestPage() {
  const { wallet } = useWallet()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [faucetTxId, setFaucetTxId] = useState(
    '706a228a2ef85fdbf26e604a5db1fa16cc0a6b2d7ad2b40116c6ad2aeed5bb74'
  )

  const testBalance = async () => {
    if (!wallet?.publicAddress) {
      console.log('[Test] No wallet address found')
      return
    }

    setLoading(true)
    const results: any[] = []

    try {
      // Test 1: Get balance via our API
      console.log('[Test] === Testing Balance Endpoint ===')
      console.log(`[Test] Address: ${wallet.publicAddress}`)

      results.push({
        test: 'Calling /api/external/balance',
        timestamp: new Date().toISOString(),
      })

      const balanceResponse = await fetch(
        `/api/external/balance?address=${encodeURIComponent(wallet.publicAddress)}`
      )

      const balanceData = await balanceResponse.json()
      console.log('[Test] Balance API Response:', balanceData)

      results.push({
        test: 'Balance API Response',
        status: balanceResponse.status,
        data: balanceData,
        timestamp: new Date().toISOString(),
      })

      // Test 2: Direct WhatsOnChain balance query
      console.log('[Test] === Direct WhatsOnChain Balance Query ===')
      const wocBalanceUrl = `https://api.whatsonchain.com/v1/bsv/test/address/${wallet.publicAddress}/balance`
      console.log(`[Test] URL: ${wocBalanceUrl}`)

      const wocBalanceResponse = await fetch(wocBalanceUrl)
      const wocBalanceData = await wocBalanceResponse.json()
      console.log('[Test] WhatsOnChain Balance Response:', wocBalanceData)

      results.push({
        test: 'WhatsOnChain Direct Balance Query',
        url: wocBalanceUrl,
        status: wocBalanceResponse.status,
        data: wocBalanceData,
        timestamp: new Date().toISOString(),
      })

      // Test 3: WhatsOnChain UTXOs
      console.log('[Test] === WhatsOnChain UTXO Query ===')
      const wocUtxoUrl = `https://api.whatsonchain.com/v1/bsv/test/address/${wallet.publicAddress}/unspent`
      console.log(`[Test] URL: ${wocUtxoUrl}`)

      const wocUtxoResponse = await fetch(wocUtxoUrl)
      const wocUtxoData = await wocUtxoResponse.json()
      console.log('[Test] WhatsOnChain UTXO Response:', wocUtxoData)

      results.push({
        test: 'WhatsOnChain Direct UTXO Query',
        url: wocUtxoUrl,
        status: wocUtxoResponse.status,
        data: wocUtxoData,
        timestamp: new Date().toISOString(),
      })

      // Test 4: Our UTXO endpoint
      console.log('[Test] === Testing UTXO Endpoint ===')
      const utxoResponse = await fetch(
        `/api/external/utxos?address=${encodeURIComponent(wallet.publicAddress)}`
      )
      const utxoData = await utxoResponse.json()
      console.log('[Test] UTXO API Response:', utxoData)

      results.push({
        test: 'UTXO API Response',
        status: utxoResponse.status,
        data: utxoData,
        timestamp: new Date().toISOString(),
      })

      // Test 5: Wallet context balance
      console.log('[Test] === Wallet Context ===')
      console.log('[Test] Wallet Balance from Context:', wallet.balance)
      results.push({
        test: 'Wallet Context Balance',
        data: wallet.balance,
        timestamp: new Date().toISOString(),
      })

      setTestResults(results)
      console.log('[Test] All tests completed')
    } catch (error) {
      console.error('[Test] Error during testing:', error)
      results.push({
        test: 'Error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
      setTestResults(results)
    } finally {
      setLoading(false)
    }
  }

  const testFaucetTransaction = async () => {
    if (!faucetTxId) {
      console.log('[Test] No transaction ID provided')
      return
    }

    setLoading(true)
    const results: any[] = []

    try {
      console.log('[Test] === Verifying Faucet Transaction ===')
      console.log(`[Test] Transaction ID: ${faucetTxId}`)

      const txUrl = `https://api.whatsonchain.com/v1/bsv/test/tx/${faucetTxId}`
      const txResponse = await fetch(txUrl)
      const txData = await txResponse.json()

      console.log('[Test] Transaction Response:', txData)

      results.push({
        test: 'Faucet Transaction Details',
        url: txUrl,
        status: txResponse.status,
        data: txData,
        timestamp: new Date().toISOString(),
      })

      // Check outputs to find recipient address
      if (txData.vout && wallet?.publicAddress) {
        console.log('[Test] Checking transaction outputs...')
        let foundOutputToWallet = false

        txData.vout.forEach((output: any, idx: number) => {
          const addresses = output.scriptPubKey?.addresses || []
          const outputAmount = output.value

          console.log(
            `[Test] Output ${idx}: ${outputAmount} satoshis to ${addresses.join(', ')}`
          )

          if (addresses.includes(wallet.publicAddress)) {
            foundOutputToWallet = true
            console.log('[Test] ✓ Found output to wallet address!')
          }
        })

        results.push({
          test: 'Output Analysis',
          walletAddress: wallet.publicAddress,
          transactionOutputs: txData.vout.map((o: any) => ({
            satoshis: o.value,
            addresses: o.scriptPubKey?.addresses || [],
          })),
          foundOutputToWallet: foundOutputToWallet,
          timestamp: new Date().toISOString(),
        })
      }

      setTestResults(results)
    } catch (error) {
      console.error('[Test] Error checking transaction:', error)
      results.push({
        test: 'Error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
      setTestResults(results)
    } finally {
      setLoading(false)
    }
  }

  const compareAddresses = () => {
    const faucetAddress = 'n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg'
    const walletAddress = wallet?.publicAddress || ''

    console.log('[Test] === Address Comparison ===')
    console.log(`[Test] Faucet Address:  ${faucetAddress}`)
    console.log(`[Test] Wallet Address:  ${walletAddress}`)
    console.log(`[Test] Match: ${faucetAddress === walletAddress}`)
    console.log(`[Test] Faucet length: ${faucetAddress.length}`)
    console.log(`[Test] Wallet length: ${walletAddress.length}`)

    // Character-by-character comparison
    for (let i = 0; i < Math.max(faucetAddress.length, walletAddress.length); i++) {
      if (faucetAddress[i] !== walletAddress[i]) {
        console.log(
          `[Test] Difference at position ${i}: "${faucetAddress[i]}" vs "${walletAddress[i]}"`
        )
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Blockchain Debug Test</h1>
        <p className="text-slate-400 mb-8">
          Test WhatsOnChain API calls and wallet balance retrieval
        </p>

        <div className="mb-8">
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Info</h2>
            {wallet ? (
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Address:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-900 px-3 py-2 rounded flex-1 break-all">
                      {wallet.publicAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.publicAddress)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Current Balance:</p>
                  <p className="text-2xl font-mono">
                    {wallet.balance?.total || 0} satoshis
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-red-400">No wallet connected</p>
            )}
          </div>

          <button
            onClick={testBalance}
            disabled={loading || !wallet}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            {loading ? 'Testing...' : 'Run All Tests'}
          </button>
        </div>

        <div className="mb-8 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Faucet Transaction Verification</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Transaction ID:</label>
              <input
                type="text"
                value={faucetTxId}
                onChange={(e) => setFaucetTxId(e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-700 font-mono text-sm"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={testFaucetTransaction}
                disabled={loading || !faucetTxId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? 'Checking...' : 'Check Transaction'}
              </button>
              <button
                onClick={compareAddresses}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Compare Addresses
              </button>
            </div>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Test Results</h2>
            {testResults.map((result, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{result.test}</h3>
                  <span className="text-xs text-slate-400">{result.timestamp}</span>
                </div>

                {result.error && (
                  <div className="bg-red-900 text-red-200 p-3 rounded mb-4">
                    {result.error}
                  </div>
                )}

                {result.status && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-400">
                      Status: <span className="text-white font-mono">{result.status}</span>
                    </p>
                  </div>
                )}

                {result.url && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-400 mb-1">URL:</p>
                    <code className="bg-slate-900 px-3 py-2 rounded text-xs break-all block">
                      {result.url}
                    </code>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">Response Data:</p>
                  <pre className="bg-slate-900 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                  className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
                >
                  Copy JSON
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}