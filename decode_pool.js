// Quick script to decode stake pool data and find validator list
const base64Data = "AQi2aQPmj/kyc1PszrLaqtyAYSpJobj5d6Ix+gjkmqjkDLf4OyG7Bfc9Q9LD8wfuyTaQ60QLt5MHlmfBHYAguresWdCxZ0G4T26SnTPN7GITkbByZxt7sbCEvPtSmBc/J/0AL1nbxvMXKEsKoi2su/UkttOrNyiAe7UkaFF4p/kgxwzG9/iGU7dOPoVx+mwaSBsMayHszFAZ7TFzuZiDbDj2CNLpcPk8ez1QGR5hGs2TqoClRrReyWXhiwWHFVaZyKy+io330TRBlc2b9EScxWN+/9wvGEkjPl5KMq8RBlm3bgbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpQKAGV1dHBABCfaGWq3MDAEMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECcAAAAAAADIAAAAAAAAAAAAABAnAAAAAAAACgAAAAAAAAAQJwAAAAAAAAoAAAAAAAAAAAAAECcAAAAAAAAIAAAAAAAAAGQAECcAAAAAAAAKAAAAAAAAAAAFVb+SqXMDAHSQtgnuRgQA84kCzFZQAwATqQkwRwcEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

const buffer = Buffer.from(base64Data, 'base64');

// Stake pool layout offsets (based on SPL stake pool structure)
// account_type: 0 (1 byte)
// manager: 1 (32 bytes)
// staker: 33 (32 bytes)
// stake_deposit_authority: 65 (32 bytes)
// stake_withdraw_bump_seed: 97 (1 byte)
// validator_list: 98 (32 bytes)
// reserve_stake: 130 (32 bytes)
// pool_mint: 162 (32 bytes)
// manager_fee_account: 194 (32 bytes)
// token_program_id: 226 (32 bytes)
// ... and more fields

console.log("Mainnet Blaze Stake Pool Data:");
console.log("Account Type:", buffer[0]);
console.log("Manager:", buffer.slice(1, 33).toString('hex'));
console.log("Staker:", buffer.slice(33, 65).toString('hex'));
console.log("Validator List:", buffer.slice(98, 130).toString('hex'));
console.log("Reserve Stake:", buffer.slice(130, 162).toString('hex'));

// Convert hex to base58
const { PublicKey } = require('@solana/web3.js');
const validatorListBytes = buffer.slice(98, 130);
const validatorListPubkey = new PublicKey(validatorListBytes);
console.log("\nValidator List Address:", validatorListPubkey.toString());

const reserveBytes = buffer.slice(130, 162);
const reservePubkey = new PublicKey(reserveBytes);
console.log("Reserve Account Address:", reservePubkey.toString());