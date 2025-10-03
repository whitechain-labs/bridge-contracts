require('dotenv').config();

module.exports = {
    networks: {
        mainnet: {
            privateKey: process.env.MAINNET_PRIVATE_KEY,
            userFeePercentage: 100,
            feeLimit: 1000 * 1e6,
            fullHost: 'https://api.trongrid.io',
            network_id: '1'
        },
        nile: {
            // Obtain test coin at https://nileex.io/join/getJoinPage
            privateKey: process.env.NILE_PRIVATE_KEY,
            userFeePercentage: 100,
            feeLimit: 1000 * 1e6,
            fullHost: 'https://nile.trongrid.io',
            network_id: '3'
        },
    },
    compilers: {
        solc: {
            version: '0.8.24',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
                // evmVersion: 'istanbul',
                // viaIR: true,
            }
        }
    }
};
