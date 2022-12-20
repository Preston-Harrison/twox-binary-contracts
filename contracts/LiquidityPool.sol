// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./Market/Market.sol";

contract LiquidityPool is ERC4626 {
  Market public immutable market;

  constructor(IERC20 asset) ERC4626(asset) ERC20("Coral LP Token", "C-LP") {
    market = new Market(address(this));
    market.transferAdmin(msg.sender);
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
