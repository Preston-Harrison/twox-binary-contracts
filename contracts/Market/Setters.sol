// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Roles.sol";

struct Config {
  uint40 payoutMultiplier;
  uint40 minimumDuration;
  uint40 maximumDuration;
  uint40 priceExpiryThreshold;
  uint40 feeFraction;
  bool enabled;
}

abstract contract Setters is Roles {
  uint256 public constant PRECISION = 10_000;
  mapping(address => Config) public aggregatorConfig;
  address public feeReceiver;

  event SetFeeReceiver(address feeReceiver);
  event SetAggregatorConfig(
    address indexed aggregator,
    uint40 payoutMultiplier,
    uint40 minimumDuration,
    uint40 maximumDuration,
    uint40 priceExpiryThreshold,
    uint40 feeFraction,
    bool indexed enabled
  );

  function setFeeReceiver(address feeReceiver_) external onlyAdmin {
    feeReceiver = feeReceiver_;
    emit SetFeeReceiver(feeReceiver_);
  }

  function setAggregatorConfig(
    address aggregator,
    uint40 payoutMultiplier,
    uint40 minimumDuration,
    uint40 maximumDuration,
    uint40 priceExpiryThreshold,
    uint40 feeFraction,
    bool enabled
  ) external {
    require(payoutMultiplier > PRECISION && payoutMultiplier <= 2 * PRECISION, "Invalid payout multiplier");
    require(minimumDuration <= maximumDuration, "Min duration over max");
    require(feeFraction < PRECISION, "Invalid fee fraction");

    aggregatorConfig[aggregator] = Config(
      payoutMultiplier,
      minimumDuration,
      maximumDuration,
      priceExpiryThreshold,
      feeFraction,
      enabled
    );

    emit SetAggregatorConfig(
      aggregator,
      payoutMultiplier,
      minimumDuration,
      maximumDuration,
      priceExpiryThreshold,
      feeFraction,
      enabled
    );
  }
}
