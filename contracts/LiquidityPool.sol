// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./Market/Market.sol";

contract LiquidityPool is ERC4626, Ownable2Step {
  uint256 public constant PRECISION = 1 ether;
  Market public immutable market;

  // maximum fraction of assets that can reside in the market
  uint256 public maximumReserveFraction = PRECISION;
  event SetMaximumReserveFraction(uint256 maximumReserveFraction);

  constructor(IERC20 asset) ERC4626(asset) ERC20("Coral LP Token", "C-LP") {
    market = new Market(LiquidityPool(address(this)), asset, msg.sender);
  }

  modifier onlyMarket() {
    require(msg.sender == address(market), "Unauthorized caller");
    _;
  }

  /// Reserves an amount by transferring it to the market
  function reserveAmount(uint256 amount) external onlyMarket {
    // market has just increased internal reservedAmount counter
    // so transfer immediately before performing checks
    IERC20(asset()).transfer(address(market), amount);

    uint256 reserved = market.reservedAmount();
    uint256 assets = totalAssets();
    uint256 reserveFraction = (reserved * PRECISION) / (assets + reserved);
    require(
      reserveFraction <= maximumReserveFraction,
      "Reserve fraction too great"
    );
  }

  function setMaximumReserveFraction(
    uint256 maximumReserveFraction_
  ) external onlyOwner {
    require(maximumReserveFraction_ <= PRECISION, "Fraction cannot be > 1");
    maximumReserveFraction = maximumReserveFraction_;
    emit SetMaximumReserveFraction(maximumReserveFraction_);
  }
}
