export type SunriseStake = {
  "version": "0.1.0",
  "name": "sunrise_stake",
  "instructions": [
    {
      "name": "deposit",
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
          "name": "orderUnstakeTicketManagementAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "previousOrderUnstakeTicketManagementAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
        },
        {
          "name": "previousOrderUnstakeTicketManagementAccountBump",
          "type": "u8"
        }
      ]
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
          "name": "gsolMint",
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
          "name": "treasury",
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
          "name": "marinadeProgram",
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
            "defined": "RegisterStateInput"
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
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "UpdateStateInput"
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
      "name": "orderUnstakeTicketManagementAccount",
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
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RegisterStateInput",
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
      "name": "UpdateStateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
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
      "name": "InvalidOrderUnstakeManagementAccount",
      "msg": "The order unstake management account is invalid for this epoch"
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
          "name": "orderUnstakeTicketManagementAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "previousOrderUnstakeTicketManagementAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
        },
        {
          "name": "previousOrderUnstakeTicketManagementAccountBump",
          "type": "u8"
        }
      ]
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
          "name": "gsolMint",
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
          "name": "treasury",
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
          "name": "marinadeProgram",
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
            "defined": "RegisterStateInput"
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
        }
      ],
      "args": [
        {
          "name": "state",
          "type": {
            "defined": "UpdateStateInput"
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
      "name": "orderUnstakeTicketManagementAccount",
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
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RegisterStateInput",
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
      "name": "UpdateStateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
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
      "name": "InvalidOrderUnstakeManagementAccount",
      "msg": "The order unstake management account is invalid for this epoch"
    }
  ]
};
