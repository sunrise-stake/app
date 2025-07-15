#!/usr/bin/env ts-node

/**
 * Script to modify start_epoch and updated_to_epoch in a lock account fixture
 * Used for testing purposes to simulate different epoch scenarios
 * 
 * Usage: ts-node modify-lock-account-epochs.ts <lock-account-file> <start-epoch> <updated-to-epoch>
 * Example: ts-node modify-lock-account-epochs.ts ../tests/fixtures/scenario1/lock-account.json 455 456
 * 
 * The script reads the lock account JSON file, modifies the epoch values, and outputs
 * the modified JSON to stdout. You can redirect the output to a file if needed.
 */

import * as fs from 'fs';
import * as path from 'path';

// LockAccount structure offsets (after 8-byte discriminator)
const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;
const OPTION_U64_SIZE = 9; // 1 byte for Some/None + 8 bytes for u64
const U64_SIZE = 8;

// Calculate offsets
const STATE_ADDRESS_OFFSET = DISCRIMINATOR_SIZE;
const OWNER_OFFSET = STATE_ADDRESS_OFFSET + PUBKEY_SIZE;
const TOKEN_ACCOUNT_OFFSET = OWNER_OFFSET + PUBKEY_SIZE;
const START_EPOCH_OFFSET = TOKEN_ACCOUNT_OFFSET + PUBKEY_SIZE;
const UPDATED_TO_EPOCH_OFFSET = START_EPOCH_OFFSET + OPTION_U64_SIZE;

function writeU64LE(buffer: Buffer, value: bigint, offset: number): void {
  buffer.writeBigUInt64LE(value, offset);
}

function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error('Usage: ts-node modify-lock-account-epochs.ts <lock-account-file> <start-epoch> <updated-to-epoch>');
    process.exit(1);
  }

  const [filePath, startEpochStr, updatedToEpochStr] = args;
  const startEpoch = BigInt(startEpochStr);
  const updatedToEpoch = BigInt(updatedToEpochStr);

  // Validate epochs
  if (startEpoch < 0n || updatedToEpoch < 0n) {
    console.error('Error: Epochs must be non-negative');
    process.exit(1);
  }

  // Read the lock account file
  let accountData: any;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    accountData = JSON.parse(fileContent);
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

  // Modify start_epoch (Option<u64> at START_EPOCH_OFFSET)
  buffer[START_EPOCH_OFFSET] = 0x01; // Set to Some
  writeU64LE(buffer, startEpoch, START_EPOCH_OFFSET + 1);

  // Modify updated_to_epoch (Option<u64> at UPDATED_TO_EPOCH_OFFSET)
  buffer[UPDATED_TO_EPOCH_OFFSET] = 0x01; // Set to Some
  writeU64LE(buffer, updatedToEpoch, UPDATED_TO_EPOCH_OFFSET + 1);

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
  console.log(JSON.stringify(modifiedAccountData, null, 2));
}

main();