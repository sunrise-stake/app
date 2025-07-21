#!/usr/bin/env ts-node

/**
 * Script to modify epoch in an epoch report account fixture
 * Used for testing purposes to simulate different epoch scenarios
 * 
 * Usage: ts-node modify-epoch-report-account.ts <epoch-report-file> <epoch>
 * Example: ts-node modify-epoch-report-account.ts ../tests/fixtures/scenarios/epoch_report_account.json 1
 * 
 * The script reads the epoch report account JSON file, modifies the epoch value, and outputs
 * the modified JSON to stdout. You can redirect the output to a file if needed.
 */

import * as fs from 'fs';
import BN from 'bn.js';

// EpochReportAccount structure offsets (after 8-byte discriminator)
const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;
const U64_SIZE = 8;

// Calculate offsets
const STATE_ADDRESS_OFFSET = DISCRIMINATOR_SIZE;
const EPOCH_OFFSET = STATE_ADDRESS_OFFSET + PUBKEY_SIZE;

function writeU64LE(buffer: Buffer, value: bigint, offset: number): void {
  buffer.writeBigUInt64LE(value, offset);
}

function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: ts-node modify-epoch-report-account.ts <epoch-report-file> <epoch>');
    process.exit(1);
  }

  const [filePath, epochStr] = args;
  const epoch = BigInt(epochStr);

  // Read the epoch report account file
  let accountData: any;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Parse with reviver to convert numbers to BN
    accountData = JSON.parse(fileContent, (key, value) => {
      // Convert numbers to BN to preserve precision
      if (typeof value === 'number' && Number.isInteger(value)) {
        return new BN("" + value);
      }
      return value;
    });
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    process.exit(1);
  }

  // Decode the base64 data
  const dataArray = accountData.account.data;
  if (!Array.isArray(dataArray) || dataArray.length !== 2 || dataArray[1] !== 'base64') {
    console.error('Error: Invalid account data format');
    process.exit(1);
  }

  const buffer = Buffer.from(dataArray[0], 'base64');

  // Modify epoch (u64 at EPOCH_OFFSET)
  writeU64LE(buffer, epoch, EPOCH_OFFSET);

  // Create the modified account data
  const modifiedAccountData = {
    ...accountData,
    account: {
      ...accountData.account,
      data: [
        buffer.toString('base64'),
        'base64'
      ]
    }
  };

  // Output the modified JSON to stdout
  console.log(JSON.stringify(modifiedAccountData, (key, value) => {
    // Convert BN back to decimal string for JSON output
    if (BN.isBN(value)) {
      return value.toString(10); // Force decimal representation
    }
    return value;
  }, 2));
}

main();