import * as hre from "hardhat";
import * as Config from "./core/config";
import * as GlobalConfig from "../test/utils/GlobalConfig";
import * as deploymentCore from "./core/deployment";

async function main() {
    try {
        const IS_LOCALHOST: boolean = hre.network.name == Config.NETWORK_LOCALHOST;
        if (!IS_LOCALHOST) {

            const {impContractAddress, contractAddress} = deploymentCore.getVerifyContractAddresses();

            if (
                hre.network.name == Config.NETWORK_WHITECHAIN ||
                hre.network.name == Config.NETWORK_WHITECHAINTESTNET ||
                hre.network.name == Config.NETWORK_WHITECHAINDEVNET
            ) {
                const contractVerificationData = {
                    contract_address: impContractAddress,
                    solidity_version: Config.VERSION_0_8_30,
                    license_type: Config.LICENSE_MIT,
                    input: "",
                    constructor_arguments: ""
                };

                if (deploymentCore.getContractName() == GlobalConfig.MAPPER_CONTRACT_NAME) {
                    await deploymentCore.verifyContract(
                        [
                            `main/modules/${GlobalConfig.BRIDGE_CONTRACT_NAME.toLowerCase()}`,
                            `main/interfaces`,
                            `main/libraries`,
                        ],
                        contractVerificationData
                    );
                } else {
                    await deploymentCore.verifyContract(
                        [
                            `main/modules/${GlobalConfig.MAPPER_CONTRACT_NAME.toLowerCase()}/${GlobalConfig.MAPPER_CONTRACT_NAME}`
                        ],
                        contractVerificationData
                    );
                }

               } else {
                   if (contractAddress) {
                       await hre.run("verify:verify", {
                           address: contractAddress,
                           constructorArguments: [],
                           contract: `contracts/main/modules/${deploymentCore.getContractName().toLowerCase()}/${deploymentCore.getContractName()}.sol:${deploymentCore.getContractName()}`,
                       });
                   } else {
                       throw new Error("contractAddress is missing");
                   }
               }
        } else {
            throw new Error("Verify on Localhost is not required");
        }
    } catch (e) {
        console.log("Verification failed:", e);
        return false;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
