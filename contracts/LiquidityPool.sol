// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './Market/Market.sol';

contract LiquidityPool is ERC4626 {
  using SafeERC20 for IERC20;

  Market public immutable market;

  constructor(IERC20 asset) ERC4626(asset) ERC20('Coral LP Token', 'CLP') {
    market = new Market(address(this), msg.sender);
  }

  modifier onlyMarket() {
    require(msg.sender == address(market), 'Unauthorized caller');
    _;
  }

  function reserveAmount(uint256 amount) external onlyMarket {
    IERC20(asset()).safeTransfer(address(market), amount);
  }
}
