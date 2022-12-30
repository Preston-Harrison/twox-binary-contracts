// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

struct Round {
  uint80 roundId;
  int256 answer;
  uint256 startedAt;
  uint256 updatedAt;
  uint80 answeredInRound;
}

contract MockAggregatorV3 is AggregatorV3Interface {
  Round[] public rounds;

  uint8 public override decimals;
  string public override description = "XXX/USD";
  uint256 public override version = 1;

  constructor(uint8 decimals_) {
    decimals = decimals_;
  }

  function pushRound(int256 answer) external {
    rounds.push(
      Round(
        uint80(rounds.length),
        answer,
        block.timestamp,
        block.timestamp,
        uint8(rounds.length)
      )
    );
  }

  function getRoundData(
    uint80 _roundId
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    Round storage round = rounds[_roundId];
    return (
      round.roundId,
      round.answer,
      round.startedAt,
      round.updatedAt,
      round.answeredInRound
    );
  }

  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    Round storage round = rounds[rounds.length - 1];
    return (
      round.roundId,
      round.answer,
      round.startedAt,
      round.updatedAt,
      round.answeredInRound
    );
  }
}
