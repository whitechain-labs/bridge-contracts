const tronConfig = require('../tronbox.js');
const { TronWeb } = require('tronweb');

const MAPPER_CONTRACT_NAME = "Mapper";
const BRIDGE_CONTRACT_NAME = "Bridge";
const PROXY_CONTRACT_NAME = "ERC1967Proxy";
const Mapper = artifacts.require(MAPPER_CONTRACT_NAME);
const Bridge = artifacts.require(BRIDGE_CONTRACT_NAME);
const ERC1967Proxy = artifacts.require(PROXY_CONTRACT_NAME);

module.exports = async function (deployer, network, accounts) {

    if (getContractName() === MAPPER_CONTRACT_NAME) {
        await deployer.deploy(Mapper);
        const mapperImplContract = await Mapper.deployed();

        const mapperInitData = Mapper.web3.eth.abi.encodeFunctionCall(
            {
                name: "initialize",
                type: "function",
                inputs: [],
            },
            []
        );
        await deployer.deploy(ERC1967Proxy, mapperImplContract.address, mapperInitData);
        const mapperProxyContract = await ERC1967Proxy.deployed();
    }

    if (getContractName() === BRIDGE_CONTRACT_NAME) {
        await deployer.deploy(Bridge);
        const bridgeImplContract = await Bridge.deployed();
        const MAPPER_ADDRESS = process.env[`${network.toUpperCase()}_MAPPER_ADDRESS`] || "";

        if (!MAPPER_ADDRESS || MAPPER_ADDRESS.trim() === "") {
            throw new Error('Environment variable MAPPER_ADDRESS is not set or empty');
        }

        let fullHost;
        if (network === 'mainnet') {
            fullHost = tronConfig.networks.mainnet.fullHost;
        } else if (network === 'nile') {
            fullHost = tronConfig.networks.nile.fullHost;
        }

        const tronWeb = new TronWeb({ fullHost: fullHost });
        const hex = tronWeb.address.toHex(MAPPER_ADDRESS);
        const hexMapperAddress = '0x' + hex.slice(2);

        const bridgeInitData = Bridge.web3.eth.abi.encodeFunctionCall(
            {
                name: "initialize",
                type: "function",
                inputs: [{
                    name: "initParams",
                    type: "tuple",
                    components: [
                        { name: "mapperAddress", type: "address" }
                    ]
                }]
            },
            [ [ hexMapperAddress ] ]
        );

        await deployer.deploy(ERC1967Proxy, bridgeImplContract.address, bridgeInitData);
        const bridgeProxyContract = await ERC1967Proxy.deployed();
    }

     function getContractName() {
        if (!process.env.CONTRACT || process.env.CONTRACT.trim() === "") {
            throw new Error('Environment variable CONTRACT is not set or empty');
        }

        return process.env.CONTRACT;
    }

};

