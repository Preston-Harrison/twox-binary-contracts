# Goerli Addresses
TOKEN_ADDRESS=0x3e070fC39A1F2661F6DfD53EAB4EB6b9F19e57c7
MARKET_ADDRESS=0x377261BbD2A7cEfA9ceAB88B4878A411150E35BB
LIQUIDITY_POOL_ADDRESS=0xA13fB7AbD212666017eb63AA9dB8b31aA5Da76D8
ETH_AGGREGATOR_ADDRESS=0x28b5c905969f43277a82437f05B7A2574a4D1A1c
BTC_AGGREGATOR_ADDRESS=0x45E3A9195c3ac2Dc59C6e7E3D0f4702138538fF8
ROUTER_ADDRESS=0x011A540E508f6B1Dc777efE9fbbB03Cf1d6B64dC

## Market
The Market contract is a simplified binary options contract that allows users to bet whether or not a price will increase or decrease. Since the strike price is always set to the price at the time of the option opening, the payout is fixed up to 2x (get it? twox-exchange? haha. ha.). 

The market contract consists of `Market.sol` and `Setters.sol`.

`Setters.sol` is responsible for permissioned configuration of aggregator configuration, and the respective events. It is also responsible for pausing and unpausing the contract incase of unforseeable events.

`Market.sol` is responsible for the logic associated with opening and closing positions. Anyone can close an open position, and the positions should be closed as close as possible to the expiry time to assure the oracle price is correct.

## Liquidity Pool
The liquidity pool contract is an `ERC4626` vault that simply holds liquidity providers funds, and accrues trader PnL. The Market contract pulls from this to payout traders, and deposits back into this when options are closed out of the money.

## Instant Aggregator / Router
The instant aggregator is a price feed that accepts a signed price, and updates an aggregator if the signature is correct. This type of aggregator is used so that the price can be updated at a higher frequency, but only submitted to the blockchain once a trade is placed. The Router updates the instant aggregators before opening an option (and validates the signed price is the price the user was expecting), so that the price is current.