// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./Market/Market.sol";

contract LiquidityPool is ERC4626, Ownable2Step {
  Market public immutable market;

  uint256 public maximumReserveFraction;
  uint256 public maximumReserveAmount;
  uint256 public shareMultiplier;

  constructor(IERC20 asset) ERC4626(asset) ERC20("Coral LP Token", "C-LP") {
    market = new Market(LiquidityPool(address(this)), asset, msg.sender);
  }

  modifier onlyMarket() {
    require(msg.sender == address(market), "Unauthorized caller");
    _;
  }

  /// Reserves an amount by transferring it to the market
  function reserveAmount(uint256 amount) external onlyMarket {
    IERC20(asset()).transfer(address(market), amount);
  }
}