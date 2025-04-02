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

// Helper functions for console output
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

// Function to fetch addresses from Google Sheets
async function fetchAddressesFromGoogleSheets() {
    try {
        const sheetId = "1rImLq4NMEAk5cPBGBW1-d3jI-4QC0oQoFU-JHrDostk";
        const gid = "362289845";
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

        logWait("Fetching addresses from Google Sheets...");

        const response = await axios.get(csvUrl);
        const csvData = response.data;

        // Parse CSV to get column B (index 1) starting from row 2
        const rows = csvData.split('\n');
        const addresses = [];

        for (let i = 1; i < rows.length; i++) {  // Start from row 2 (index 1)
            const columns = rows[i].split(',');
            if (columns.length > 1 && columns[1].trim()) {  // Check column B (index 1)
                addresses.push(columns[1].trim());
            }
        }

        logSuccess(`Retrieved ${addresses.length} addresses from Google Sheets`);
        return addresses;
    } catch (error) {
        logError(`Failed to fetch addresses from Google Sheets: ${error.message}`);
        throw error;
    }
}

// Function to generate random amount between min and max
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
        let tokenDecimals = 18; // Default decimals for ETH

        if (type.toLowerCase() === "token") {
            contract = await askQuestion(rl, "Enter token contract address: ");
            tokenSymbol = await askQuestion(rl, "Enter token symbol (for display): ");
            const decimalInput = await askQuestion(rl, "Enter token decimals (default: 18): ");
            tokenDecimals = parseInt(decimalInput || "18");
        }

        // Fetch addresses from Google Sheets
        const addresses = await fetchAddressesFromGoogleSheets();

        if (addresses.length === 0) {
            logError("No valid addresses found in the Google Sheet");
            rl.close();
            return;
        }

        // Ask for fixed or random amount
        const amountType = await askQuestion(rl, "Use fixed amount or random amount? (fixed/random): ");

        let fixedAmount, minAmount, maxAmount;

        if (amountType.toLowerCase() === "random") {
            minAmount = await askQuestion(rl, `Enter minimum amount: `);
            maxAmount = await askQuestion(rl, `Enter maximum amount: `);

            logInfo(`Will send random amounts between ${minAmount} and ${maxAmount} ${tokenSymbol} to each address`);
        } else {
            // Fixed amount (not in Gwei)
            fixedAmount = await askQuestion(rl, `Enter fixed amount to send: `);
            logInfo(`Will send fixed amount of ${fixedAmount} ${tokenSymbol} to each address`);
        }

        // Gas parameters
        const gasLimitInput = await askQuestion(rl, "Enter gas limit (default: 100000): ");
        const gasLimit = parseInt(gasLimitInput || "100000");

        const gasPriceInput = await askQuestion(rl, "Enter gas price in Gwei (default: 1.8): ");
        const gasPrice = ethers.parseUnits(gasPriceInput || "1.8", "gwei");

        logInfo(`Gas settings: ${gasLimit} gas limit, ${ethers.formatUnits(gasPrice, "gwei")} Gwei gas price`);

        logHeader("STARTING TRANSFERS");

        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];

            // Determine amount for this transaction
            let amount;
            if (amountType.toLowerCase() === "random") {
                const randomValue = getRandomAmount(parseFloat(minAmount), parseFloat(maxAmount));
                const formattedRandom = randomValue.toFixed(6); // Format to 6 decimal places
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
                        gasLimit: gasLimit,
                        gasPrice: gasPrice
                    };

                    logInfo(`Sending ${ethers.formatUnits(amount, tokenDecimals)} ${tokenSymbol} to ${address}`);
                    const tx = await wallet.sendTransaction(txParams);
                    logSuccess(`Transaction sent! Hash: ${tx.hash}`);

                    // Wait for 1 confirmation
                    logWait(`Waiting for transaction to be confirmed...`);
                    const receipt = await tx.wait(1);
                    logSuccess(`Transaction confirmed in block ${receipt.blockNumber}`);

                } else {
                    const tokenContract = new ethers.Contract(contract, [
                        "function transfer(address to, uint amount) public returns (bool)"
                    ], wallet);

                    const txOptions = {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice
                    };

                    logInfo(`Sending ${ethers.formatUnits(amount, tokenDecimals)} ${tokenSymbol} to ${address}`);
                    const tx = await tokenContract.transfer(address, amount, txOptions);
                    logSuccess(`Transaction sent! Hash: ${tx.hash}`);

                    // Wait for 1 confirmation
                    logWait(`Waiting for transaction to be confirmed...`);
                    const receipt = await tx.wait(1);
                    logSuccess(`Transaction confirmed in block ${receipt.blockNumber}`);
                }

                // Add small delay after confirmation before next transaction
                if (i < addresses.length - 1) {
                    logWait(`Preparing for next transaction...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                logError(`Error when sending to ${address}: ${error.message}`);
            }
        }

        logHeader("TRANSFER COMPLETE");
        logSuccess(`Successfully processed ${addresses.length} transactions`);

        const finalBalance = await provider.getBalance(wallet.address);
        logInfo(`Final wallet balance: ${ethers.formatEther(finalBalance)} ETH`);
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