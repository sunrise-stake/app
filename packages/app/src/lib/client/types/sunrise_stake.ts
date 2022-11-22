export type SunriseStake = {
  "version": "0.1.0",
  "name": "sunrise_stake",
  "instructions": [
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
          "isMut": true,
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
      "name": "liquidUnstake",
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
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
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
      "name": "withdrawToTreasury",
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
    }
  ]
};

export const IDL: SunriseStake = {
  "version": "0.1.0",
  "name": "sunrise_stake",
  "instructions": [
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
          "isMut": true,
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
      "name": "liquidUnstake",
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
          "name": "gsolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gsolTokenAccountAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
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
      "name": "withdrawToTreasury",
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
    }
  ]
};
