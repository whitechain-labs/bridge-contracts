const tronConfig = require("../../../tronbox");
const Bridge = artifacts.require("Bridge");
const Mapper = artifacts.require("Mapper");
const { TronWeb } = require('tronweb');
const { ethers } = require("ethers");
const utils = require("../utils/utils");
const GlobalConfig = require("../utils/GlobalConfig");

contract("Bridge", (accounts) => {
    let BridgeContract;
    let MapperContract;
    let newMapInfo;
    const tronWeb = new TronWeb({ fullHost: tronConfig.networks.nile.fullHost });

    const OWNER_ADDRESS = process.env[`NILE_OWNER_ADDRESS`] || "";
    const BRIDGE_ADDRESS = process.env[`NILE_BRIDGE_ADDRESS`] || "";
    const MAPPER_ADDRESS = process.env[`NILE_MAPPER_ADDRESS`] || "";


    if (!BRIDGE_ADDRESS || BRIDGE_ADDRESS.trim() === "" ||
        !OWNER_ADDRESS || OWNER_ADDRESS.trim() === "" ||
        !MAPPER_ADDRESS || MAPPER_ADDRESS.trim() === "") {
        throw new Error('Environment variable BRIDGE_ADDRESS || MAPPER_ADDRESS || OWNER_ADDRESS is not set or empty');
    }

    before(async () => {
        newMapInfo = await utils.setMapInfo(0);
        BridgeContract = await Bridge.at(BRIDGE_ADDRESS);
        MapperContract = await Mapper.at(MAPPER_ADDRESS);
    });

    describe("Deployment", function () {

        it("should return correct owner", async () => {
            const ownerAddress = await BridgeContract.owner();

            assert.equal(tronWeb.address.fromHex(ownerAddress), OWNER_ADDRESS, "Owner mismatch");
        });

    });

    describe("depositTokens", async function () {

        it.skip("depositTokens to BridgeContract", async function () {
            const amount = GlobalConfig.USDT_1;
            const mapId = await MapperContract.withdrawAllowedTokens(newMapInfo[0], newMapInfo[5]);
            const depositTokensTransaction = await BridgeContract.depositTokens(mapId[0], amount);
            console.log(depositTokensTransaction);
        });

    });

    describe("receiveTokens", async function () {

        it("Should be able to receiveTokens Tokens", async function () {
            newMapInfo = await utils.setMapInfo(1);
            let externalId = ethers.encodeBytes32String("externalId");
            let amount = 99999;
            const mapId = await MapperContract.withdrawAllowedTokens(newMapInfo[0], newMapInfo[5]);

            const receiveTokensTransaction = await BridgeContract.receiveTokens([
                externalId,
                mapId[0],
                amount,
                utils.toBytes32(OWNER_ADDRESS),
                utils.toBytes32(OWNER_ADDRESS)
            ]);
        });

    });

});