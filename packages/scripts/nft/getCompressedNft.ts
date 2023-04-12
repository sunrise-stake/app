import "../util";

(async () => {
    // @ts-ignore
    const nfts = await fetch("https://rpc-proxy.danielbkelleher3799.workers.dev/", {
        method: "POST",
        body: JSON.stringify({
            "jsonrpc": "2.0",
            "id": "my-id",
            "method": "getAssetsByOwner",
            "params": [
                "TPFwNh9GsXCtcLjqo6Xwyu92pWU2FY4V6Fr3isqqXkM",
                {
                    "sortBy": "created",
                    "sortDirection": "asc"
                },
                50,
                1,
                "",
                ""
            ]
        })
    }).then((res: any) => res.json());

    const parsedNFTs = nfts.result.items.map((nft: any) => {
        return nft
    });

    const compressedNFTs = parsedNFTs.filter((nft: any) => nft.compression.compressed);

    console.log(JSON.stringify(compressedNFTs, null, 2));
})().catch(console.error);