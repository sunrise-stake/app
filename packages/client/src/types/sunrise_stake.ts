export type SunriseStake = {
  "version": "0.1.0",
  "name": "sunrise_stake",
  "instructions": [
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transferFrom",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintMsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLiqPoolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintGsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositStakeAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "duplicationFlag",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAuthority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Marinade makes a distinction between the `stake_authority`(proof of ownership of stake account)",
            "and the `rent_payer`(pays to init the validator_record account). Both are required to be signers",
            "for the instruction. These two accounts can be treated as one and the same, and here, they are."
          ]
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintMsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintGsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "validatorIndex",
          "type": "u32"
        }
      ]
    },
    {
      "name": "orderUnstake",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ]
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Owner of the gSOL"
          ]
        },
        {
          "name": "newTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sunriseTicketAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimUnstakeTicket",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sunriseTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transferSolTo",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "liquidUnstake",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ]
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getLiqPoolTokenFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Blaze Stake Accounts",
            "//////////////////////////////////////////////////"
          ]
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "blazeStakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "triggerPoolRebalance",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orderUnstakeTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "epoch",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "orderUnstakeTicketAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "recoverTickets",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "extractToTreasury",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splDepositSol",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "depositorGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "splDepositStake",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeAccountDepositor",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositorGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "validatorList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolDepositAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splWithdrawSol",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "splWithdrawStake",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNewStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorStakeList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccountToSplit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLockAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateLockAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "impactNftProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ]
        },
        {
          "name": "impactNftState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMintAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftTokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "lockGsol",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "impactNftProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ]
        },
        {
          "name": "impactNftState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftTokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftHolderTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMasterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockGsol",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ]
        },
        {
          "name": "msolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "StateInput"
          }
        }
      ]
    },
    {
      "name": "updateState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ]
        },
        {
          "name": "msolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "StateInput"
          }
        }
      ]
    },
    {
      "name": "resizeState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "size",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMetadata",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateMetadata",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "initEpochReport",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "extractedYield",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "publicKey"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "gsolMint",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "gsolMintAuthorityBump",
            "type": "u8"
          },
          {
            "name": "msolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "liqPoolProportion",
            "docs": [
              "0-100 - The proportion of the total staked SOL that should be in the",
              "liquidity pool."
            ],
            "type": "u8"
          },
          {
            "name": "liqPoolMinProportion",
            "docs": [
              "0-100 - If unstaking would result in the proportion of SOL in the",
              "liquidity pool dropping below this value, trigger an delayed unstake",
              "for the difference"
            ],
            "type": "u8"
          },
          {
            "name": "blazeState",
            "type": "publicKey"
          },
          {
            "name": "marinadeMintedGsol",
            "type": "u64"
          },
          {
            "name": "blazeMintedGsol",
            "type": "u64"
          },
          {
            "name": "bsolAuthorityBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sunriseTicketAccount",
      "docs": [
        "Maps a marinade ticket account to a GSOL token holder"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "marinadeTicketAccount",
            "type": "publicKey"
          },
          {
            "name": "beneficiary",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "epochReportAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "tickets",
            "type": "u64"
          },
          {
            "name": "totalOrderedLamports",
            "type": "u64"
          },
          {
            "name": "extractableYield",
            "type": "u64"
          },
          {
            "name": "extractedYield",
            "type": "u64"
          },
          {
            "name": "currentGsolSupply",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lockAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tokenAccount",
            "type": "publicKey"
          },
          {
            "name": "startEpoch",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "updatedToEpoch",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "sunriseYieldAtStart",
            "type": "u64"
          },
          {
            "name": "yieldAccruedByOwner",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "publicKey"
          },
          {
            "name": "blazeState",
            "type": "publicKey"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "gsolMintAuthorityBump",
            "type": "u8"
          },
          {
            "name": "msolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "bsolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "liqPoolProportion",
            "type": "u8"
          },
          {
            "name": "liqPoolMinProportion",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CalculationFailure",
      "msg": "An error occurred when calculating an MSol value"
    },
    {
      "code": 6001,
      "name": "NotDelegated",
      "msg": "Stake account deposit must be delegated"
    },
    {
      "code": 6002,
      "name": "InvalidUpdateAuthority",
      "msg": "Wrong update authority for Sunrise state"
    },
    {
      "code": 6003,
      "name": "InvalidProgramAccount",
      "msg": "Invalid Program Account"
    },
    {
      "code": 6004,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6005,
      "name": "UnexpectedAccounts",
      "msg": "Unexpected Accounts"
    },
    {
      "code": 6006,
      "name": "UnexpectedMintSupply",
      "msg": "Unexpected gsol mint supply"
    },
    {
      "code": 6007,
      "name": "InvalidEpochReportAccount",
      "msg": "The epoch report account is not yet updated to the current epoch"
    },
    {
      "code": 6008,
      "name": "DelayedUnstakeTicketsNotYetClaimable",
      "msg": "Delayed unstake tickets for the current epoch can not yet be claimed"
    },
    {
      "code": 6009,
      "name": "TooManyTicketsClaimed",
      "msg": "The amount of delayed unstake tickets requested to be recovered exceeds the amount in the report"
    },
    {
      "code": 6010,
      "name": "RemainingUnclaimableTicketAmount",
      "msg": "The total ordered ticket amount exceeds the amount in all found tickets"
    },
    {
      "code": 6011,
      "name": "LockInsufficientBalance",
      "msg": "The source gsol account does not have the required balance to lock"
    },
    {
      "code": 6012,
      "name": "LockAccountIncorrectState",
      "msg": "The state of the lock account does not match the state in the instruction"
    },
    {
      "code": 6013,
      "name": "LockAccountIncorrectOwner",
      "msg": "The owner of the lock account does not match the authority in the instruction"
    },
    {
      "code": 6014,
      "name": "LockAccountIncorrectTokenAccount",
      "msg": "The lock token account does not match the token account in the lock account"
    },
    {
      "code": 6015,
      "name": "LockAccountAlreadyLocked",
      "msg": "The lock account has already been locked - unlock before re-locking"
    },
    {
      "code": 6016,
      "name": "LockAccountNotLocked",
      "msg": "The lock account has not been locked yet - lock before unlocking or updating"
    },
    {
      "code": 6017,
      "name": "LockAccountNotUpdated",
      "msg": "The lock account must be updated to the current epoch before it can be unlocked"
    },
    {
      "code": 6018,
      "name": "LockAccountAlreadyUpdated",
      "msg": "The lock account has already been updated to the current epoch. Cannot update twice in the same epoch."
    },
    {
      "code": 6019,
      "name": "CannotUnlockUntilNextEpoch",
      "msg": "The lock account was locked this epoch - wait at least one epoch before unlocking"
    }
  ]
};

export const IDL: SunriseStake = {
  "version": "0.1.0",
  "name": "sunrise_stake",
  "instructions": [
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transferFrom",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintMsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLiqPoolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintGsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositStakeAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "duplicationFlag",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAuthority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Marinade makes a distinction between the `stake_authority`(proof of ownership of stake account)",
            "and the `rent_payer`(pays to init the validator_record account). Both are required to be signers",
            "for the instruction. These two accounts can be treated as one and the same, and here, they are."
          ]
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintMsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintGsolTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "validatorIndex",
          "type": "u32"
        }
      ]
    },
    {
      "name": "orderUnstake",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ]
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Owner of the gSOL"
          ]
        },
        {
          "name": "newTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sunriseTicketAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimUnstakeTicket",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sunriseTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transferSolTo",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "liquidUnstake",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ]
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getLiqPoolTokenFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Blaze Stake Accounts",
            "//////////////////////////////////////////////////"
          ]
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "blazeStakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "triggerPoolRebalance",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orderUnstakeTicketAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "epoch",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "orderUnstakeTicketAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "recoverTickets",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "extractToTreasury",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splDepositSol",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "depositor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "depositorGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "splDepositStake",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeAccountDepositor",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "depositorGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "validatorList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolDepositAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "splWithdrawSol",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarStakeHistory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "splWithdrawStake",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userGsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNewStakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolWithdrawAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "validatorStakeList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccountToSplit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "managerFeeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakePoolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sysvarClock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakePoolProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nativeStakeProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLockAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateLockAccount",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "impactNftProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ]
        },
        {
          "name": "impactNftState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMintAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftTokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftNewCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "lockGsol",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "impactNftProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ]
        },
        {
          "name": "impactNftState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftTokenAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftHolderTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMasterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offsetTiers",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockGsol",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lockAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lockGsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ]
        },
        {
          "name": "msolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "StateInput"
          }
        }
      ]
    },
    {
      "name": "updateState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ]
        },
        {
          "name": "msolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "StateInput"
          }
        }
      ]
    },
    {
      "name": "resizeState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "size",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMetadata",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "updateMetadata",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "initEpochReport",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "marinadeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "blazeState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "liqPoolTokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "getMsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFrom",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "getBsolFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "epochReportAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "extractedYield",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "publicKey"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "gsolMint",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "gsolMintAuthorityBump",
            "type": "u8"
          },
          {
            "name": "msolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "liqPoolProportion",
            "docs": [
              "0-100 - The proportion of the total staked SOL that should be in the",
              "liquidity pool."
            ],
            "type": "u8"
          },
          {
            "name": "liqPoolMinProportion",
            "docs": [
              "0-100 - If unstaking would result in the proportion of SOL in the",
              "liquidity pool dropping below this value, trigger an delayed unstake",
              "for the difference"
            ],
            "type": "u8"
          },
          {
            "name": "blazeState",
            "type": "publicKey"
          },
          {
            "name": "marinadeMintedGsol",
            "type": "u64"
          },
          {
            "name": "blazeMintedGsol",
            "type": "u64"
          },
          {
            "name": "bsolAuthorityBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sunriseTicketAccount",
      "docs": [
        "Maps a marinade ticket account to a GSOL token holder"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "marinadeTicketAccount",
            "type": "publicKey"
          },
          {
            "name": "beneficiary",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "epochReportAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "tickets",
            "type": "u64"
          },
          {
            "name": "totalOrderedLamports",
            "type": "u64"
          },
          {
            "name": "extractableYield",
            "type": "u64"
          },
          {
            "name": "extractedYield",
            "type": "u64"
          },
          {
            "name": "currentGsolSupply",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lockAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tokenAccount",
            "type": "publicKey"
          },
          {
            "name": "startEpoch",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "updatedToEpoch",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "sunriseYieldAtStart",
            "type": "u64"
          },
          {
            "name": "yieldAccruedByOwner",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "publicKey"
          },
          {
            "name": "blazeState",
            "type": "publicKey"
          },
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "gsolMintAuthorityBump",
            "type": "u8"
          },
          {
            "name": "msolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "bsolAuthorityBump",
            "type": "u8"
          },
          {
            "name": "liqPoolProportion",
            "type": "u8"
          },
          {
            "name": "liqPoolMinProportion",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "CalculationFailure",
      "msg": "An error occurred when calculating an MSol value"
    },
    {
      "code": 6001,
      "name": "NotDelegated",
      "msg": "Stake account deposit must be delegated"
    },
    {
      "code": 6002,
      "name": "InvalidUpdateAuthority",
      "msg": "Wrong update authority for Sunrise state"
    },
    {
      "code": 6003,
      "name": "InvalidProgramAccount",
      "msg": "Invalid Program Account"
    },
    {
      "code": 6004,
      "name": "InvalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6005,
      "name": "UnexpectedAccounts",
      "msg": "Unexpected Accounts"
    },
    {
      "code": 6006,
      "name": "UnexpectedMintSupply",
      "msg": "Unexpected gsol mint supply"
    },
    {
      "code": 6007,
      "name": "InvalidEpochReportAccount",
      "msg": "The epoch report account is not yet updated to the current epoch"
    },
    {
      "code": 6008,
      "name": "DelayedUnstakeTicketsNotYetClaimable",
      "msg": "Delayed unstake tickets for the current epoch can not yet be claimed"
    },
    {
      "code": 6009,
      "name": "TooManyTicketsClaimed",
      "msg": "The amount of delayed unstake tickets requested to be recovered exceeds the amount in the report"
    },
    {
      "code": 6010,
      "name": "RemainingUnclaimableTicketAmount",
      "msg": "The total ordered ticket amount exceeds the amount in all found tickets"
    },
    {
      "code": 6011,
      "name": "LockInsufficientBalance",
      "msg": "The source gsol account does not have the required balance to lock"
    },
    {
      "code": 6012,
      "name": "LockAccountIncorrectState",
      "msg": "The state of the lock account does not match the state in the instruction"
    },
    {
      "code": 6013,
      "name": "LockAccountIncorrectOwner",
      "msg": "The owner of the lock account does not match the authority in the instruction"
    },
    {
      "code": 6014,
      "name": "LockAccountIncorrectTokenAccount",
      "msg": "The lock token account does not match the token account in the lock account"
    },
    {
      "code": 6015,
      "name": "LockAccountAlreadyLocked",
      "msg": "The lock account has already been locked - unlock before re-locking"
    },
    {
      "code": 6016,
      "name": "LockAccountNotLocked",
      "msg": "The lock account has not been locked yet - lock before unlocking or updating"
    },
    {
      "code": 6017,
      "name": "LockAccountNotUpdated",
      "msg": "The lock account must be updated to the current epoch before it can be unlocked"
    },
    {
      "code": 6018,
      "name": "LockAccountAlreadyUpdated",
      "msg": "The lock account has already been updated to the current epoch. Cannot update twice in the same epoch."
    },
    {
      "code": 6019,
      "name": "CannotUnlockUntilNextEpoch",
      "msg": "The lock account was locked this epoch - wait at least one epoch before unlocking"
    }
  ]
};
