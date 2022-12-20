import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'dotenv/config';
import './scripts/tasks';

const config: HardhatUserConfig = {
  solidity: '0.8.16',
  networks: {},
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
