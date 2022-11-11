import { FC, useCallback, useEffect, useState } from 'react'
import { useReadOnlySunriseStake } from '../hooks/useSunriseStake'
import Spinner from '../components/Spinner'
import CarbonRecovered from '../components/CarbonRecovered'

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const client = useReadOnlySunriseStake()
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] =
      useState<number>()

  const updateBalances = useCallback(async () => {
    if (client == null) return
    setTreasuryBalanceLamports(await client.treasuryBalance())
  }, [client])

  useEffect((): void => {
    if (client == null) return
    updateBalances().catch(console.error)
  }, [updateBalances, client])

  return (
      <div className="w-full">
        {(client == null) && <Spinner />}
        <CarbonRecovered treasuryBalanceLamports={treasuryBalanceLamports ?? 0} />
      </div>
  )
}
