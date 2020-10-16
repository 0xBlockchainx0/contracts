var HDWalletProvider = require("@truffle/hdwallet-provider");

require('dotenv').config()

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LOCAL_GANACHE_MNEMONIC=process.env.LOCAL_GANACHE_MNEMONIC;
module.exports = {
    networks: {
    
      matic_testnet: {
        provider: () => new HDWalletProvider(PRIVATE_KEY,'https://rpc-mumbai.matic.today'),
        network_id: 80001,
        confirmations: 2,
        timeoutBlocks: 200,
        skipDryRun: true
      },
      local: {
        provider: () => new HDWalletProvider(LOCAL_GANACHE_MNEMONIC,'http://0.0.0.0:7545'),
        network_id: 5777,
        confirmations: 0,
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
  