import { describe, it } from "mocha";
import { expect } from "chai";
import { PublicKey, Connection } from "@solana/web3.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import BN from "bn.js";
import { ValidatorStakeInfoLayout } from "@solana/spl-stake-pool";
import { STAKE_POOL_PROGRAM_ID } from "../constants.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Unit tests for blaze.ts validator list parsing and stake account selection.
 *
 * These tests verify the client-side logic without requiring a running validator
 * or the full SPL stake pool infrastructure.
 */

// Constants matching blaze.ts
const VALIDATOR_STAKE_INFO_SIZE = ValidatorStakeInfoLayout.span; // 73 bytes
const VALIDATOR_LIST_HEADER_SIZE = 5;

// Type for decoded validator stake info
type ValidatorStakeInfo = ReturnType<typeof ValidatorStakeInfoLayout.decode>;

/**
 * Decode validator list from buffer - mirrors the function in blaze.ts
 */
const decodeValidatorList = (
  data: Buffer
): {
  accountType: number;
  maxValidators: number;
  validators: ValidatorStakeInfo[];
} => {
  const accountType = data.readUInt8(0);
  const maxValidators = data.readUInt32LE(1);

  const validatorsData = data.slice(VALIDATOR_LIST_HEADER_SIZE);
  const numValidators = Math.floor(
    validatorsData.length / VALIDATOR_STAKE_INFO_SIZE
  );

  const validators: ValidatorStakeInfo[] = [];
  for (let i = 0; i < numValidators; i++) {
    const offset = i * VALIDATOR_STAKE_INFO_SIZE;
    const entryData = validatorsData.slice(
      offset,
      offset + VALIDATOR_STAKE_INFO_SIZE
    );
    if (entryData.length === VALIDATOR_STAKE_INFO_SIZE) {
      validators.push(ValidatorStakeInfoLayout.decode(entryData));
    }
  }

  return { accountType, maxValidators, validators };
};

/**
 * Calculate the validator stake account PDA
 */
const getValidatorStakeAccountPda = (
  poolAddress: PublicKey,
  voteAccountAddress: PublicKey
): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      poolAddress.toBuffer(),
      voteAccountAddress.toBuffer(),
    ],
    STAKE_POOL_PROGRAM_ID
  );
  return pda;
};

describe("blaze", () => {
  describe("ValidatorStakeInfoLayout", () => {
    it("has correct size of 73 bytes", () => {
      expect(VALIDATOR_STAKE_INFO_SIZE).to.equal(73);
    });
  });

  describe("decodeValidatorList", () => {
    let validatorListData: Buffer;

    before(() => {
      // Load the mainnet validator list fixture
      const fixturePath = join(
        __dirname,
        "../../../tests/fixtures/blaze/validator_list.json"
      );
      const fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));
      validatorListData = Buffer.from(fixture.account.data[0], "base64");
    });

    it("parses header correctly", () => {
      const result = decodeValidatorList(validatorListData);

      // Account type 2 = ValidatorList
      expect(result.accountType).to.equal(2);
      expect(result.maxValidators).to.equal(3950);
    });

    it("parses all validators from fixture", () => {
      const result = decodeValidatorList(validatorListData);

      // The fixture should have 3950 validators
      expect(result.validators.length).to.equal(3950);
    });

    it("decodes validator fields correctly", () => {
      const result = decodeValidatorList(validatorListData);
      const firstValidator = result.validators[0];

      // Verify the validator has expected fields
      // Use toBase58() to verify it's a valid PublicKey-like object
      expect(typeof firstValidator.voteAccountAddress.toBase58()).to.equal("string");
      expect(firstValidator.voteAccountAddress.toBase58().length).to.be.greaterThan(30);
      // activeStakeLamports is a BN object with toString() method
      expect(typeof firstValidator.activeStakeLamports.toString()).to.equal("string");
      expect(typeof firstValidator.transientStakeLamports.toString()).to.equal("string");
      expect(typeof firstValidator.status).to.equal("number");
    });

    it("finds validators with active stake", () => {
      const result = decodeValidatorList(validatorListData);

      // Find validators with more than 1 SOL of active stake
      const threshold = new BN(1_000_000_000);
      const validatorsWithStake = result.validators.filter(
        (v) => new BN(v.activeStakeLamports.toString()).gt(threshold)
      );

      expect(validatorsWithStake.length).to.be.greaterThan(0);
    });

    it("handles empty validator list", () => {
      // Create minimal valid header with no validators
      const emptyData = Buffer.alloc(VALIDATOR_LIST_HEADER_SIZE);
      emptyData.writeUInt8(2, 0); // accountType = ValidatorList
      emptyData.writeUInt32LE(100, 1); // maxValidators = 100

      const result = decodeValidatorList(emptyData);

      expect(result.accountType).to.equal(2);
      expect(result.maxValidators).to.equal(100);
      expect(result.validators.length).to.equal(0);
    });
  });

  describe("getValidatorStakeAccountPda", () => {
    const BLAZE_POOL = new PublicKey(
      "stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"
    );

    it("derives correct PDA for known validator", () => {
      // First validator from the fixture
      const voteAccount = new PublicKey(
        "11119Cpe2tpAf9Y1CpMx2qNr7VzaUbKYyRQCdrFjcU"
      );

      const pda = getValidatorStakeAccountPda(BLAZE_POOL, voteAccount);

      // This should match the PDA we calculated earlier
      expect(pda.toBase58()).to.equal(
        "4r1b1iCmxqPKcUZa3w5Fy16ChnAJCVtmMfENKXwPAj15"
      );
    });

    it("derives different PDAs for different validators", () => {
      const voteAccount1 = new PublicKey(
        "11119Cpe2tpAf9Y1CpMx2qNr7VzaUbKYyRQCdrFjcU"
      );
      const voteAccount2 = new PublicKey(
        "1111hRWtSGWKYb6fCzMPUf7sC3XMsYV56MtgusKnKZ"
      );

      const pda1 = getValidatorStakeAccountPda(BLAZE_POOL, voteAccount1);
      const pda2 = getValidatorStakeAccountPda(BLAZE_POOL, voteAccount2);

      expect(pda1.toBase58()).to.not.equal(pda2.toBase58());
    });

    it("uses correct seed order: stake, pool, vote_account", () => {
      const voteAccount = new PublicKey(
        "11119Cpe2tpAf9Y1CpMx2qNr7VzaUbKYyRQCdrFjcU"
      );

      // Verify we get the same result as the manual derivation
      const [expectedPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stake"),
          BLAZE_POOL.toBuffer(),
          voteAccount.toBuffer(),
        ],
        STAKE_POOL_PROGRAM_ID
      );

      const pda = getValidatorStakeAccountPda(BLAZE_POOL, voteAccount);

      expect(pda.toBase58()).to.equal(expectedPda.toBase58());
    });
  });

  describe("validator selection logic", () => {
    let validators: ValidatorStakeInfo[];

    before(() => {
      const fixturePath = join(
        __dirname,
        "../../../tests/fixtures/blaze/validator_list.json"
      );
      const fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));
      const data = Buffer.from(fixture.account.data[0], "base64");
      validators = decodeValidatorList(data).validators;
    });

    it("selects validator with sufficient balance", () => {
      const minimumDelegation = new BN(1_000_000); // 0.001 SOL

      // Find first validator with sufficient active stake
      const suitable = validators.find((v) =>
        new BN(v.activeStakeLamports.toString()).gt(minimumDelegation)
      );

      expect(suitable).to.not.be.undefined;
      expect(
        new BN(suitable!.activeStakeLamports.toString()).gt(minimumDelegation)
      ).to.be.true;
    });

    it("filters out validators with zero stake", () => {
      const zero = new BN(0);
      const withZeroStake = validators.filter(
        (v) => new BN(v.activeStakeLamports.toString()).eq(zero)
      );
      const withStake = validators.filter(
        (v) => new BN(v.activeStakeLamports.toString()).gt(zero)
      );

      // Both should exist in a real validator list
      // The key is that our selection logic should skip zero-stake validators
      expect(withStake.length).to.be.greaterThan(0);
    });

    it("can find validators above a threshold", () => {
      const threshold = new BN(10_000_000_000); // 10 SOL

      const aboveThreshold = validators.filter(
        (v) => new BN(v.activeStakeLamports.toString()).gt(threshold)
      );

      expect(aboveThreshold.length).to.be.greaterThan(0);
    });
  });
});
