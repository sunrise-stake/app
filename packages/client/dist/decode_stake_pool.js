"use strict";
// @solana/spl-stake-pool provides a simple function call for this but I couldn't
// get it to work because it uses version 0.1.8 of @solana/spl-token which causes
// clashes. The following code is directly from src
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStakePoolAccount =
  exports.StakePoolLayout =
  exports.AccountType =
    void 0;
const borsh_1 = require("@project-serum/borsh");
let AccountType;
(function (AccountType) {
  AccountType[(AccountType.Uninitialized = 0)] = "Uninitialized";
  AccountType[(AccountType.StakePool = 1)] = "StakePool";
  AccountType[(AccountType.ValidatorList = 2)] = "ValidatorList";
})((AccountType = exports.AccountType || (exports.AccountType = {})));
const feeFields = [
  (0, borsh_1.u64)("denominator"),
  (0, borsh_1.u64)("numerator"),
];
exports.StakePoolLayout = (0, borsh_1.struct)([
  (0, borsh_1.u8)("accountType"),
  (0, borsh_1.publicKey)("manager"),
  (0, borsh_1.publicKey)("staker"),
  (0, borsh_1.publicKey)("stakeDepositAuthority"),
  (0, borsh_1.u8)("stakeWithdrawBumpSeed"),
  (0, borsh_1.publicKey)("validatorList"),
  (0, borsh_1.publicKey)("reserveStake"),
  (0, borsh_1.publicKey)("poolMint"),
  (0, borsh_1.publicKey)("managerFeeAccount"),
  (0, borsh_1.publicKey)("tokenProgramId"),
  (0, borsh_1.u64)("totalLamports"),
  (0, borsh_1.u64)("poolTokenSupply"),
  (0, borsh_1.u64)("lastUpdateEpoch"),
  (0, borsh_1.struct)(
    [
      (0, borsh_1.u64)("unixTimestamp"),
      (0, borsh_1.u64)("epoch"),
      (0, borsh_1.publicKey)("custodian"),
    ],
    "lockup"
  ),
  (0, borsh_1.struct)(feeFields, "epochFee"),
  (0, borsh_1.option)((0, borsh_1.struct)(feeFields), "nextEpochFee"),
  (0, borsh_1.option)(
    (0, borsh_1.publicKey)(),
    "preferredDepositValidatorVoteAddress"
  ),
  (0, borsh_1.option)(
    (0, borsh_1.publicKey)(),
    "preferredWithdrawValidatorVoteAddress"
  ),
  (0, borsh_1.struct)(feeFields, "stakeDepositFee"),
  (0, borsh_1.struct)(feeFields, "stakeWithdrawalFee"),
  (0, borsh_1.option)((0, borsh_1.struct)(feeFields), "nextStakeWithdrawalFee"),
  (0, borsh_1.u8)("stakeReferralFee"),
  (0, borsh_1.option)((0, borsh_1.publicKey)(), "solDepositAuthority"),
  (0, borsh_1.struct)(feeFields, "solDepositFee"),
  (0, borsh_1.u8)("solReferralFee"),
  (0, borsh_1.option)((0, borsh_1.publicKey)(), "solWithdrawAuthority"),
  (0, borsh_1.struct)(feeFields, "solWithdrawalFee"),
  (0, borsh_1.option)((0, borsh_1.struct)(feeFields), "nextSolWithdrawalFee"),
  (0, borsh_1.u64)("lastEpochPoolTokenSupply"),
  (0, borsh_1.u64)("lastEpochTotalLamports"),
]);
function getStakePoolAccount(connection, stakePoolAddress) {
  return __awaiter(this, void 0, void 0, function* () {
    const account = yield connection.getAccountInfo(stakePoolAddress);
    if (!account) {
      throw new Error("Invalid stake pool account");
    }
    return exports.StakePoolLayout.decode(account.data);
  });
}
exports.getStakePoolAccount = getStakePoolAccount;
