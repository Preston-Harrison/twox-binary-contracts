// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./Roles.sol";

struct Config {
  uint256 minimumDeposit;
  uint40 payoutMultiplier;
  uint40 minimumDuration;
  uint40 maximumDuration;
  uint40 priceExpiryThreshold;
  uint40 feeFraction;
  bool enabled;
}

abstract contract Setters is Roles, Pausable {
  uint256 public constant PRECISION = 10_000;
  mapping(address => Config) public aggregatorConfig;
  address public feeReceiver;

  event SetFeeReceiver(address feeReceiver);
  event SetAggregatorConfig(
    address indexed aggregator,
    uint256 minimumDeposit,
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
    uint256 minimumDeposit,
    uint40 payoutMultiplier,
    uint40 minimumDuration,
    uint40 maximumDuration,
    uint40 priceExpiryThreshold,
    uint40 feeFraction,
    bool enabled
  ) external onlyAdmin {
    require(
      payoutMultiplier >= PRECISION && payoutMultiplier <= 2 * PRECISION,
      "Invalid payout multiplier"
    );
    require(minimumDuration <= maximumDuration, "Min duration over max");
    require(feeFraction < PRECISION, "Invalid fee fraction");

    aggregatorConfig[aggregator] = Config(
      minimumDeposit,
      payoutMultiplier,
      minimumDuration,
      maximumDuration,
      priceExpiryThreshold,
      feeFraction,
      enabled
    );

    emit SetAggregatorConfig(
      aggregator,
      minimumDeposit,
      payoutMultiplier,
      minimumDuration,
      maximumDuration,
      priceExpiryThreshold,
      feeFraction,
      enabled
    );
  }

  function pause() external whenNotPaused onlyAdmin {
    _pause();
  }

  function unpause() external whenPaused onlyAdmin {
    _unpause();
  }
}
