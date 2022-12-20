// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MockToken is ERC20 {
  // solhint-disable-next-line no-empty-blocks
  constructor() ERC20('Mock Token', 'MOCK') {}

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address to, uint256 amount) external {
    _burn(to, amount);
  }
}
