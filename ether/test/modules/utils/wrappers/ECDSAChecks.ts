import hre from "hardhat";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import chai, {expect} from "chai";
import {ContractFactory, ZeroAddress} from "ethers";
import chaiAsPromised from "chai-as-promised";
import * as ethUtil from "ethereumjs-util";
import * as GlobalConfig from "../../../utils/GlobalConfig";
import {time} from "@nomicfoundation/hardhat-toolbox/network-helpers";

chai.use(chaiAsPromised);

describe('ECDSAChecks', function () {

    let ECDSAChecksWrapper: any;
    let ECDSAChecksWrapperFactory: ContractFactory;

    let deployer: SignerWithAddress;
    let user0: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let nowTime: any;

    beforeEach(async function () {
        [deployer, user0, user1, user2] = await hre.ethers.getSigners();
        ({ECDSAChecksWrapper, ECDSAChecksWrapperFactory} = await deployContractsFixture());

        nowTime = await time.latest();
    });

    async function deployContractsFixture() {
        const ECDSAChecksWrapperFactory = await hre.ethers.getContractFactory(GlobalConfig.TEST_UTILS_ROUTE + 'wrappers/ECDSAChecksWrapper.sol:ECDSAChecksWrapper');
        const ECDSAChecksWrapper = await ECDSAChecksWrapperFactory.deploy();

        return {ECDSAChecksWrapper, ECDSAChecksWrapperFactory};
    }

    async function ECDSAFixture(_deadline = nowTime + 3600, signerAddress = deployer.address) {
        const _hash = hre.ethers.solidityPackedKeccak256(
            ['address', 'address', 'uint64'],
            [deployer.address, signerAddress, _deadline],
        );
        const messageBuffer = Buffer.from(_hash.slice(2), 'hex');
        const privateKeyBuffer = Buffer.from(GlobalConfig.PRIVATE_KEY_ACC_0.slice(2), 'hex');
        const ethMessageHash = ethUtil.hashPersonalMessage(messageBuffer);
        const signature = ethUtil.ecsign(ethMessageHash, privateKeyBuffer);
        const v = signature.v;
        const r = `0x${signature.r.toString('hex')}`;
        const s = `0x${signature.s.toString('hex')}`;

        return {_hash, r, s, signerAddress, _deadline, v};
    }

    describe('validateECDSAWrapper', function () {
        it('Should pay successfully with valid arguments', async function () {
            const {_hash, r, s, signerAddress, _deadline, v} = await ECDSAFixture();
            ECDSAChecksWrapper.validateECDSAWrapper([
                _hash,
                r,
                s,
                signerAddress,
                _deadline,
                v
            ]);
        });

        it('Should fail to initialize with zero address signerAddress', async function () {
            const {_hash, r, s, signerAddress, _deadline, v} = await ECDSAFixture();
            await expect(
                ECDSAChecksWrapper.validateECDSAWrapper([
                    _hash,
                    r,
                    s,
                    ZeroAddress,
                    _deadline,
                    v
                ])
            ).to.be.revertedWith("ECDSAChecks: Address must be not equal zero");
        });

        it('Should fail to initialize with _deadline < block_.timestamp', async function () {
            let nowTime_ = await time.latest() - 1;
            const {_hash, r, s, signerAddress, _deadline, v} = await ECDSAFixture(
                nowTime_
            );
            await expect(
                ECDSAChecksWrapper.validateECDSAWrapper([
                    _hash,
                    r,
                    s,
                    signerAddress,
                    _deadline,
                    v
                ])
            ).to.be.revertedWith("ECDSAChecks: Signature Expired");
        });

        it('Should fail to initialize with signer != signerAddress', async function () {
            const {_hash, r, s, signerAddress, _deadline, v} = await ECDSAFixture();
            await expect(
                ECDSAChecksWrapper.validateECDSAWrapper([
                    _hash,
                    r,
                    s,
                    user0.address,
                    _deadline,
                    v
                ])
            ).to.be.revertedWith("ECDSAChecks: invalid signature");
        });
    });
});