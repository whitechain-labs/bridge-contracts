const tronConfig = require('../tronbox.js');
const Config = require("./utils/config");
const { TronWeb } = require('tronweb');

const MAPPER_CONTRACT_NAME = "Mapper";
const Mapper = artifacts.require(MAPPER_CONTRACT_NAME);

module.exports = async function (deployer, network, accounts) {
    const tronWeb = new TronWeb({ fullHost: tronConfig.networks.nile.fullHost });

    if (process.env.SETUP !== "Mapper") {
        console.log("Setup migration skipped");
        return;
    }

    let MapperContract;
    let mapperParams;

    let mapperAddress = process.env[`${network.toUpperCase()}_MAPPER_ADDRESS`] || "";
    if (!mapperAddress || mapperAddress.trim() === "") {
        throw new Error(`Error: Environment variable ${network.toUpperCase()}_MAPPER_ADDRESS is not set or empty`);
    }

    MapperContract = await Mapper.at(mapperAddress);
    await getDeployerBalance(tronWeb, accounts);

    if (network == Config.NETWORK_MAINNET) {
        mapperParams = Config.MainnetMapperRoutes;
    } else if (network == Config.NETWORK_NILE) {
        mapperParams = Config.NileMapperRoutes;
    } else {
        throw new Error(`Error: Network not supported: ${network}`);
    }

    if (mapperParams.length == 0) {
        throw new Error(`Error: mapperParams is empty`);
    }

    let registerMappingParams = formatParams(mapperParams);

    await registerMapping(registerMappingParams, MapperContract);


    async function registerMapping(initParams, Contract) {
        const results= [];

        for (let i = 0; i < initParams.length; i++) {
            const params = initParams[i];

            try {
                console.log("🔍 MapperContract loaded:", Contract.address);

                const txid = await Contract.registerMapping(params);
                if (!txid) throw new Error('No txid in response');
                console.log(`🚀 Sent tx hash: ${txid}`);

                const receipt = await waitTx(txid, tronWeb);

                if (receipt?.receipt.result !== 'SUCCESS') {
                    const msg = receipt?.resMessage ? Buffer.from(receipt.resMessage, 'hex').toString() : '';
                    throw new Error(`Error: Transaction failed (result=${receipt?.receipt.result || 'UNKNOWN'}) ${ msg ? `: ${msg}` : '' }`);
                }

                results.push({
                    index: i,
                    txHash: txid.hash,
                    status: receipt?.receipt.result,
                });
                console.log(`✅ Success sending`);
            } catch (err) {
                console.error(`❌ Error sending:`, err.message);
                results.push({
                    index: i,
                    status: 'error',
                    error: err.message,
                });
            }
        }
        await getDeployerBalance(tronWeb, accounts);
    }

    async function waitTx(txid, tronWeb, tries = 20, delayMs = 2000) {
        for (let i = 0; i < tries; i++) {
            const info = await tronWeb.trx.getTransactionInfo(txid);
            if (info && Object.keys(info).length) return info;
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, delayMs));
        }
        console.log("");
        throw new Error(`Error: Timeout waiting for tx ${txid}`);
    }

    function formatParams(initParams) {
        const formatted = [];

        for (let i = 0; i < initParams.length; i++) {
            const originChainId = initParams[i].originChainId.toString();
            const targetChainId = initParams[i].targetChainId.toString();
            const depositType = initParams[i].depositType.toString();
            const withdrawType = initParams[i].withdrawType.toString();

            const originTokenAddress = toBytes32(initParams[i].originTokenAddress);
            const targetTokenAddress = toBytes32(initParams[i].targetTokenAddress);
            formatted.push([
                originChainId,
                targetChainId,
                depositType,
                withdrawType,
                originTokenAddress,
                targetTokenAddress,
                !!initParams[i].useTransfer,
                !!initParams[i].isAllowed,
                !!initParams[i].isCoin
            ]);
        }
        return formatted;
    }

    function toBytes32(address) {
        let hexPart;

        if (address.startsWith('T')) {
            const hexAddress = tronWeb.address.toHex(address);
            hexPart = hexAddress.slice(2);
        } else if (address.startsWith('0x')) {
            hexPart = address.slice(2).toLowerCase();
        } else {
            throw new Error(`Error: Unknown address format: ${address}`);
        }

        if (hexPart.length !== 40) {
            throw new Error(`Error: Invalid address length: ${address}`);
        }

        return '0x' + hexPart.padStart(64, '0');
    }

    async function getDeployerBalance(tronWeb, base58Address){
        const balanceSun = await tronWeb.trx.getBalance(base58Address);
        const balanceTRX = tronWeb.fromSun(balanceSun);
        console.log(`Account: ${base58Address} - Balance: ${balanceTRX} `);
        return balanceSun;
    }
};
