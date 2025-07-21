import "vite/client";

interface ImportMetaEnv {
  readonly VITE_MAINNET_RPC_URL: string;
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_APP_BASE_URL: string;
  // Add other env variables as needed
  readonly REACT_APP_MAINNET_RPC_URL: string;
  readonly REACT_APP_SOLANA_NETWORK: string;
  readonly REACT_APP_APP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
