
module.exports = {
    networks: {
    
      matic_testnet: {
        provider: () => new HDWalletProvider('', `https://rpc-mumbai.matic.today`),
        network_id: 80001,
        confirmations: 2,
        timeoutBlocks: 200,
        skipDryRun: true
      }
    },
    compilers: {
      solc: {
        version: "0.6.2"
     }
   }
  };
  