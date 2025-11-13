import { useDebounce } from '@pancakeswap/hooks'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/sdk'
import {
  AutoColumn,
  BscScanIcon,
  Button,
  Column,
  DeleteOutlineIcon,
  IconButton,
  Input,
  Link,
  Text,
} from '@pancakeswap/uikit'
import Row, { RowBetween, RowFixed } from 'components/Layout/Row'
import { CurrencyLogo } from 'components/Logo'
import { useTokenByChainId } from 'hooks/Tokens'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useGetENSAddressByName } from 'hooks/useGetENSAddressByName'
import { RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { useRemoveUserAddedToken } from 'state/user/hooks'
import useUserAddedTokens from 'state/user/hooks/useUserAddedTokens'
import { styled } from 'styled-components'
import { getBlockExploreLink, safeGetAddress } from 'utils'
import ImportRow from './ImportRow'
import { CurrencyModalView } from './types'

const Wrapper = styled.div`
  width: 100%;
  height: calc(100% - 60px);
  position: relative;
  padding-bottom: 60px;
`

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export default function ManageTokens({
  setModalView,
  setImportToken,
  chainId: chainIdProp,
}: {
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
  chainId?: number
}) {
  const { chainId: activeChainId } = useActiveChainId()
  const chainId = chainIdProp || activeChainId

  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Try to resolve ENS name to address
  const ensResolvedAddress = useGetENSAddressByName(debouncedSearchQuery, chainId)

  // Use ENS resolved address if available, otherwise use the original query
  const resolvedQuery = useMemo(() => {
    if (ensResolvedAddress) {
      return ensResolvedAddress
    }
    // If it's a valid address, checksum it
    const checksummed = safeGetAddress(debouncedSearchQuery)
    return checksummed || debouncedSearchQuery
  }, [ensResolvedAddress, debouncedSearchQuery])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
    const input = event.target.value
    // Don't checksum immediately - let ENS resolution handle it
    setSearchQuery(input)
  }, [])

  // if they input an address or ENS name, use it
  const searchToken = useTokenByChainId(resolvedQuery, chainId)

  // all tokens for local list
  const userAddedTokens: Token[] = useUserAddedTokens(chainId)
  const removeToken = useRemoveUserAddedToken()

  const handleRemoveAll = useCallback(() => {
    if (chainId && userAddedTokens) {
      userAddedTokens.forEach((token) => {
        return removeToken(chainId, token.address)
      })
    }
  }, [removeToken, userAddedTokens, chainId])

  const tokenList = useMemo(() => {
    return (
      chainId &&
      userAddedTokens.map((token) => (
        <RowBetween key={token.address} width="100%">
          <RowFixed>
            <CurrencyLogo currency={token} size="20px" />
            <Link
              external
              href={getBlockExploreLink(token.address, 'address', chainId)}
              color="textSubtle"
              ml="10px"
              mr="3px"
            >
              {token.symbol}
            </Link>
            <a href={getBlockExploreLink(token.address, 'token', chainId)} target="_blank" rel="noreferrer noopener">
              <BscScanIcon width="20px" color="textSubtle" />
            </a>
          </RowFixed>
          <RowFixed>
            <IconButton variant="text" onClick={() => removeToken(chainId, token.address)}>
              <DeleteOutlineIcon color="textSubtle" />
            </IconButton>
          </RowFixed>
        </RowBetween>
      ))
    )
  }, [userAddedTokens, chainId, removeToken])

  // Validate: empty, valid address, or ENS name (will be resolved)
  const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
  const isAddressValid = useMemo(() => {
    if (searchQuery === '') return true
    // Valid address
    if (safeGetAddress(searchQuery)) return true
    // Valid ENS name format
    if (ENS_NAME_REGEX.test(searchQuery)) return true
    // If we have a resolved address from ENS, it's valid
    if (ensResolvedAddress) return true
    return false
  }, [searchQuery, ensResolvedAddress])

  return (
    <Wrapper>
      <Column style={{ width: '100%', flex: '1 1' }}>
        <AutoColumn gap="14px">
          <Row>
            <Input
              id="token-search-input"
              scale="lg"
              placeholder={t('Token address or ENS name')}
              value={searchQuery}
              autoComplete="off"
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
              isWarning={!isAddressValid}
            />
          </Row>
          {!isAddressValid && searchQuery !== '' && (
            <Text color="failure">{t('Enter valid token address or ENS name')}</Text>
          )}
          {searchToken && (
            <ImportRow
              token={searchToken}
              showImportView={() => setModalView(CurrencyModalView.importToken)}
              setImportToken={setImportToken}
              style={{ height: 'fit-content' }}
              chainId={chainId}
            />
          )}
        </AutoColumn>
        {tokenList}
        <Footer>
          <Text bold color="textSubtle">
            {userAddedTokens?.length} {userAddedTokens.length === 1 ? t('Imported Token') : t('Imported Tokens')}
          </Text>
          {userAddedTokens.length > 0 && (
            <Button variant="tertiary" onClick={handleRemoveAll}>
              {t('Clear all')}
            </Button>
          )}
        </Footer>
      </Column>
    </Wrapper>
  )
}
