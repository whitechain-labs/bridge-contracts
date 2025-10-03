import * as hre from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import * as Config from './config';
import {ContractFactory, ParamType} from "ethers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {getImplementationAddress} from '@openzeppelin/upgrades-core';
import console from "node:console";
import axios from "axios";

export const erc20ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

var logFile: fs.WriteStream;

export async function getChainId(): Promise<number> {
  const id = await hre.ethers.provider.send('eth_chainId', []);
  return parseInt(id.replace(/^0x/, ''), 16);
}

export async function getAccount(islocalhost: boolean, accountId: number, name: string ) {
  const accounts = await hre.ethers.getSigners();
  return islocalhost ? await accounts[accountId].getAddress() : process.env[`${hre.network.name.toUpperCase()}_${name}_ADDRESS`] || "";
}

export function constructorArguments(types: Array<string | ParamType>, values: Array<any>) {
  let constructorArguments = hre.ethers.AbiCoder.defaultAbiCoder().encode(
      types,
      values
  );
  return constructorArguments.slice(2);
}

export function getContractName(): string {
  if (!process.env.CONTRACT || process.env.CONTRACT.trim() === "") {
    throw new Error('Environment variable CONTRACT is not set or empty');
  }

  return process.env.CONTRACT;
}

export async function start() {
  const FILE_NAME_FOR_ADDRESS_HISTORY: string = process.env[`${hre.network.name.toUpperCase()}_FILE_NAME_FOR_ADDRESS_HISTORY`] || "";
  logFile = _createDeploymentLogFile(FILE_NAME_FOR_ADDRESS_HISTORY);
  _logToDeploymentFile(logFile, FILE_NAME_FOR_ADDRESS_HISTORY);
  const IS_LOCALHOST: boolean = hre.network.name == Config.NETWORK_LOCALHOST;
  const accounts = await hre.ethers.getSigners();
  let secretKey: string = IS_LOCALHOST ? "" : process.env[`SECRET_KEY`] || "";

  const deployer: any = secretKey === "" && IS_LOCALHOST ? accounts[0] : IS_LOCALHOST ? (() => { throw new Error("Error: secretKey is empty!"); }) : new hre.ethers.Wallet(secretKey, hre.ethers.provider);
  const adminCoinsBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Account: ${deployer.address} - Balance: ${hre.ethers.formatEther(adminCoinsBalance)} ${_getTicker(hre.network.name)}`);

  return {deployer};
}

export async function deployContract(
    isLocalhost: boolean,
    nameContract: string,
    deployer: SignerWithAddress,
    args:  any[] | object = {}
) {
  try {
    let contractFactory = await _startDeployment(nameContract, !isLocalhost);
    const contract: any = Array.isArray(args)
        ? await contractFactory.connect(deployer).deploy(...args)
        : await contractFactory.connect(deployer).deploy(args);
    if(!isLocalhost) {
      await contract.waitForDeployment();
    }

    await _endDeployment(nameContract, contract, deployer, !isLocalhost);
    return contract;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function deployUUPSProxy(
    isLocalhost: boolean,
    nameContract: string,
    deployer: SignerWithAddress,
    args: any = {}
) {
  let contractFactory: ContractFactory = await _startDeployment(nameContract, !isLocalhost);

  let contract: any = await hre.upgrades.deployProxy(
      contractFactory,
      [
        args
      ],
      { initializer: false },
  );

  await contract.waitForDeployment();

  let initialize = await contract.initialize(args);

  await _endDeployment(nameContract, contract, deployer, !isLocalhost);

  return { contract, contractFactory, initialize };
}

export async function deployUUPSProxyWithCharge(
    isLocalhost: boolean,
    nameContract: string,
    deployer: SignerWithAddress,
    tokenAddress: string,
    amount: bigint,
    args: any = {}
) {
  let contractFactory: ContractFactory = await _startDeployment(nameContract, !isLocalhost);

  let contract: any = await hre.upgrades.deployProxy(
      contractFactory,
      [
        args
      ],
      { initializer: false },
  );

  await contract.waitForDeployment();

  let transactionResponse;

  const tokenContract = await hre.ethers.getContractAt(
      erc20ABI,
      tokenAddress
  );
  transactionResponse = await tokenContract.approve(
      contract.target,
      amount,
  );

  if (!isLocalhost) {
    await transactionResponse.wait(2);
  }

  let initialize = await contract.initialize(args);

  await _endDeployment(nameContract, contract, deployer, !isLocalhost);

  return { contract, contractFactory, initialize };
}

export async function finish() {
  const lastFile = getLastCreatedBuildInfoFile();
  await saveFileName(lastFile,'fileName', logFile);

  logFile.end();
}

async function saveFileName(fileName: any, title: string, fileObj: any) {
  let proxyText: string = title +': '+ fileName;
  const resultMessage = `${proxyText}`;
  console.error(proxyText);
  // Write to file
  _logToDeploymentFile(fileObj, resultMessage);
}
function getLastCreatedBuildInfoFile(): string {
  const buildInfoDir = path.join(__dirname, '../../artifacts/build-info');
  const files: string[] = fs.readdirSync(buildInfoDir);

  if (files.length === 0) {
    throw new Error('No /build-info files found');
  }

  interface FileWithStats {
    file: string;
    time: Date;
  }

  // We get information about each file, including the creation time
  const filesWithStats: FileWithStats[] = files.map((file: string): FileWithStats => {
    const filePath = path.join(buildInfoDir, file);
    const stats = fs.statSync(filePath);
    return { file, time: stats.mtime };
  });

  // We sort the files by modification time (mtime) and take the latest one
  filesWithStats.sort((a: FileWithStats, b: FileWithStats) => b.time.getTime() - a.time.getTime());
  const lastCreatedFile = filesWithStats[0].file;
  if (lastCreatedFile.length > 0) {
    return lastCreatedFile;
  }
  throw new Error('No /build-info file found');
}

export async function showResult(contract: any, name: string) {
  let proxyText: string = name +': '+ contract.target;
  console.error(proxyText);
  let result = proxyText;
  try {
    const implContractAddress = await getImplementationAddress(hre.ethers.provider, contract.target);
    let impText: string = 'Imp' + name + ': '+ implContractAddress;
    console.error(impText);
    result += `\n${impText}`;
  } catch (e) {

  }

  const resultMessage = result;

  // Write to file
  _logToDeploymentFile(logFile, resultMessage);
}

export function _getTicker(network: string): string {
  switch (network) {
    case Config.NETWORK_WHITECHAIN:
    case Config.NETWORK_WHITECHAINTESTNET:
    case Config.NETWORK_WHITECHAINDEVNET:
      return 'WBT';
    default:
      return 'ETH';
  }
}

export async function verifyContract(exclude: string[], contractVerificationData: any) {
  const buildInfoDir = path.join(__dirname, '../../artifacts', 'build-info');

  fs.readdir(buildInfoDir, async (err, files) => {
    if (err) {
      throw new Error("buildInfoDir is missing" , err);
    }

    for (const file of files) {
      const filePath = path.join(buildInfoDir, file);

      // Reading file contents
      fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
          throw new Error("Reading file contents", err);
        }

        const buildInfo = JSON.parse(data);
        const filteredInput = {
          ...buildInfo.input, // Take the entire buildInfo.input object
          sources: Object.keys(buildInfo.input.sources) // We filter only sources
              .filter(key => {
                const routTestExclude = key.startsWith("contracts/tests/");
                const routExclude = Array.isArray(exclude)
                    ? exclude.some(excludedPath => key.startsWith(`contracts/${excludedPath}`))
                    : false;

                return !routTestExclude && !routExclude;
              }) // Exclude test files
              .reduce((acc, key) => {
                acc[key] = buildInfo.input.sources[key];
                return acc;
              }, {} as Record<string, any>)
        };

        const FILE_NAME_FOR_ADDRESS_HISTORY: string = process.env[`${hre.network.name.toUpperCase()}_FILE_NAME_FOR_ADDRESS_HISTORY`] || "";
        const logDir = getLogDir(FILE_NAME_FOR_ADDRESS_HISTORY, "filteredSources");
        const logFilePath = path.join(logDir, `${Math.floor(Date.now() / 1000)}.json`);

        // Create a directory if it does not exist
        fs.mkdirSync(logDir, { recursive: true });
        fs.writeFileSync(logFilePath, JSON.stringify(filteredInput, null, 2), "utf-8");

        console.log(`File saved: ${logFilePath}`);

        contractVerificationData.input = filteredInput;

        const SECRET_VALUE: string = process.env[`${hre.network.name.toUpperCase()}_API_KEY`] || "";
        const headers = {
          'secret-value': SECRET_VALUE
        };
        try {
          const VERIFICATION_PROVIDER: string = process.env[`${hre.network.name.toUpperCase()}_VERIFICATION_PROVIDER`] || "";
          const response = await axios.post(
              VERIFICATION_PROVIDER,
              contractVerificationData,
              {headers}
          );
          console.log("Verification response:", response.data.success, response.data.details ? response.data.details : '');
        } catch (error: any) {
          console.log(error.response.data);
        }
      });
    }
  });
}

export function getVerifyContractAddresses() {
  let impContractAddress: any;
  let contractAddress: any;
  const FILE_NAME_FOR_ADDRESS_HISTORY: string = process.env[`${hre.network.name.toUpperCase()}_FILE_NAME_FOR_ADDRESS_HISTORY`] || "";
  const logsDir = getLogDir(FILE_NAME_FOR_ADDRESS_HISTORY);

  const logFileContent = getLatestLogFile(logsDir);

  if (logFileContent) {
    impContractAddress = logFileContent.match(new RegExp(`Imp${getContractName()}:\\s*(0x[a-fA-F0-9]{40})`))?.[1];
    contractAddress = logFileContent.match(new RegExp(`${getContractName()}:\\s*(0x[a-fA-F0-9]{40})`))?.[1];
  } else {
    throw new Error("Log File Content is null");
  }

  if (!contractAddress || contractAddress.trim() === "" || (impContractAddress && impContractAddress.trim() === "")) {
    throw new Error("ContractAddress is failed");
  }
  return {impContractAddress, contractAddress};
}

export function getLatestLogFile(directoryPath: string): string | null {
  // We get all files in the directory
  const allEntries = fs.readdirSync(directoryPath);

  // Filter only files (exclude directories)
  const files = allEntries.filter(entry => {
    const fullPath = path.join(directoryPath, entry);
    return fs.statSync(fullPath).isFile(); // true только для файлов
  });

  if (files.length === 0) {
    console.error("No log files found");
    return null;
  }

  // Get the full path to each file and its creation time
  const latestFile = files
      .map(file => ({
        file,
        time: fs.statSync(path.join(directoryPath, file)).mtime.getTime() // время модификации (последнее изменение)
      }))
      .sort((a, b) => b.time - a.time)[0].file; // сортируем по времени и выбираем последний

  // Full path to the last file
  const logFilePath = path.join(directoryPath, latestFile);

  // Reading file contents
  return fs.readFileSync(logFilePath, 'utf-8');
}

export function getLogDir(fileName: string, filteredSourcesFileName = "") {
  return path.join(
      __dirname,
      'logs',
      hre.network.name,
      fileName,
      getContractName(),
      filteredSourcesFileName
  );
}

function _createDeploymentLogFile(fileName: string) {
  const logDir = getLogDir(fileName);
  const logFilePath = path.join(logDir, `${Math.floor(Date.now() / 1000)}.log`);

  // Create a directory if it does not exist
  fs.mkdirSync(logDir, { recursive: true });

  // Create a stream to write to a file
  const logFile: fs.WriteStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  return logFile;
}

function _logToDeploymentFile(logFile: fs.WriteStream, message: string) {
  logFile.write(message + '\n');
}

async function _startDeployment(nameContract: string, isDeploy: boolean = false) {
  const contractFactory: ContractFactory = await hre.ethers.getContractFactory(nameContract);
  if(isDeploy) {
    console.log(`Deploying ${nameContract}...`);
  }
  return contractFactory;
}

async function _endDeployment(nameContract: string, contract: any, deployer: SignerWithAddress, isDeploy: boolean = false) {
  if (isDeploy) {
    console.log(`${nameContract} deployed to:`, contract.target);
    const balanceEnd = await hre.ethers.provider.getBalance(deployer.address);
    console.log(
        `Account: ${deployer.address} - Balance: ${hre.ethers.formatEther(balanceEnd)} ${_getTicker(hre.network.name)}`,
    );
  }
}