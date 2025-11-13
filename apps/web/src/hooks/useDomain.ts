import { ChainId } from '@pancakeswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useSidNameForAddress } from 'hooks/useSid'
import { useUnsNameForAddress } from 'hooks/useUns'
import { useMemo } from 'react'
import { Address } from 'viem'
import { useEnsAvatar, useEnsName } from 'wagmi'

export const useDomainNameForAddress = (address?: `0x${string}` | string, fetchData = true) => {
  const { chainId } = useActiveChainId()
  const { sidName, isLoading: isSidLoading } = useSidNameForAddress(address as Address, fetchData)
  const { unsName, isLoading: isUnsLoading } = useUnsNameForAddress(
    address as Address,
    fetchData && !sidName && !isSidLoading,
  )
  // Always resolve ENS names against Ethereum mainnet (works on all EVM chains)
  const { data: ensName, isLoading: isEnsLoading } = useEnsName({
    address: address as Address,
    chainId: ChainId.ETHEREUM, // Always resolve against Ethereum mainnet
    query: {
      enabled: Boolean(address && fetchData),
    },
  })
  const { data: ensAvatar, isLoading: isEnsAvatarLoading } = useEnsAvatar({
    name: ensName as string,
    chainId: ChainId.ETHEREUM, // Always resolve against Ethereum mainnet
    query: {
      enabled: Boolean(ensName && fetchData),
    },
  })

  return useMemo(() => {
    return {
      domainName: ensName || sidName || unsName,
      ensName: ensName ?? undefined,
      avatar: ensAvatar ?? undefined,
      isLoading: isEnsLoading || isEnsAvatarLoading || (!ensName && isSidLoading) || (!sidName && isUnsLoading),
    }
  }, [sidName, unsName, isSidLoading, isUnsLoading, ensName, isEnsLoading, ensAvatar, isEnsAvatarLoading])
}
