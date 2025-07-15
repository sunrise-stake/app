/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sunrise_stake.json`.
 */
export type SunriseStake = {
  "address": "sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6",
  "metadata": {
    "name": "sunriseStake",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addLockedGsol",
      "discriminator": [
        90,
        8,
        246,
        91,
        40,
        150,
        98,
        249
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lockAccount",
          "writable": true
        },
        {
          "name": "sourceGsolAccount",
          "writable": true
        },
        {
          "name": "lockGsolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "epochReportAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
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
      "discriminator": [
        76,
        217,
        142,
        208,
        224,
        30,
        255,
        144
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "marinadeTicketAccount",
          "writable": true,
          "relations": [
            "sunriseTicketAccount"
          ]
        },
        {
          "name": "sunriseTicketAccount",
          "writable": true
        },
        {
          "name": "msolAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "transferSolTo",
          "writable": true,
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createMetadata",
      "discriminator": [
        30,
        35,
        117,
        134,
        196,
        139,
        44,
        25
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMint",
          "writable": true
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "updateAuthority",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "tokenMetadataProgram"
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
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMint",
          "writable": true
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "liqPoolMint",
          "writable": true
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolMsolLegAuthority"
        },
        {
          "name": "liqPoolMintAuthority"
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "transferFrom",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintMsolTo",
          "writable": true
        },
        {
          "name": "mintLiqPoolTo",
          "writable": true
        },
        {
          "name": "mintGsolTo",
          "writable": true
        },
        {
          "name": "msolMintAuthority"
        },
        {
          "name": "msolTokenAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
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
      "discriminator": [
        110,
        130,
        115,
        41,
        164,
        102,
        2,
        59
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMint",
          "writable": true
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "validatorList",
          "writable": true
        },
        {
          "name": "stakeList",
          "writable": true
        },
        {
          "name": "stakeAccount",
          "writable": true
        },
        {
          "name": "duplicationFlag",
          "writable": true
        },
        {
          "name": "stakeAuthority",
          "docs": [
            "Marinade makes a distinction between the `stake_authority`(proof of ownership of stake account)",
            "and the `rent_payer`(pays to init the validator_record account). Both are required to be signers",
            "for the instruction. These two accounts can be treated as one and the same, and here, they are."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "mintMsolTo",
          "writable": true
        },
        {
          "name": "mintGsolTo",
          "writable": true
        },
        {
          "name": "msolMintAuthority"
        },
        {
          "name": "msolTokenAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "stakeProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
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
      "name": "extractToTreasury",
      "discriminator": [
        255,
        27,
        105,
        106,
        128,
        251,
        35,
        81
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "blazeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "liqPoolMint"
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "getBsolFrom",
          "writable": true
        },
        {
          "name": "getBsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "epochReportAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": []
    },
    {
      "name": "initEpochReport",
      "discriminator": [
        58,
        76,
        227,
        36,
        198,
        20,
        251,
        192
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "updateAuthority",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "marinadeState",
          "docs": [
            "We use UncheckedAccount here instead of the typed MarinadeState account because:",
            "1. The on-chain Marinade account has discriminator for \"account:State\"",
            "2. But Anchor's declare_program! generates type \"MarinadeState\" expecting \"account:MarinadeState\"",
            "3. This would cause AccountDiscriminatorMismatch errors with typed accounts",
            "",
            "See utils/marinade.rs::deserialize_marinade_state() for full explanation"
          ],
          "relations": [
            "state"
          ]
        },
        {
          "name": "blazeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "liqPoolMint"
        },
        {
          "name": "liqPoolSolLegPda"
        },
        {
          "name": "liqPoolMsolLeg"
        },
        {
          "name": "liqPoolTokenAccount"
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "getBsolFrom"
        },
        {
          "name": "getBsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "relations": [
            "state"
          ]
        },
        {
          "name": "epochReportAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "extractedYield",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initLockAccount",
      "discriminator": [
        25,
        95,
        141,
        90,
        105,
        137,
        171,
        135
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lockAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "lockGsolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "liquidUnstake",
      "discriminator": [
        30,
        30,
        119,
        240,
        191,
        227,
        12,
        16
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "liqPoolMint",
          "writable": true
        },
        {
          "name": "gsolMint",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMintAuthority",
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "writable": true
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "getLiqPoolTokenFrom",
          "writable": true
        },
        {
          "name": "gsolTokenAccount",
          "writable": true
        },
        {
          "name": "gsolTokenAccountAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "bsolTokenAccount",
          "docs": [
            "Blaze Stake Accounts",
            "//////////////////////////////////////////////////"
          ],
          "writable": true
        },
        {
          "name": "bsolAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "blazeStakePool",
          "writable": true
        },
        {
          "name": "stakePoolWithdrawAuthority"
        },
        {
          "name": "reserveStakeAccount",
          "writable": true
        },
        {
          "name": "managerFeeAccount",
          "writable": true
        },
        {
          "name": "bsolMint",
          "writable": true
        },
        {
          "name": "sysvarStakeHistory"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "nativeStakeProgram"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
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
      "name": "lockGsol",
      "discriminator": [
        59,
        75,
        242,
        132,
        248,
        27,
        7,
        254
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lockAccount",
          "writable": true
        },
        {
          "name": "sourceGsolAccount",
          "writable": true
        },
        {
          "name": "lockGsolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "epochReportAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "impactNftProgram",
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ],
          "address": "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
        },
        {
          "name": "impactNftState"
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "nftMint",
          "docs": [
            "by the impact nft program. If not, then it is not used (re-locking a lock account does not",
            "result in a new NFT being minted)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  105,
                  109,
                  112,
                  97,
                  99,
                  116,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "nftMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  105,
                  109,
                  112,
                  97,
                  99,
                  116,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "nftTokenAuthority"
        },
        {
          "name": "nftMetadata",
          "writable": true
        },
        {
          "name": "nftHolderTokenAccount",
          "writable": true
        },
        {
          "name": "nftMasterEdition",
          "writable": true
        },
        {
          "name": "offsetMetadata",
          "writable": true
        },
        {
          "name": "offsetTiers"
        },
        {
          "name": "nftCollectionMint"
        },
        {
          "name": "nftCollectionMetadata",
          "writable": true
        },
        {
          "name": "nftCollectionMasterEdition"
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
      "name": "orderUnstake",
      "discriminator": [
        97,
        167,
        144,
        107,
        117,
        190,
        128,
        36
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "gsolMint"
        },
        {
          "name": "gsolMintAuthority",
          "docs": [
            "Used to ensure the correct GSOL mint is used"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "gsolTokenAccount",
          "writable": true
        },
        {
          "name": "gsolTokenAccountAuthority",
          "docs": [
            "Owner of the gSOL"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "newTicketAccount"
        },
        {
          "name": "sunriseTicketAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "relations": [
            "state"
          ]
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "name": "recoverTickets",
      "discriminator": [
        162,
        42,
        249,
        69,
        202,
        101,
        219,
        140
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "blazeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "liqPoolMint",
          "writable": true
        },
        {
          "name": "liqPoolMintAuthority"
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "writable": true
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "getBsolFrom",
          "writable": true
        },
        {
          "name": "getBsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "liqPoolTokenAccount",
          "writable": true
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "epochReportAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": []
    },
    {
      "name": "registerState",
      "discriminator": [
        137,
        35,
        194,
        234,
        128,
        215,
        19,
        45
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "msolMint"
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "msolTokenAccountAuthority",
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "msolTokenAccount",
          "writable": true
        },
        {
          "name": "liqPoolMint"
        },
        {
          "name": "liqPoolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "stateInput"
            }
          }
        }
      ]
    },
    {
      "name": "resizeState",
      "discriminator": [
        45,
        84,
        182,
        1,
        214,
        146,
        197,
        243
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "updateAuthority",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "name": "splDepositSol",
      "discriminator": [
        35,
        120,
        216,
        91,
        16,
        202,
        69,
        131
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "gsolMint",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "depositorGsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakePoolWithdrawAuthority"
        },
        {
          "name": "reserveStakeAccount",
          "writable": true
        },
        {
          "name": "managerFeeAccount",
          "writable": true
        },
        {
          "name": "stakePoolTokenMint",
          "writable": true
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "discriminator": [
        157,
        133,
        140,
        212,
        108,
        238,
        57,
        154
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "gsolMint",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "stakeAccountDepositor",
          "signer": true
        },
        {
          "name": "stakeAccount",
          "writable": true
        },
        {
          "name": "depositorGsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "validatorList",
          "writable": true
        },
        {
          "name": "stakePoolDepositAuthority",
          "signer": true
        },
        {
          "name": "stakePoolWithdrawAuthority"
        },
        {
          "name": "validatorStakeAccount",
          "writable": true
        },
        {
          "name": "reserveStakeAccount",
          "writable": true
        },
        {
          "name": "managerFeeAccount",
          "writable": true
        },
        {
          "name": "stakePoolTokenMint",
          "writable": true
        },
        {
          "name": "sysvarStakeHistory"
        },
        {
          "name": "sysvarClock"
        },
        {
          "name": "nativeStakeProgram"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "splWithdrawSol",
      "discriminator": [
        21,
        223,
        100,
        4,
        240,
        39,
        110,
        73
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "gsolMint",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userGsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakePoolWithdrawAuthority"
        },
        {
          "name": "reserveStakeAccount",
          "writable": true
        },
        {
          "name": "managerFeeAccount",
          "writable": true
        },
        {
          "name": "stakePoolTokenMint",
          "writable": true
        },
        {
          "name": "sysvarClock"
        },
        {
          "name": "sysvarStakeHistory"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "nativeStakeProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "discriminator": [
        83,
        25,
        193,
        160,
        231,
        91,
        113,
        100
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "gsolMint",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "userGsolTokenAccount",
          "writable": true
        },
        {
          "name": "userNewStakeAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakePoolWithdrawAuthority"
        },
        {
          "name": "validatorStakeList",
          "writable": true
        },
        {
          "name": "stakeAccountToSplit",
          "writable": true
        },
        {
          "name": "managerFeeAccount",
          "writable": true
        },
        {
          "name": "stakePoolTokenMint",
          "writable": true
        },
        {
          "name": "sysvarClock"
        },
        {
          "name": "stakePoolProgram"
        },
        {
          "name": "nativeStakeProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "triggerPoolRebalance",
      "discriminator": [
        32,
        197,
        13,
        80,
        221,
        80,
        137,
        150
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "writable": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "msolMint",
          "writable": true
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "liqPoolMint",
          "writable": true
        },
        {
          "name": "liqPoolMintAuthority"
        },
        {
          "name": "liqPoolSolLegPda",
          "writable": true
        },
        {
          "name": "liqPoolMsolLeg",
          "writable": true
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "writable": true
        },
        {
          "name": "treasuryMsolAccount",
          "writable": true
        },
        {
          "name": "getMsolFrom",
          "writable": true
        },
        {
          "name": "getMsolFromAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "liqPoolTokenAccount",
          "writable": true
        },
        {
          "name": "reservePda",
          "writable": true
        },
        {
          "name": "orderUnstakeTicketAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114,
                  95,
                  117,
                  110,
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  116,
                  105,
                  99,
                  107,
                  101,
                  116,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "epoch"
              },
              {
                "kind": "arg",
                "path": "orderUnstakeTicketIndex"
              }
            ]
          }
        },
        {
          "name": "epochReportAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": [
        {
          "name": "epoch",
          "type": "u64"
        },
        {
          "name": "orderUnstakeTicketIndex",
          "type": "u64"
        },
        {
          "name": "orderUnstakeTicketAccountBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "unlockGsol",
      "discriminator": [
        93,
        64,
        67,
        70,
        230,
        25,
        139,
        227
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lockAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "targetGsolAccount",
          "writable": true
        },
        {
          "name": "lockGsolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "epochReportAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateEpochReport",
      "discriminator": [
        181,
        106,
        179,
        149,
        91,
        180,
        94,
        195
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marinadeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "blazeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint"
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "liqPoolMint"
        },
        {
          "name": "liqPoolMintAuthority"
        },
        {
          "name": "liqPoolSolLegPda"
        },
        {
          "name": "liqPoolMsolLeg"
        },
        {
          "name": "liqPoolMsolLegAuthority"
        },
        {
          "name": "treasuryMsolAccount"
        },
        {
          "name": "getMsolFrom"
        },
        {
          "name": "getMsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "getBsolFrom"
        },
        {
          "name": "getBsolFromAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "liqPoolTokenAccount"
        },
        {
          "name": "epochReportAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "marinadeProgram",
          "address": "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
        }
      ],
      "args": []
    },
    {
      "name": "updateLockAccount",
      "discriminator": [
        64,
        213,
        64,
        122,
        184,
        6,
        149,
        64
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "gsolMint",
          "relations": [
            "state"
          ]
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lockAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "lockGsolAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "epochReportAccount",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  101,
                  112,
                  111,
                  99,
                  104,
                  95,
                  114,
                  101,
                  112,
                  111,
                  114,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "impactNftProgram",
          "docs": [
            "IMPACT NFT ACCOUNTS"
          ],
          "address": "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
        },
        {
          "name": "impactNftState"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "nftMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  105,
                  109,
                  112,
                  97,
                  99,
                  116,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "nftMintAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  105,
                  109,
                  112,
                  97,
                  99,
                  116,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "nftTokenAuthority"
        },
        {
          "name": "nftMetadata",
          "writable": true
        },
        {
          "name": "offsetMetadata",
          "writable": true
        },
        {
          "name": "offsetTiers"
        },
        {
          "name": "nftTokenAccount"
        },
        {
          "name": "nftNewCollectionMint"
        },
        {
          "name": "nftNewCollectionMetadata",
          "writable": true
        },
        {
          "name": "nftNewCollectionMasterEdition"
        },
        {
          "name": "nftCollectionMint",
          "writable": true
        },
        {
          "name": "nftCollectionMetadata",
          "writable": true
        },
        {
          "name": "nftCollectionMasterEdition"
        }
      ],
      "args": []
    },
    {
      "name": "updateMetadata",
      "discriminator": [
        170,
        182,
        43,
        239,
        97,
        78,
        225,
        186
      ],
      "accounts": [
        {
          "name": "state"
        },
        {
          "name": "marinadeState",
          "relations": [
            "state"
          ]
        },
        {
          "name": "gsolMint",
          "writable": true
        },
        {
          "name": "gsolMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  103,
                  115,
                  111,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "updateAuthority",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "tokenMetadataProgram"
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
      "name": "updateState",
      "discriminator": [
        135,
        112,
        215,
        75,
        247,
        185,
        53,
        176
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "updateAuthority",
          "signer": true,
          "relations": [
            "state"
          ]
        },
        {
          "name": "msolMint"
        },
        {
          "name": "bsolMint"
        },
        {
          "name": "msolTokenAccountAuthority",
          "docs": [
            "Must be a PDA, but otherwise owned by the system account ie not initialised with data"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  109,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "msolTokenAccount",
          "writable": true
        },
        {
          "name": "liqPoolMint"
        },
        {
          "name": "liqPoolTokenAccount",
          "writable": true
        },
        {
          "name": "bsolTokenAccountAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "state"
              },
              {
                "kind": "const",
                "value": [
                  98,
                  115,
                  111,
                  108,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "bsolTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": {
              "name": "stateInput"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "epochReportAccount",
      "discriminator": [
        19,
        218,
        1,
        191,
        162,
        88,
        235,
        88
      ]
    },
    {
      "name": "globalState",
      "discriminator": [
        163,
        46,
        74,
        168,
        216,
        123,
        133,
        98
      ]
    },
    {
      "name": "lockAccount",
      "discriminator": [
        223,
        64,
        71,
        124,
        255,
        86,
        118,
        192
      ]
    },
    {
      "name": "state",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    },
    {
      "name": "sunriseTicketAccount",
      "discriminator": [
        199,
        129,
        72,
        139,
        209,
        44,
        140,
        89
      ]
    },
    {
      "name": "ticketAccountData",
      "discriminator": [
        133,
        77,
        18,
        98,
        211,
        1,
        231,
        3
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "calculationFailure",
      "msg": "An error occurred when calculating an MSol value"
    },
    {
      "code": 6001,
      "name": "notDelegated",
      "msg": "Stake account deposit must be delegated"
    },
    {
      "code": 6002,
      "name": "invalidUpdateAuthority",
      "msg": "Wrong update authority for Sunrise state"
    },
    {
      "code": 6003,
      "name": "invalidProgramAccount",
      "msg": "Invalid Program Account"
    },
    {
      "code": 6004,
      "name": "invalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6005,
      "name": "unexpectedAccounts",
      "msg": "Unexpected Accounts"
    },
    {
      "code": 6006,
      "name": "unexpectedMintSupply",
      "msg": "Unexpected gsol mint supply"
    },
    {
      "code": 6007,
      "name": "invalidEpochReportAccount",
      "msg": "The epoch report account is not yet updated to the current epoch"
    },
    {
      "code": 6008,
      "name": "delayedUnstakeTicketsNotYetClaimable",
      "msg": "Delayed unstake tickets for the current epoch can not yet be claimed"
    },
    {
      "code": 6009,
      "name": "tooManyTicketsClaimed",
      "msg": "The amount of delayed unstake tickets requested to be recovered exceeds the amount in the report"
    },
    {
      "code": 6010,
      "name": "remainingUnclaimableTicketAmount",
      "msg": "The total ordered ticket amount exceeds the amount in all found tickets"
    },
    {
      "code": 6011,
      "name": "lockInsufficientBalance",
      "msg": "The source gsol account does not have the required balance to lock"
    },
    {
      "code": 6012,
      "name": "lockAccountIncorrectState",
      "msg": "The state of the lock account does not match the state in the instruction"
    },
    {
      "code": 6013,
      "name": "lockAccountIncorrectOwner",
      "msg": "The owner of the lock account does not match the authority in the instruction"
    },
    {
      "code": 6014,
      "name": "lockAccountIncorrectTokenAccount",
      "msg": "The lock token account does not match the token account in the lock account"
    },
    {
      "code": 6015,
      "name": "lockAccountAlreadyLocked",
      "msg": "The lock account has already been locked - unlock before re-locking"
    },
    {
      "code": 6016,
      "name": "lockAccountNotLocked",
      "msg": "The lock account has not been locked yet - lock before unlocking or updating"
    },
    {
      "code": 6017,
      "name": "lockAccountNotUpdated",
      "msg": "The lock account must be updated to the current epoch before it can be unlocked"
    },
    {
      "code": 6018,
      "name": "lockAccountAlreadyUpdated",
      "msg": "The lock account has already been updated to the current epoch. Cannot update twice in the same epoch."
    },
    {
      "code": 6019,
      "name": "cannotUnlockUntilNextEpoch",
      "msg": "The lock account was locked this epoch - wait at least one epoch before unlocking"
    },
    {
      "code": 6020,
      "name": "invalidCalculation",
      "msg": "Invalid calculation result"
    },
    {
      "code": 6021,
      "name": "accountDiscriminatorNotFound",
      "msg": "Account discriminator not found"
    },
    {
      "code": 6022,
      "name": "accountDiscriminatorMismatch",
      "msg": "Account discriminator did not match"
    },
    {
      "code": 6023,
      "name": "accountDidNotDeserialize",
      "msg": "Account did not deserialize"
    }
  ],
  "types": [
    {
      "name": "coinType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "native"
          },
          {
            "name": "spl"
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
            "type": "pubkey"
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
      "name": "feeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "feeType",
            "type": {
              "defined": {
                "name": "feeType"
              }
            }
          },
          {
            "name": "coinType",
            "type": {
              "defined": {
                "name": "coinType"
              }
            }
          },
          {
            "name": "splTokenMint",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "feeType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "fixed"
          },
          {
            "name": "percentage"
          }
        ]
      }
    },
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminUpdateAuthority",
            "type": "pubkey"
          },
          {
            "name": "adminMintAuthority",
            "type": "pubkey"
          },
          {
            "name": "levels",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "option": {
                "defined": {
                  "name": "feeConfig"
                }
              }
            }
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
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
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
    },
    {
      "name": "state",
      "docs": [
        "The main state account for the Sunrise Stake program",
        "",
        "IMPORTANT: This struct MUST remain named \"State\" and not be renamed.",
        "The account discriminator is derived from the struct name, and renaming it would",
        "change the discriminator from the current value, breaking compatibility with",
        "all existing on-chain accounts. The discriminator is the first 8 bytes of",
        "SHA256(\"account:State\") and is checked by Anchor when deserializing accounts."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "pubkey"
          },
          {
            "name": "updateAuthority",
            "type": "pubkey"
          },
          {
            "name": "gsolMint",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
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
            "type": "pubkey"
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
      "name": "stateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marinadeState",
            "type": "pubkey"
          },
          {
            "name": "blazeState",
            "type": "pubkey"
          },
          {
            "name": "updateAuthority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
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
            "type": "pubkey"
          },
          {
            "name": "marinadeTicketAccount",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ticketAccountData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateAddress",
            "type": "pubkey"
          },
          {
            "name": "beneficiary",
            "type": "pubkey"
          },
          {
            "name": "lamportsAmount",
            "type": "u64"
          },
          {
            "name": "createdEpoch",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
