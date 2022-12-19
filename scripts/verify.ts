import hre from 'hardhat';

async function verify(contract: string, constructorArgs: any[]) {
  await hre.run('verify:verify', {
    address: contract,
    constructorArguments: constructorArgs,
  });
}

export default verify;
