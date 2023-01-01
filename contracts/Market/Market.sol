// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../LiquidityPool.sol";
import "./Setters.sol";

struct Option {
  /// the address of the pricefeed for this option
  address aggregator;
  /// the unix timestamp (in seconds) of open time
  uint40 openTime;
  /// the unix timestamp (in seconds) of expiry
  uint40 expiry;
  /// true if the option is a call, false if it is a put
  bool isCall;
  /// the price the option is opened at
  int128 openPrice;
  /// the price the option is closed at. Zeroed out while position is active
  int128 closePrice;
  /// the deposited amount for the option
  uint256 deposit;
  /// the total payout that the option will payout if it wins
  uint256 payout;
}

contract Market is ERC721, Setters {
  using SafeERC20 for IERC20;

  /// The liquidity pool associated with this market
  LiquidityPool public immutable liquidityPool;
  IERC20 public immutable asset;

  /// The total amount of positions
  uint256 public totalSupply;
  /// Mapping of token id to option struct
  mapping(uint256 => Option) public options;

  // the current amount reserved for potential payouts
  uint256 public reservedAmount;

  event OpenOption(
    uint256 indexed id,
    address indexed aggregator,
    uint40 expiry,
    bool isCall,
    int128 openPrice,
    uint256 deposit,
    uint256 fee,
    uint256 payout
  );

  event CloseOption(uint256 indexed id, int128 closePrice);

  constructor(
    LiquidityPool liquidityPool_,
    IERC20 asset_,
    address initialOwner
  ) ERC721("Coral Binary Options", "C-BO") Setters(initialOwner) {
    liquidityPool = liquidityPool_;
    asset = asset_;
  }

  /// Gets the most recent price from an aggregator, and validates that it is recent
  function getPrice(
    address aggregator_,
    uint40 priceExpiryThreshold
  ) internal view returns (int128) {
    AggregatorV3Interface aggregator = AggregatorV3Interface(aggregator_);
    (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
    require(
      block.timestamp <= updatedAt + priceExpiryThreshold,
      "Price too old"
    );
    return int128(answer);
  }

  /// Moves funds from the liquidty pool to this contract so that
  /// it can be payed out if the position wins
  function reserveForOpen(uint256 payout) internal {
    // keep a log of the payouts reserved, so that the liquidity pool knows
    // the payout ratio. This is so that accounts can't transfer funds to this
    // contract to alter the payout ratio (without opening a position)
    // it is important this is done before reserving the amount so the liquidity pool
    // can perform the correct reserve ratio checks
    reservedAmount += payout;
    // reserve the payout by transferring the payout amount to the pool
    // this is done after increasing reservedAmount as the liquidity pool reads this value
    liquidityPool.reserveAmount(payout);
  }

  /// Mints a new position
  /// @param aggregator the aggregator of the option
  /// @param duration the duration of the option
  /// @param isCall whether or not the option is a call option
  /// @param deposit the total deposit for the option
  /// @param receiver the owner of the newly minted position
  function open(
    address aggregator,
    uint40 duration,
    bool isCall,
    uint256 deposit,
    address receiver
  ) external whenNotPaused {
    Config memory config = aggregatorConfig[aggregator];
    require(config.enabled, "Aggregator not enabled");
    require(
      duration >= config.minimumDuration && duration <= config.maximumDuration,
      "Duration out of bounds"
    );
    require(deposit >= config.minimumDeposit, "Deposit too small");

    uint256 depositFees = (deposit * config.feeFraction) / PRECISION;
    uint256 depositAfterFee = deposit - depositFees;
    uint256 payout = (depositAfterFee * config.payoutMultiplier) / PRECISION;

    // increase the total supply and set the new token id to the new supply
    uint256 tokenId = ++totalSupply;
    // mint the new option to the receiver
    _mint(receiver, tokenId);

    // expiry is the block timestamp + duration
    uint40 expiry = uint40(block.timestamp) + duration;
    int128 openPrice = getPrice(aggregator, config.priceExpiryThreshold);

    // create the option
    options[tokenId] = Option(
      aggregator,
      uint40(block.timestamp),
      expiry,
      isCall,
      openPrice,
      0, // not known until close
      depositAfterFee,
      payout
    );

    emit OpenOption(
      tokenId,
      aggregator,
      uint40(block.timestamp + duration),
      isCall,
      openPrice,
      depositAfterFee,
      depositFees,
      payout
    );

    // transfer the depositFees to the fee receiver
    asset.safeTransferFrom(msg.sender, feeReceiver, depositFees);
    // transfer the deposit (after fees) to the pool
    asset.safeTransferFrom(msg.sender, address(liquidityPool), depositAfterFee);
    reserveForOpen(payout);
  }

  /// @param tokenId the id of the option to close
  function close(uint256 tokenId) external whenNotPaused {
    Option memory option = options[tokenId];
    require(block.timestamp >= option.expiry, "Option has not expired");
    require(_exists(tokenId), "Option is not open");

    // get owner, then burn token. Burning the token will
    // set the owner to address(0), so it must be stored
    address owner = ownerOf(tokenId);
    _burn(tokenId);

    /// store the close price, and check if the option wins
    int128 closePrice = getPrice(
      option.aggregator,
      aggregatorConfig[option.aggregator].priceExpiryThreshold
    );
    options[tokenId].closePrice = closePrice;
    bool won = option.isCall
      ? closePrice > option.openPrice // if call, they win if it closes above the open
      : closePrice < option.openPrice; // if put, they win if it closes below the open

    // either the payout is returned, or payed out. Either way the
    // reserved amount is decreased
    reservedAmount -= option.payout;

    emit CloseOption(tokenId, closePrice);

    if (won) {
      // transfer payout to owner
      asset.safeTransfer(owner, option.payout);
    } else {
      // safeTransfer payout back to liquidity pool
      asset.safeTransfer(address(liquidityPool), option.payout);
    }
  }
}
