import { PublicKey } from "@solana/web3.js";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";

const address = new PublicKey("Gp6NzLcom5fBJpYGGLmiCqjmjDCrF77DyME2f42i4jdv");

(async () => {
  const provider = AnchorProvider.env();

  await provider.connection.getParsedAccountInfo(address).then((info) => {
    console.log(info.value?.data);
  });
})().catch(console.error);
