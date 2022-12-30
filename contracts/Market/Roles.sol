// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

abstract contract Roles is Ownable2Step {
  address public signer;

  event SetSigner(address signer);

  constructor(address initialOwner) {
    _transferOwnership(initialOwner);
  }

  function setSigner(address signer_) external onlyOwner {
    signer = signer_;
    emit SetSigner(signer_);
  }
}
