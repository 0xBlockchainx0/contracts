require('dotenv').config()

const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
    networks: {
    
      matic_testnet: {
        provider: () => new HDWalletProvider(PRIVATE_KEY, `https://rpc-mumbai.matic.today`),
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
  