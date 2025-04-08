const ethers = require("ethers");
const readline = require("readline");
const { privateKey, rpcUrl } = require("./config");
const axios = require("axios");

// Console styling helpers
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    red: "\x1b[31m"
};

// Console helpers
function logHeader(text) {
    console.log(`\n${colors.bright}${colors.cyan}=== ${text} ===${colors.reset}\n`);
}
function logSuccess(text) {
    console.log(`${colors.green}✓ ${text}${colors.reset}`);
}
function logInfo(text) {
    console.log(`${colors.blue}ℹ ${text}${colors.reset}`);
}
function logWait(text) {
    console.log(`${colors.yellow}⏳ ${text}${colors.reset}`);
}
function logError(text) {
    console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Get random elements from array
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Fetch addresses from Google Sheets
async function fetchAddressesFromGoogleSheets() {
    try {
        const sheetId = "1rImLq4NMEAk5cPBGBW1-d3jI-4QC0oQoFU-JHrDostk";
        const gid = "362289845";
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

        logWait("Fetching addresses from Google Sheets...");

        const response = await axios.get(csvUrl);
        const csvData = response.data;

        const rows = csvData.split('\n');
        const addresses = [];

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');
            if (columns.length > 1 && columns[1].trim()) {
                addresses.push(columns[1].trim());
            }
        }

        logSuccess(`Retrieved ${addresses.length} total addresses`);
        return addresses;
    } catch (error) {
        logError(`Failed to fetch addresses: ${error.message}`);
        throw error;
    }
}

// Generate random amount
function getRandomAmount(min, max) {
    return Math.random() * (max - min) + min;
}

async function main() {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    logHeader("CRYPTO BATCH TRANSFER TOOL");
    logInfo(`Connected wallet: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    logInfo(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question(`${colors.bright}Send Native Token or ERC-20? (native/token): ${colors.reset}`, async (type) => {
        let contract;
        let tokenSymbol = "native token";
        let tokenDecimals = 18;

        if (type.toLowerCase() === "token") {
            contract = await askQuestion(rl, "Enter token contract address: ");
            tokenSymbol = await askQuestion(rl, "Enter token symbol (for display): ");
            const decimalInput = await askQuestion(rl, "Enter token decimals (default: 18): ");
            tokenDecimals = parseInt(decimalInput || "18");
        }

        const allAddresses = await fetchAddressesFromGoogleSheets();

        const howMany = await askQuestion(rl, `How many addresses to send to? (max: ${allAddresses.length}): `);
        const numToSend = Math.min(parseInt(howMany), allAddresses.length);
        const addresses = getRandomItems(allAddresses, numToSend);

        if (addresses.length === 0) {
            logError("No valid addresses to send to.");
            rl.close();
            return;
        }

        const amountType = await askQuestion(rl, "Use fixed amount or random amount? (fixed/random): ");
        let fixedAmount, minAmount, maxAmount;

        if (amountType.toLowerCase() === "random") {
            minAmount = await askQuestion(rl, `Enter minimum amount: `);
            maxAmount = await askQuestion(rl, `Enter maximum amount: `);
            logInfo(`Will send random amounts between ${minAmount} and ${maxAmount} ${tokenSymbol}`);
        } else {
            fixedAmount = await askQuestion(rl, `Enter fixed amount to send: `);
            logInfo(`Will send fixed amount of ${fixedAmount} ${tokenSymbol} to each address`);
        }

        const gasLimitInput = await askQuestion(rl, "Enter gas limit (default: 100000): ");
        const gasLimit = parseInt(gasLimitInput || "100000");

        // Get gas fees from network
        logWait("Fetching current gas fees from network...");
        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("5", "gwei");
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");

        logInfo(`Gas settings: ${gasLimit} gas limit`);
        logInfo(`- Max Fee Per Gas: ${ethers.formatUnits(maxFeePerGas, "gwei")} Gwei`);
        logInfo(`- Max Priority Fee: ${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} Gwei`);

        logHeader("STARTING TRANSFERS");

        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            let amount;

            if (amountType.toLowerCase() === "random") {
                const randomValue = getRandomAmount(parseFloat(minAmount), parseFloat(maxAmount));
                const formattedRandom = randomValue.toFixed(6);
                amount = ethers.parseUnits(formattedRandom, tokenDecimals);
                logInfo(`Generated random amount: ${formattedRandom} ${tokenSymbol}`);
            } else {
                amount = ethers.parseUnits(fixedAmount, tokenDecimals);
            }

            try {
                console.log(`\n${colors.cyan}Transaction ${i + 1}/${addresses.length} - Recipient: ${address}${colors.reset}`);

                if (type.toLowerCase() === "native") {
                    const txParams = {
                        to: address,
                        value: amount,
                        gasLimit,
                        maxFeePerGas,
                        maxPriorityFeePerGas
                    };

                    logInfo(`Sending ${ethers.formatUnits(amount, tokenDecimals)} ${tokenSymbol}`);
                    const tx = await wallet.sendTransaction(txParams);
                    logSuccess(`Transaction sent! Hash: ${tx.hash}`);
                    logWait(`Waiting for confirmation...`);
                    const receipt = await tx.wait(1);
                    logSuccess(`Confirmed in block ${receipt.blockNumber}`);
                } else {
                    const tokenContract = new ethers.Contract(contract, [
                        "function transfer(address to, uint amount) public returns (bool)"
                    ], wallet);

                    const tx = await tokenContract.transfer(address, amount, {
                        gasLimit,
                        maxFeePerGas,
                        maxPriorityFeePerGas
                    });

                    logSuccess(`Transaction sent! Hash: ${tx.hash}`);
                    logWait(`Waiting for confirmation...`);
                    const receipt = await tx.wait(1);
                    logSuccess(`Confirmed in block ${receipt.blockNumber}`);
                }

                if (i < addresses.length - 1) {
                    logWait(`Preparing next transaction...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                logError(`Error sending to ${address}: ${error.message}`);
            }
        }

        logHeader("TRANSFER COMPLETE");
        logSuccess(`Successfully processed ${addresses.length} transactions`);

        const finalBalance = await provider.getBalance(wallet.address);
        logInfo(`Final balance: ${ethers.formatEther(finalBalance)} ETH`);
        logInfo(`Total spent: ${ethers.formatEther(balance - finalBalance)} ETH`);

        rl.close();
    });
}

function askQuestion(rl, question) {
    return new Promise((resolve) => rl.question(`${colors.bright}${question}${colors.reset} `, resolve));
}

main().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
});
