//
// this script executes when you run 'yarn test'
//
// you can also test remote submissions like:
// CONTRACT_ADDRESS=0x43Ab1FCd430C1f20270C2470f857f7a006117bbb yarn test --network rinkeby
//
// you can even run mint commands if the tests pass like:
// yarn test && echo "PASSED" || echo "FAILED"
//
import { ethers, network } from 'hardhat';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';

use(solidity);

describe('🚩 Challenge 1: 🥩 Decentralized Staking App', function () {
  this.timeout(120000);

  let exampleExternalContract: Contract;
  let stakerContract: Contract;
  //console.log("hre:",Object.keys(hre)) // <-- you can access the hardhat runtime env here

  describe('Staker', function () {
    if (process.env.CONTRACT_ADDRESS) {
      it('Should connect to external contract', async function () {
        stakerContract = await ethers.getContractAt('Staker', process.env.CONTRACT_ADDRESS!);
        console.log('     🛰 Connected to external contract', stakerContract.address);
      });
    } else {
      it('Should deploy ExampleExternalContract', async function () {
        const ExampleExternalContract = await ethers.getContractFactory('ExampleExternalContract');
        exampleExternalContract = await ExampleExternalContract.deploy();
      });
      it('Should deploy Staker', async function () {
        const Staker = await ethers.getContractFactory('Staker');
        stakerContract = await Staker.deploy(exampleExternalContract.address);
      });
    }

    describe('mintItem()', function () {
      it('Balance should go up when you stake()', async function () {
        const [owner] = await ethers.getSigners();

        console.log('\t', ' 🧑‍🏫 Tester Address: ', owner.address);

        const startingBalance = await stakerContract.balances(owner.address);
        console.log('\t', ' ⚖️ Starting balance: ', startingBalance.toNumber());

        console.log('\t', ' 🔨 Staking...');
        const stakeResult = await stakerContract.stake({ value: ethers.utils.parseEther('0.001') });
        console.log('\t', ' 🏷  stakeResult: ', stakeResult.hash);

        console.log('\t', ' ⏳ Waiting for confirmation...');
        const txResult = await stakeResult.wait();
        expect(txResult.status).to.equal(1);

        const newBalance = await stakerContract.balances(owner.address);
        console.log('\t', ' 🔎 New balance: ', ethers.utils.formatEther(newBalance));
        expect(newBalance).to.equal(startingBalance.add(ethers.utils.parseEther('0.001')));
      });

      if (process.env.CONTRACT_ADDRESS) {
        console.log(' 🤷 since we will run this test on a live contract this is as far as the automated tests will go...');
      } else {
        it('If enough is staked and time has passed, you should be able to complete', async function () {
          const timeLeft1 = await stakerContract.timeLeft();
          console.log('\t', '⏱ There should be some time left: ', timeLeft1.toNumber());
          expect(timeLeft1.toNumber()).to.greaterThan(0);

          console.log('\t', ' 🚀 Staking a full eth!');
          const stakeResult = await stakerContract.stake({ value: ethers.utils.parseEther('1') });
          console.log('\t', ' 🏷  stakeResult: ', stakeResult.hash);

          console.log('\t', ' ⌛️ fast forward time...');
          await network.provider.send('evm_increaseTime', [3600]);
          await network.provider.send('evm_mine');

          const timeLeft2 = await stakerContract.timeLeft();
          console.log('\t', '⏱ Time should be up now: ', timeLeft2.toNumber());
          expect(timeLeft2.toNumber()).to.equal(0);

          console.log('\t', ' 🎉 calling execute');
          const execResult = await stakerContract.execute();
          console.log('\t', ' 🏷  execResult: ', execResult.hash);

          const result = await exampleExternalContract.completed();
          console.log('\t', ' 🥁 complete: ', result);
          expect(result).to.equal(true);
        });

        it('Should redeploy Staker, stake, not get enough, and withdraw', async function () {
          const [owner, account] = await ethers.getSigners();

          const ExampleExternalContract = await ethers.getContractFactory('ExampleExternalContract');
          exampleExternalContract = await ExampleExternalContract.deploy();
          const balanceResult1 = await ethers.provider.getBalance(account.address);
          const balance1 = ethers.utils.formatEther(balanceResult1);
          console.log('\t', ' 🧍🏻 balance: ', balance1);

          const contractBalance = await ethers.provider.getBalance(exampleExternalContract.address);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          const Staker = await ethers.getContractFactory('Staker');
          stakerContract = await Staker.deploy(exampleExternalContract.address);

          console.log('\t', ' 🔨 Staking...');
          const stakeResult = await stakerContract.connect(account).stake({ value: ethers.utils.parseEther('0.001') });
          console.log('\t', ' 🏷  stakeResult: ', stakeResult.hash);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          console.log('\t', ' ⏳ Waiting for confirmation...');
          const txResult = await stakeResult.wait();
          expect(txResult.status).to.equal(1);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          console.log('\t', ' ⌛️ fast forward time...');
          await network.provider.send('evm_increaseTime', [3600]);
          await network.provider.send('evm_mine');

          const result1 = await exampleExternalContract.completed();
          console.log('\t', ' 🥁 complete should be false: ', result1);
          expect(result1).to.equal(false);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          console.log('\t', ' 💵 calling withdraw');
          const withdrawResult = await stakerContract.connect(account).withdraw();
          console.log('\t', ' 🏷  withdrawResult: ', withdrawResult.hash);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          const stakeResult2 = await stakerContract.connect(account).stake({ value: ethers.utils.parseEther('0.025') });
          console.log('\t', ' 🏷  stakeResult: ', stakeResult2.hash);
          const balanceResult2 = await ethers.provider.getBalance(account.address);
          const balance2 = ethers.utils.formatEther(balanceResult2);
          console.log('\t', ' 🧍🏻 balance2: ', balance2);
          await network.provider.send('evm_increaseTime', [3600]);
          await network.provider.send('evm_mine');

          console.log('\t', ' 🎉 calling execute');
          const execResult = await stakerContract.execute();
          console.log('\t', ' 🏷  execResult: ', execResult.hash);
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));

          const result2 = await exampleExternalContract.completed();
          console.log('\t', ' 🥁 complete should be true: ', result2);
          expect(result2).to.equal(true);

          console.log('\t', ' 🔨 Staking...');
          const stakeResult3 = await stakerContract.connect(account).stake({ value: ethers.utils.parseEther('0.025') });
          console.log('\t', ' 🏷  stakeResult: ', stakeResult3.hash);

          const balanceResult3 = await ethers.provider.getBalance(account.address);
          const balance3 = ethers.utils.formatEther(balanceResult3);
          console.log('\t', ' 🧍🏻 balance3: ', balance3);

          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));
          console.log('\t', 'User does not have ETH deposited to withdraw');

          const afterWithdrawBalance = await ethers.provider.getBalance(account.address);
          console.log('\t', 'afterWithdrawBalance:', ethers.utils.formatEther(afterWithdrawBalance));
          console.log('\t', 'contractBalance:', ethers.utils.formatEther(contractBalance));
          // expect(contractBalance).to.equal(0);

          // need to account for the gas cost from calling withdraw
          const tx1 = await ethers.provider.getTransaction(stakeResult.hash);
          const tx2 = await ethers.provider.getTransaction(stakeResult2.hash);
          const tx3 = await ethers.provider.getTransaction(stakeResult3.hash);
          const receipt1 = await ethers.provider.getTransactionReceipt(stakeResult.hash);
          const receipt2 = await ethers.provider.getTransactionReceipt(stakeResult2.hash);
          const receipt3 = await ethers.provider.getTransactionReceipt(stakeResult3.hash);
          const gasCostResult1 = tx1.gasPrice?.mul(receipt1.gasUsed);
          const gasCostResult2 = tx2.gasPrice?.mul(receipt2.gasUsed);
          const gasCostResult3 = tx3.gasPrice?.mul(receipt3.gasUsed);
          // const gasCost1 = BigNumber.from(gasCostResult1);
          // const gasCost2 = BigNumber.from(gasCostResult2);
          // const gasCost1 = parseInt(gasCostResult1?);
          // const gasCost2 = parseInt(gasCostResult2);
          // const gasCost2 = BigNumber.from(gasCostResult2);
          // const gc = ethers.utils.formatEther(gasCost1 + gasCost2);
          // console.log('\t', '⛽️ gasCost:', gc);
          const mysteryGas = ethers.utils.parseEther('0.000273143733702944');
          const g = gasCostResult1?.add(BigNumber.from(gasCostResult2)).add(BigNumber.from(gasCostResult3)).add(BigNumber.from(mysteryGas));

          const endingBalance = await ethers.provider.getBalance(account.address);
          console.log('\t', '  end bal:', ethers.utils.formatEther(endingBalance));
          // const startingBalance = balanceResult3.add(ethers.utils.parseEther('0.000273143733702944')).add();
          console.log('\t', 'start bal:', ethers.utils.formatEther(balanceResult3));

          console.log('\t', 'mystery gas:', ethers.utils.formatEther('0xf86c3b385120'));
          console.log('\t', 'mystery gas:', mysteryGas);

          // const balResult = balanceResult3.sub(ethers.BigNumber.from(gasCost));
          console.log('\t', '🟢 balance3:', balance3);

          expect(endingBalance).to.equal(balanceResult3);
        });
      }
      //

      /*it("Should track tokens of owner by index", async function () {
        const [ owner ] = await ethers.getSigners();
        const startingBalance = await myContract.balanceOf(owner.address)
        const token = await myContract.tokenOfOwnerByIndex(owner.address,startingBalance.sub(1));
        expect(token.toNumber()).to.greaterThan(0);
      });*/
    });
  });
});
