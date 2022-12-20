// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Roles.sol";

abstract contract Setters is Roles {
  mapping(address => bool) public isAggregatorEnabled;
  mapping(uint40 => uint256) public durationMultiplier; // 1 ether = 1x
  uint256 public priceExpiryThreshold;
  uint256 public feeFraction; // as fraction of 1 ether
  address public feeReceiver;

  event SetPriceExpiryThreshold(uint256 priceExpiryThreshold);
  event SetFeeReceiver(address feeReceiver);
  event SetFeeFraction(uint256 feeFraction);
  event SetAggregator(address aggregator, bool enabled);
  event SetPayoutMultiplier(uint40 expiry, uint256 payoutMultiplier);

  function setEnabledAggregator(
    address aggregator,
    bool enabled
  ) external onlyAdmin {
    require(
      AggregatorV3Interface(aggregator).decimals() == 8,
      "Invalid decimals"
    );
    isAggregatorEnabled[aggregator] = enabled;
    emit SetAggregator(aggregator, enabled);
  }

  function setPriceExpiryThreshold(
    uint256 priceExpiryThreshold_
  ) external onlyAdmin {
    priceExpiryThreshold = priceExpiryThreshold_;
    emit SetPriceExpiryThreshold(priceExpiryThreshold_);
  }

  function setFeeReceiver(address feeReceiver_) external onlyAdmin {
    feeReceiver = feeReceiver_;
    emit SetFeeReceiver(feeReceiver_);
  }

  function setFeeFraction(uint256 feeFraction_) external onlyAdmin {
    require(feeFraction <= 1 ether, "Invalid fee fraction");
    feeFraction = feeFraction_;
    emit SetFeeFraction(feeFraction_);
  }

  function setDurationMultiplier(
    uint40 duration,
    uint256 payoutMultiplier
  ) external onlyAdmin {
    require(
      payoutMultiplier < 2 ether && payoutMultiplier > 1 ether,
      "Invalid payout multiplier"
    );
    durationMultiplier[duration] = payoutMultiplier;
    emit SetPayoutMultiplier(duration, payoutMultiplier);
  }
}
