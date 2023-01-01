// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./Market/Market.sol";

contract LiquidityPool is ERC4626, Ownable2Step {
  using SafeERC20 for IERC20;

  uint256 public constant PRECISION = 1 ether;
  Market public immutable market;

  // maximum fraction of assets that can reside in the market
  uint256 public maximumReserveFraction = PRECISION;
  event SetMaximumReserveFraction(uint256 maximumReserveFraction);

  constructor(IERC20 asset) ERC4626(asset) ERC20("TwoX Liquidiy Pool", "2XLP") {
    market = new Market(LiquidityPool(address(this)), asset, msg.sender);
  }

  modifier onlyMarket() {
    require(msg.sender == address(market), "Unauthorized caller");
    _;
  }

  /// Reserves an amount by transferring it to the market
  /// Must be called after market reserved amount has been increased
  function reserveAmount(uint256 amount) external onlyMarket {
    uint256 reserved = market.reservedAmount();
    // get reserved as fraction of total assets (both reserved & free)
    uint256 reserveFraction = (reserved * PRECISION) /
      (totalAssets() + reserved - amount);
    require(
      reserveFraction <= maximumReserveFraction,
      "Reserve fraction too great"
    );

    IERC20(asset()).safeTransfer(address(market), amount);
  }

  function setMaximumReserveFraction(
    uint256 maximumReserveFraction_
  ) external onlyOwner {
    require(maximumReserveFraction_ <= PRECISION, "Fraction cannot be > 1");
    maximumReserveFraction = maximumReserveFraction_;
    emit SetMaximumReserveFraction(maximumReserveFraction_);
  }
}
