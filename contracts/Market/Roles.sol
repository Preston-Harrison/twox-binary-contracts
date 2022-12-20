// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

abstract contract Roles {
  address public admin;
  address public signer;

  event SetAdmin(address admin);
  event SetSigner(address signer);

  constructor(address initialAdmin) {
    admin = initialAdmin;
  }

  modifier onlyAdmin() {
    require(msg.sender == admin, 'Unauthorized caller');
    _;
  }

  function transferAdmin(address admin_) external onlyAdmin {
    admin = admin_;
    emit SetAdmin(admin_);
  }

  function setSigner(address signer_) external onlyAdmin {
    signer = signer_;
    emit SetSigner(signer_);
  }
}
