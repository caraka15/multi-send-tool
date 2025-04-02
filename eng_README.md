# MultiSend Token & ETH Distribution Tool

## Overview

This tool enables efficient batch transfers of both native ETH and ERC20 tokens to multiple recipient addresses in a single operation. It can read recipient addresses from a Google Sheets document and supports both fixed and random amount distributions.

## Features

- Send native ETH or ERC20 tokens to multiple addresses
- Import recipient addresses directly from Google Sheets
- Choose between fixed or random amounts for each recipient
- Customizable gas settings
- Real-time transaction status tracking
- Colorized console output for better readability
- Automatic confirmation waiting for transaction security

## Prerequisites

- Node.js installed on your system
- Basic understanding of Ethereum transactions
- A Google Sheet with recipient addresses in column B

## Installation

1. Clone the repository:

```bash
git clone https://github.com/caraka15/multi-send-tool.git
cd multi-send-tool
```

2. Install dependencies:

```bash
npm install ethers readline axios dotenv
```

3. Create a `.env` file in the root directory with the following content:

```
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
RPC_URL=YOUR_RPC_URL
```

## Usage

1. Run the script:

```bash
node bot.js
```

2. Follow the interactive prompts:
   - Choose between sending native ETH or ERC20 tokens
   - For ERC20 tokens, enter the contract address, symbol, and decimals
   - Choose between fixed or random amounts for each transfer
   - Set gas parameters (gas limit and gas price)
   - The tool will fetch addresses from your Google Sheet and perform the transfers

## Google Sheets Integration

The tool automatically fetches recipient addresses from a Google Sheet:

1. Create a Google Sheet with recipient addresses in column B (starting from row 2)
2. Make sure the sheet is publicly accessible or has sharing settings set to "Anyone with the link can view"
3. If you want to use a different Google Sheet, update the `sheetId` and `gid` variables in the script

Current default Google Sheet ID: `1rImLq4NMEAk5cPBGBW1-d3jI-4QC0oQoFU-JHrDostk`

## Contract Integration

For Sepolia testnet users, you can use the MultiSend contract deployed at:
`0x847d23084C474E7a0010Da5Fa869b40b321C8D7b`

This contract allows you to:

- Deploy your own tokens
- Use the native multi-send functionality via the contract

Access the contract at: [Sepolia Contract Interface](https://sepolia.tea.xyz/address/0x847d23084C474E7a0010Da5Fa869b40b321C8D7b?tab=write_contract)

## Security

- The tool uses environment variables via dotenv to keep your private key secure
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file to prevent accidental commits

## Transaction Types

### Native ETH Transfers

When selecting "native" transfer type, the tool will send ETH directly to the recipient addresses.

### ERC20 Token Transfers

When selecting "token" transfer type, you'll need to provide:

- The token contract address
- Token symbol (for display purposes)
- Token decimals (default is 18)

## Amount Distribution Options

1. **Fixed Amount**: Send the same amount to each recipient
2. **Random Amount**: Send a random amount (between your specified min and max) to each recipient

## Customizing Gas Settings

You can customize:

- Gas Limit (default: 100000)
- Gas Price in Gwei (default: 1.8)

## Troubleshooting

Common issues and their solutions:

1. **Insufficient Funds Error**: Ensure your wallet has enough ETH for the transfers and gas costs
2. **Gas Price Too Low**: If transactions are pending for too long, increase the gas price
3. **Google Sheets Access Error**: Make sure your Google Sheet is publicly accessible
4. **Missing Environment Variables**: Check that your `.env` file is correctly configured and loaded

## Best Practices

- Always test with small amounts on testnets first
- Monitor gas prices and adjust accordingly
- Regularly check your script's output for any errors
- Keep your wallet's private key secure at all times
