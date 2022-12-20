// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

struct Round {
  uint80 roundId;
  int256 answer;
  uint256 startedAt;
  uint256 updatedAt;
  uint80 answeredInRound;
}

contract InstantAggregator is Ownable, AggregatorV3Interface {
  uint8 public immutable decimals;
  string public description;
  uint256 public immutable version;
  Round[] private _rounds;

  event NewRound(
    uint80 indexed roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
  );

  constructor(uint8 decimals_, string memory description_, uint256 version_) {
    decimals = decimals_;
    description = description_;
    version = version_;
  }

  function pushRound(
    address aggregator,
    uint256 timestamp,
    int256 answer,
    bytes calldata signature
  ) external returns (int256) {
    // Do not allow prices to be set in future
    require(timestamp <= block.timestamp, 'Timestamp > block.timestamp');

    uint80 len = uint80(_rounds.length);
    if (len > 0) {
      // Don't update if new timestamp is older than latest timestamp
      (, int256 latestAnswer, , uint256 updatedAt, ) = latestRoundData();
      if (updatedAt > timestamp) return latestAnswer;
    }

    // Validate signature
    require(aggregator == address(this), 'Invalid aggregator');
    bytes32 hash = ECDSA.toEthSignedMessageHash(
      keccak256(abi.encodePacked(aggregator, timestamp, answer))
    );
    require(ECDSA.recover(hash, signature) == owner(), 'Invalid signature');

    // push new round
    _rounds.push(Round(len, answer, block.timestamp, block.timestamp, len));
    emit NewRound(len, answer, block.timestamp, block.timestamp, len);
    return answer;
  }

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80, int256, uint256, uint256, uint80) {
    Round storage round = _rounds[_roundId];
    return (
      round.roundId,
      round.answer,
      round.startedAt,
      round.updatedAt,
      round.answeredInRound
    );
  }

  function latestRoundData()
    public
    view
    returns (uint80, int256, uint256, uint256, uint80)
  {
    Round storage round = _rounds[_rounds.length - 1];
    return (
      round.roundId,
      round.answer,
      round.startedAt,
      round.updatedAt,
      round.answeredInRound
    );
  }
}
