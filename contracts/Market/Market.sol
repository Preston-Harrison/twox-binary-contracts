// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '../LiquidityPool.sol';
import './Setters.sol';

struct Option {
  // slot one
  address priceFeed; // 160 bits
  uint40 expiry; // 40 bits
  bool isCall; // 8 bits
  // slot two
  int128 openPrice;
  int128 closePrice;
  // slot three
  uint256 deposit;
  // slot four
  uint256 payout;
}

contract Market is ERC721, Setters {
  /// The liquidity pool associated with this market
  LiquidityPool public immutable liquidityPool;

  uint256 public totalSupply;
  mapping(uint256 => Option) public options;

  constructor(
    address liquidityPool_,
    address initialAdmin
  ) ERC721('Coral Binary Options', 'CBO') Roles(initialAdmin) {
    liquidityPool = LiquidityPool(liquidityPool_);
  }

  function asset() public view returns (IERC20) {
    return IERC20(liquidityPool.asset());
  }

  function getPrice(address priceFeed) internal view returns (int128) {
    AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
    (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
    require(
      block.timestamp < updatedAt + priceExpiryThreshold,
      'Price too old'
    );
    return int128(answer);
  }

  function mint(
    address priceFeed,
    uint40 duration,
    bool isCall,
    uint256 deposit
  ) external returns (uint256 tokenId) {
    uint256 multiplier = durationPayoutMultipliers[duration];

    require(multiplier != 0);
    require(isAggregatorEnabled[priceFeed]);
    uint256 depositFees = (deposit * feeFraction) / 1 ether;
    require(deposit - depositFees > 0);

    tokenId = ++totalSupply;
    _mint(msg.sender, tokenId);

    // reserve deposit and collect fees
    uint256 payout = ((deposit - depositFees) * multiplier) / 1 ether;
    liquidityPool.reserveAmount(payout);
    asset().transfer(feeReceiver, depositFees);

    options[tokenId] = Option(
      priceFeed,
      uint40(block.timestamp + duration),
      isCall,
      getPrice(priceFeed),
      0, // not known until close
      deposit - depositFees,
      payout
    );
  }

  function burn(uint256 tokenId) external returns (bool) {
    Option storage option = options[tokenId];
    require(option.expiry >= block.timestamp);
    require(_exists(tokenId));
    option.closePrice = getPrice(option.priceFeed);
    bool won = option.isCall
      ? option.closePrice > option.openPrice
      : option.closePrice < option.openPrice;

    if (won) {
      asset().transfer(ownerOf(tokenId), option.payout);
    } else {
      asset().transfer(address(liquidityPool), option.deposit);
    }

    _burn(tokenId);
    return won;
  }
}
