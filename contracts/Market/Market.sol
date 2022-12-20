// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../LiquidityPool.sol";
import "./Setters.sol";

struct Option {
  /// the address of the pricefeed for this option
  address priceFeed;
  /// the unix timestamp (in seconds) of expiry
  uint40 expiry;
  /// true if the option is a call, false if it is a put
  bool isCall;
  /// the price the option is opened at
  int128 openPrice;
  /// the price the option is closed at. Zeroed out while position is active
  int128 closePrice; //! Unused, only for frontend
  /// the deposited amount for the option
  uint256 deposit; //! Unused, only for frontend
  /// the total payout that the option will payout if it wins
  uint256 payout;
}

contract Market is ERC721, Setters {
  /// The liquidity pool associated with this market
  LiquidityPool public immutable liquidityPool;

  /// The total amount of positions
  uint256 public totalSupply;
  /// Mapping of token id to option struct
  mapping(uint256 => Option) public options;

  constructor(address liquidityPool_) ERC721("Coral Binary Options", "C-BO") {
    liquidityPool = LiquidityPool(liquidityPool_);
  }

  /// @return asset the asset of the liquidity pool
  function asset() public view returns (IERC20) {
    return IERC20(liquidityPool.asset());
  }

  /// Gets the most recent price from an aggregator, and validates that it is recent
  function getPrice(address priceFeed) internal view returns (int128) {
    AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
    (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
    require(
      block.timestamp <= updatedAt + priceExpiryThreshold,
      "Price too old"
    );
    return int128(answer);
  }

  /// Mints a new position
  /// @param priceFeed the pricefeed option
  /// @param duration the duration of the option
  /// @param isCall whether or not the option is a call option
  /// @param deposit the total deposit for the option
  /// @param receiver the owner of the newly minted position
  function mint(
    address priceFeed,
    uint40 duration,
    bool isCall,
    uint256 deposit,
    address receiver
  ) external {
    require(isAggregatorEnabled[priceFeed], "Aggregator not enabled");

    uint256 multiplier = durationMultiplier[duration];
    require(multiplier != 0, "Duration not enabled");

    uint256 depositFees = (deposit * feeFraction) / 1 ether;
    uint256 depositAfterFee = deposit - depositFees;
    require(depositAfterFee > 0, "Deposit after fees cannot be zero");

    uint256 payout = (depositAfterFee * multiplier) / 1 ether;

    // increase the total supply and set the new token id to the new supply
    uint256 tokenId = ++totalSupply;
    // mint the new option to the receiver
    _mint(receiver, tokenId);

    // create the option
    options[tokenId] = Option(
      priceFeed,
      // expiry is the block timestamp + duration
      uint40(block.timestamp + duration),
      isCall,
      getPrice(priceFeed),
      0, // not known until close
      depositAfterFee,
      payout
    );

    // transfer the deposit (after fees) to the pool
    asset().transferFrom(msg.sender, address(liquidityPool), depositAfterFee);
    // reserve the payout by transferring the payout amount to the pool
    liquidityPool.reserveAmount(payout);
    // transfer the depositFees to the fee receiver
    asset().transfer(feeReceiver, depositFees);
  }

  /// @param tokenId the id of the option to close
  function burn(uint256 tokenId) external {
    Option storage option = options[tokenId];
    require(option.expiry <= block.timestamp, "Option has not expired");
    require(_exists(tokenId), "Option burnt/does not exist");

    // get owner, then burn token. Burning the token will
    // set the owner to address(0), so it must be stored
    address owner = ownerOf(tokenId);
    _burn(tokenId);

    /// store the close price, and check if the option wins
    option.closePrice = getPrice(option.priceFeed);
    bool won = option.isCall
      // if call, they win if it closes above the open
      ? option.closePrice > option.openPrice
      // if put, they win if it closes below the open
      : option.closePrice < option.openPrice;

    if (won) {
      // transfer payout to owner
      asset().transfer(owner, option.payout);
    } else {
      // transfer payout back to liquidity pool
      asset().transfer(address(liquidityPool), option.payout);
    }
  }
}
