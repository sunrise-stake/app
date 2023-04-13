// These will be fetched from some data base
import { type Charity, type PlaceholderOrg } from "./components/types";
import { PublicKey } from "@solana/web3.js";

export const charityApps: Array<Charity | PlaceholderOrg> = [
  {
    name: "Urbánika",
    imageUrl: "partners/urbanika.jpg",
    address: new PublicKey("CjKXmKFFkCy8nH2HFmc6m2ZW3pGqy29QCv6GGwgvSdsM"),
    website: "https://urbanika.notion.site/",
  },
  {
    name: "Diamante Bridge Collective",
    imageUrl: "partners/DBCLogo.png",
    address: new PublicKey("HPiGWWLmV8R1UET84Bf1BnsPtRYcQessRdms4oFxe6sW"),
    website: "https://diamantebridge.org/",
  },
  {
    name: "Sunrise Stake",
    imageUrl: "logo.png",
    address: new PublicKey("Bup7DZk56XwQUDzuvBz9nzbr8e2iLPVrBpha1KTfEbbJ"),
    website: "https://sunrisestake.com/",
  },
];
