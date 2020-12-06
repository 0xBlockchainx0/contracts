
![Image of HUDDLN](https://avatars1.githubusercontent.com/u/72272151?s=400&u=dfa351d470531caa635562e4e4163f2ff92d1689&v=4)
 
# Huddln Protocol

The Huddln protocol is a publicly available blockchain service focusing on features for social/content focused dapps to use as a foundation. The features provide users with fun ways to monetize their content.

Most dapps are currently implementing their own monetization features that require every user to learn a new process when switching between different dapps.

The Huddln protocol is an open source set of features that aims to bring some uniformity across social/NFT dapps.
  
Providing a publicly available service means, that we at Huddln want to see what you build and connect to the service.

 ### Disclaimer: 
  *These contracts have not yet been audited by Quantstamp, by choosing to partner with the Huddln service you acknowledge that you understand and accept the risk of integration/use of the service.

 ## Contributing 
 <img src="https://miro.medium.com/max/2256/1*oVotVJoRY5DGKGJq8haS1g.png" height="250" >
 
 You can contribute to this project via gitcoin https://gitcoin.co/grants/1405/huddln.
 You can also directly donate to our donations wallet here on ethereum/matic.

<img src="https://static.wixstatic.com/media/e76460_3e53ab3d17e6405e8b79f0c528cfe352~mv2.png" height="400">

## Feature 1: Content Staking
This the first feature fully deployed and available in the Huddln service. It provides a means for content creators to monetize their content while allowing patrons to invest in that content.

**How does it work ?**
1. Creator creates content ID.
2. Submits contentID to the staking feature.
3. A staking period will begin based on blocktime, during this period anyone is allowed to lock up funds into that content by providing a content ID. 10% of the stake is given to their creator as a fee for purchasing a stake.
4. After the staking period has ended, anyone with the content ID can now send tips to the content to show their appreciation of the content.
5. During this period all tips go into a tipping pool.
6. At any time a staker can sell their stake and claim their tipping pool earnings with the simple equation below.
$$StakePayout = \frac{Staked Amount }{TotalAmountof Staked Funds}*Tipping Pool$$

*Note*: When all stakes are sold and patrons are still tipping, the tips go directly to the creator of the content instead.

This mechanism encourages stakers to promote the content they are staked on while also allowing the creator to gain earnings via the mandatory staking fee.
## Future Work (available via bounties/contracted)
If you wish to contribute toward the initiatives presented below you can contact me directly at josephgonzalez@huddln.io or checkout our gitcoin page to see the available bounties.

### System
1. **Elegant Integration to Open Z's upgradeable system**.
2.  **Simple Storage/Eternal Storage**: May need to implement a simple storage/eternal storage custom solution for features.
3. **Automation scripts**: Starting/submitting/upgrading feature contracts.
4. **On-chain contract feature submission process:** Ability for contract owners to submitted contract for consideration of being included in the service as as service.
5. **TheGraph.com GraphQL integration** for indexing events for front end Dapp creators.
6. **Proxy Upgrades**: Update proxying of features to use an array/mapping design so that many features can be linked to the gateway without the gateway needing to be upgraded. This means removing all functions from the gateway and instead implementing a cyclicling scanning mechanism to check a list of contracts for the transaction method thats being called. Should be implemented into the **fallback** function. This would greatly reduce the need to add additional function to the gateway everytime a new feature is implemented.I cannot find examples of anyone doing this, so maybe we can start a medium article with this design and check what the security implications are.
7. **Updating Feature Abstraction**: Currently the Feature abstract contract needs to upgraded to include future design limitation/constructs, this means adding new functions and processes that contributors must utilize in order to submit features.

### Design/Protocol
1. **Feature: NFT YIELD**: Create a feature for generating tokens based on and NFT's sold amount when transffering to new owner. These tokens are sent to the users that staked on those NFTs. (Staking -->Yield Tokens)
2. **Feature: NFT Hot Deploy**: Create a feature for on-chain deployment of NFT 7xx standard and 1155. Should involve users being able to call the huddln gateway to mint a custom token and return that new address.
3. **Feature: Partner Fee (bps)**: Currently the Huddln service charges a fee on earnings as its business model, the protocol needs a mechanism that allows partners (DAPP creators) to add their own fee when their users call the service. This should all Dapp creators a way to create revenue. Could possible involve a new contract that has a mapping of datastructs that hold info about each partner, such as metadata (images, links, service contracts, wallet address).
4. **Feature: Staked Huddls**: Create an event staking feature that forces people that wish to attend to locked-up funds and can only pull their funds out when the host has declared they are present. Similar to Kickback except without the hassle and need to go through a process. This is more similar to a facebook event (simple, fast, intimate). How could it work? When a host creates an event that ID is sent to participants to join, when joining that must lock up funds into the contract and are given back a unique identifying ID number (hash ticket). When they go to the event, they present that hash to the host which will could scan that hash then sign and send that transaction back to the contract to show they are in attendance. Things to consider, this should probably be done in batches so many people can be confirmed via one tx.
5. **Token Agnostic**: Adding the ability to use any ERC20 token for staking features. Specifically, the first token should be DAI.

## Basic Design
The Huddln service consists of one Gateway that acts as an API endpoint for users to connect to. The design mimics that of a proxy contract. Each feature implemented is live as its own contract and is directly tied to the gateway. The features have a locking mechanism that only allows user functions to be called by the proxy contract, while the gateway lockes to the feature. This creates a system that relies on the the gateway to direct calls to the sub features, this creates a single point of contact, and simpler design to debug.

## Docs

Integration docs for dapp creators will be made available soon via huddln.io. This will include docs on how to integrate the gasless tx setup via biconomy.

## Network

Currently the Huddln Service is only deployed to the [Matic Network](www.matic.network) .
### Matic Testnet Deployment:  
**Gateway**: 0x5d5732819eac270aAAcf85D175a9303C2eA1801B
**Feature 1 Content Staking**: 0xE514b2D861B31084a1b9CC9393d09b6Ee13b91ED


### Matic Mainnet Deployment:
**Gateway**: 0x7f1b930c61Af28cF3248381Ed15b29220DcA23d4
**Feature 1 Content Staking**: 0xE514b2D861B31084a1b9CC9393d09b6Ee13b91ED

## Testing

Truffle will deploy the contracts if they are not found in the **build** folder when running `truffle test`. However, these tests should always be ran on a fresh deployment of the contracts. So make sure to clear out your build folder and force a fresh deployment before running the tests.

  

1.  `rm -rf build`

2.  `truffle test`


## Build & Deploy

1.  `npm install`

2.  `source .env && truffle deploy --network matic_testnet`

 ## Contact
**Telegram Group for Devs**: https://t.me/joinchat/HTaTshz4WP-XA8QIE6Ktnw
**Website**: https://huddln.io
**Twitter**: https://twitter.com/Huddln_ 