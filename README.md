# MultiSignWallet

This is my first attempt to create a fullstack dApp. Starting by writing the smart contracts, and the created the frontend to be able to interact with them. The dApp is currently published in Rinkeby network. You can check it out in https://multisignwallet.herokuapp.com/

*Note: it may take a couple seconds for the heroku dyno to start*

## Usage

First, you'll want to create a Multi Sign Wallet. Give it a name and add the signers and minimum signers required for a transaction to be executed.

After that, your wallet will appear in the sidebar with the name you gave it (*Note: The name is stored in your cookies, not on the blockchain*)

If you didn't deposit any ETH, you'll want to do that by clicking the `Deposit` button.

After that, you can add a transaction with the `Create Transaction` button, adding the address to send ETH to and the amount

### Confirming Transactions

To confirm a transaction, you'll first have to confirm it in the *Pending Transactions* section. After enough confirmations have been sent (*This minimum signers threshold was set during the creation of the Wallet and is immutable*)
you (or any signer) can `Execute Transaction`

## Cloning

If you want to clone the dApp just git clone the whole repository and make sure you change in `webpack.config.js` the mode from `production` to `development` :

    const mode = 'development'
    
After that just run:

    npm run dev
    
## Future Plans

I'm planning to add ERC20s and ERC721s compatibility to the wallets. As well as be able to do smart contract interactions through the Multi Sign Wallet.
