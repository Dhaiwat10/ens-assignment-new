import { ChainId } from '@pancakeswap/chains'
import { CHAINS } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'
import { useEnsAddress } from 'wagmi'
import { safeGetAddress } from 'utils'

const ENS_SUPPORT_CHAIN_IDS = CHAINS.filter((c) => c?.contracts && c.contracts?.ensUniversalResolver).map((c) => c.id)

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

export const useGetENSAddressByName = (ensNameOrAddress?: string, overrideChainId?: number) => {
  const { chainId: activeChainId } = useActiveChainId()
  const chainId = overrideChainId ?? activeChainId
  const ensSupported = useMemo(
    () => Boolean(chainId && ENS_SUPPORT_CHAIN_IDS.includes(chainId as (typeof ENS_SUPPORT_CHAIN_IDS)[number])),
    [chainId],
  )
  const { data: recipientENSAddress } = useEnsAddress({
    name: ensNameOrAddress,
    chainId,
    query: {
      enabled:
        typeof ensNameOrAddress !== 'undefined' &&
        (ENS_NAME_REGEX.test(ensNameOrAddress) || ADDRESS_REGEX.test(ensNameOrAddress)) &&
        chainId !== ChainId.BSC &&
        chainId !== ChainId.BSC_TESTNET &&
        ensSupported,
    },
  })
  // Return checksummed address if resolved, otherwise return undefined
  return useMemo(() => {
    if (!recipientENSAddress) return undefined
    return safeGetAddress(recipientENSAddress) || recipientENSAddress
  }, [recipientENSAddress])
}
