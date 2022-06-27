import { Button, Divider, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React, { useEffect } from "react";
import './Wallet.css';
import { ethers } from "ethers";
import MultiSig from '../../artifacts/contracts/MultiSig.sol/MultiSignWallet.json'
import Signer from "../context/Signer";
import { useContext, useState } from "react";
import { Line } from '@ant-design/charts';
import constants from "../utils/constants";
import CreateTransaction from "../components/CreateTransaction";
import Deposit from "../components/Deposit";
import EditIcon from '@mui/icons-material/Edit';
import { useCookies } from "react-cookie";
import Naming from "../components/Naming";
import TextField from "@mui/material/TextField"
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Wallet = (props) => {

    const signer = useContext(Signer);
    const [owners, setOwners] = useState([{ address: '', name: '' }]);
    const [transactions, setTransactions] = useState([]);
    const [confirmationsRequired, setConfirmationsRequired] = useState(0);
    const [balances, setBalances] = useState([]);
    const [creatingTx, setCreatingTx] = useState(false);
    const [depositing, setDepositing] = useState(false);
    const [naming, setNaming] = useState(false);
    const [namingOwner, setNamingOwner] = useState(-1); //-1 is false in this case

    const [cookies, setCookie] = useCookies();

    const getOwners = async () => {
        const contract = new ethers.Contract(props.wallet.address, MultiSig.abi, signer)

        const own = await contract.getOwners();
        const conf = await contract.confirmationsRequired();

        setConfirmationsRequired(conf.toNumber());

        setOwners(own.map((ownerAddress, i) => ({ address: ownerAddress, name: (cookies[props.wallet.address] && cookies[props.wallet.address].signers && cookies[props.wallet.address].signers[ownerAddress]) || `Signer ${i + 1}` })));
    }

    const getTransactions = async () => {
        const contract = new ethers.Contract(props.wallet.address, MultiSig.abi, signer)
        const txs = await contract.getTransactions(); //Do they come ordered?


        let fulltx = []

        const address = await signer.getAddress();
        for (const [i, tx] of txs.entries()) {
            const confirmedByMe = await contract.ownerConfirmed(i, address);

            if (tx.confirmed) {
                //Get Tx hash
                const filter = {
                    fromBlock: props.wallet.blockCreated,
                    address: props.wallet.address,
                    topics: [
                        ethers.utils.id('TransactionExecuted(uint256)'),
                        ethers.utils.hexZeroPad(i, 32)
                    ]
                }

                const log = await signer.provider.getLogs(filter)

                console.log(log);

                fulltx.push({ ...tx, confirmedByMe: confirmedByMe, id: i, hash: log.length > 0 ? log[0].transactionHash : null })
            } else {
                fulltx.push({ ...tx, confirmedByMe: confirmedByMe, id: i })
            }
        }


        setTransactions(fulltx);
    }

    const getBalance = async () => {
        console.log('Getting balances')
        const latest = await signer.provider.getBlock();

        let balances = []

        //Get Balances from that block
        let last = -1;
        for (let block = props.wallet.blockCreated; block <= latest.number; block += constants.blockJump) {
            const bal = await signer.provider.getBalance(props.wallet.address, block);
            console.log('bal', bal);
            if (bal.toString() != last.toString()) {
                if (last != -1) {
                    balances.push({
                        block: (block - 1).toString(),
                        balance: parseFloat(ethers.utils.formatEther(last))
                    })
                }
                balances.push({
                    block: block.toString(),
                    balance: parseFloat(ethers.utils.formatEther(bal))
                })
                last = bal;
            }
        }

        //Get latest block as well
        if (balances[balances.length - 1].block != latest.number) {
            const bal = await signer.provider.getBalance(props.wallet.address);
            balances.push({
                block: latest.number.toString(),
                balance: parseFloat(ethers.utils.formatEther(bal))
            })
        }

        console.log('Balances', balances);
        setBalances(balances)
    }

    const handleCreateTransaction = async () => {
        setCreatingTx(true);
    }

    const handleTransactionButton = async (index, confirmations, confirmedByMe) => {
        const contract = new ethers.Contract(props.wallet.address, MultiSig.abi, signer)
        if (confirmations < confirmationsRequired && !confirmedByMe) {
            //Confirm tx
            const tx = await contract.ConfirmTransaction(index);
            const receipt = await tx.wait();
            console.log(receipt);
            props.setOpenNotif({ open: true, message: 'Transaction Confirmed' });
            getTransactions();
        } else if (confirmations >= confirmationsRequired) {
            try {
                //Execute Tx
                const tx = await contract.ExecuteTransaction(index);
                const receipt = await tx.wait();
                console.log(receipt);
                props.setOpenNotif({ open: true, message: 'Transaction Executed' });
                getTransactions();
                getBalance();
            } catch (err) {
                alert(err);
            }
        }
    }

    const handleDeposit = async () => {
        setDepositing(true);
    }

    const handleEditName = () => {
        setNaming(true)
    }

    const changeWalletName = (newName) => {
        setCookie(props.wallet.address,
            {
                name: newName,
                signers: owners.reduce((acc, own) => {
                    acc[own.address] = own.name;
                    return acc;
                }, {})
            }
        );

        props.setWallets(prev => prev.map((wall, i) => (
            i == props.selected
                ? { ...wall, name: newName }
                : { ...wall }
        )))
    }

    const handleOwnerNameChange = () => {
        setNamingOwner(-1);
        setCookie(props.wallet.address,
            {
                name: props.wallet.name,
                signers: owners.reduce((acc, own) => {
                    acc[own.address] = own.name;
                    return acc;
                }, {})
            }
        );
        // {name: walletName, signers: { address: ownerName, ... }}
    }

    useEffect(() => {
        getOwners();
        getTransactions();
        getBalance();
    }, [props.selected])

    return (
        <div className='main_wallet_flex'>
            <div className="wallet_header">
                <div className="wallet_name">
                    <ContentCopyIcon onClick={() => {
                        navigator.clipboard.writeText(props.wallet.address)
                            .then(() => console.log('Copied to Clipboard'))
                            .catch(err => console.log('Error copying to clipboard', err))
                    }} sx={{ cursor: 'pointer', marginRight: '10px' }} ></ContentCopyIcon>
                    <h1>{props.wallet.name}</h1>
                    <EditIcon onClick={handleEditName} sx={{ cursor: 'pointer' }}></EditIcon>
                </div>
                <Button sx={{ float: 'right' }} variant='contained' onClick={handleDeposit}>Deposit</Button>
                <Button sx={{ float: 'right' }} variant='contained' onClick={handleCreateTransaction}>Create Transaction</Button>
            </div>
            <div className="grid_container">
                <Paper elevation={4} sx={{ gridColumnStart: 1, gridColumnEnd: 7, padding: '20px 10px' }}>

                    <div className="wallet_info_container">
                        <h1>Balance: {balances.length > 0 && balances[balances.length - 1].balance} ETH</h1>
                        {balances.length == 0
                            ? <h2>LOADING...</h2>
                            : <Line
                                data={balances}
                                xField='block'
                                yField='balance'
                                point={{
                                    size: 5,
                                    shape: 'diamond'
                                }}
                                meta={{
                                    block: {
                                        type: 'linear'
                                    }
                                }}
                                smooth={false}
                                height={250}
                                padding='auto'
                                width={650}
                            />
                        }
                    </div>
                </Paper>
                <Paper elevation={4} sx={{ gridColumnStart: 1, gridColumnEnd: 5, gridRowStart: 2, padding: '10px' }}>
                    <div className="wallet_info_container">
                        <h1>Signers <span className="required_amount">{`(${confirmationsRequired} required)`}</span></h1>
                        <Divider />
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Address</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {owners.map((owner, i) =>
                                    <TableRow key={i}>
                                        <TableCell>
                                            {namingOwner == i
                                                ? <div className="signer_name">
                                                    <TextField value={owner.name} onChange={e => {
                                                        setOwners(prev => prev.map((own, index) => (
                                                            index == i
                                                                ? { ...own, name: e.target.value }
                                                                : { ...own }
                                                        )))
                                                    }} />
                                                    <CheckIcon onClick={handleOwnerNameChange} sx={{ cursor: 'pointer' }} />
                                                </div>
                                                : <div className="signer_name">
                                                    <p>{owner.name}</p>
                                                    <EditIcon onClick={() => setNamingOwner(i)} sx={{ cursor: 'pointer' }} />
                                                </div>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                key={i}
                                                href={"https://etherscan.io/address/" + owner.address}
                                            >
                                                <p>
                                                    {owner.address.substring(0, 8) + '...' + owner.address.substring(owner.address.length - 4, owner.address.length)}
                                                </p>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Paper>
                <Paper elevation={4} sx={{ gridColumnStart: 5, gridColumnEnd: 7, gridRowStart: 2, padding: '10px' }}>
                    <div className="wallet_info_container">
                        <h1>Pending Transactions</h1>
                        <Divider />
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>To</TableCell>
                                    <TableCell>Value(ETH)</TableCell>
                                    <TableCell>Confirmations</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map(tx => (
                                    !tx.confirmed &&
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            {tx.id}
                                        </TableCell>
                                        <TableCell>
                                            {tx.to.substring(0, 10) + '...' + tx.to.substring(tx.to.length - 8, tx.to.length)}
                                        </TableCell>
                                        <TableCell>
                                            {ethers.utils.formatEther(tx.value)}
                                        </TableCell>
                                        <TableCell>
                                            {tx.confirmations.toString()}/{confirmationsRequired}
                                        </TableCell>
                                        <TableCell>
                                            <Button disabled={tx.confirmations < confirmationsRequired && tx.confirmedByMe} variant='outlined' onClick={() => handleTransactionButton(tx.id, tx.confirmations, tx.confirmedByMe)}>{(confirmationsRequired > 0 && tx.confirmations >= confirmationsRequired) ? 'Execute Transaction' : (tx.confirmedByMe ? `Waiting for ${confirmationsRequired - tx.confirmations}/${owners.length - tx.confirmations} confirmations` : 'Confirm Transaction')}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Paper>
                <Paper elevation={4} sx={{ gridColumnStart: 1, gridColumnEnd: 7, gridRowStart: 3, padding: '10px' }}>
                    <div className="wallet_info_container">
                        <h1>Past Transactions</h1>
                        <Divider />
                        <Table >
                            <TableHead>
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>To</TableCell>
                                    <TableCell>Value(ETH)</TableCell>
                                    <TableCell>Tx Hash</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map(tx => (
                                    tx.confirmed &&
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            {tx.id}
                                        </TableCell>
                                        <TableCell>
                                            <a href={'https://etherscan.io/address/' + tx.to}>{tx.to.substring(0, 12) + '...' + tx.to.substring(tx.to.length - 10, tx.to.length)}</a>
                                        </TableCell>
                                        <TableCell>
                                            {ethers.utils.formatEther(tx.value)}
                                        </TableCell>
                                        <TableCell>
                                            <a href={'https://etherscan.io/tx/' + tx.hash}>{tx.hash && tx.hash.substring(0, 12) + '...' + tx.hash.substring(tx.hash.length - 10, tx.hash.length)}</a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Paper>
            </div>
            {creatingTx && <CreateTransaction setCreatingTx={setCreatingTx} address={props.wallet.address} getTransactions={getTransactions} />}
            {depositing && <Deposit getBalance={getBalance} setDepositing={setDepositing} address={props.wallet.address} getTransactions={getTransactions} />}
            {naming && <Naming setNaming={setNaming} name={props.wallet.name} changeName={changeWalletName} />}
        </div>
    )
}

export default Wallet;