import { Button, MenuItem, Paper, TextField, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import './CreateWallet.css';
import { ethers } from "ethers";
import Signer from "../context/Signer";
import DeleteIcon from '@mui/icons-material/Delete';
import constants from "../utils/constants";
import Factory from '../../artifacts/contracts/MultiSig.sol/MultiSignWalletFactory.json'
import { useCookies } from "react-cookie";

const CreateWallet = (props) => {

    const signer = useContext(Signer);

    const [stage, setStage] = useState(0);
    const [name, setName] = useState('');
    const [eth, setEth] = useState(0);
    const [required, setRequired] = useState(1);
    const [signers, setSigners] = useState([{ name: '', address: '', wrong: false, msg: '' }, { name: '', address: '', wrong: false, msg: '' }]);
    const [myAddress, setMyAddress] = useState('');

    const [cookies, setCookie] = useCookies(['wallets']);

    const handleClick = () => {
        if (stage == 0) {
            setStage(prev => prev + 1);
        } else if (stage == 1) {
            let success = false;
            let dropping = []
            for (const [i, sig] of signers.entries()) {
                //Drop if empty address
                if (sig.address == '') {
                    dropping.push(i)
                }

                //Check
                success = checkAddress(sig.address, i)
                if (success !== true) break;
            }
            setSigners(prev => prev.filter((item, index) => !dropping.includes(index)))
            //console.log(success)
            if (success === true) setStage(prev => prev + 1);
        } else if (stage == 2) {
            //Send contract
            sendContract();
        }
    }

    const sendContract = async () => {
        const contract = new ethers.Contract(constants.factoryAddress, Factory.abi, signer);

        const tx = await contract.create(signers.map(sig => sig.address), required, { value: ethers.utils.parseEther(eth.toString()) })
        const receipt = await tx.wait()
        console.log('Receipt', receipt)

        //Set cookie
        const walletAddress = ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].data)[0];
        if (name != '') {
            const signersNames = signers.reduce((acc, sig) => { acc[sig.address] = sig.name; return (acc) }, {})
            console.log(signersNames);
            setCookie(walletAddress, { name: name, signers: signersNames });
        }

        //Add wallet to state
        props.setWallets(prev => {
            prev.push({
                address: walletAddress,
                id: props.id,
                blockCreated: receipt.blockNumber,
                name: name || 'Wallet ' + (i + 1),
            });
            return (prev)
        })

        //SetSelected created wallets
        props.setCreating(false);
        //props.setSelected(props.id);

        //TODO show notif
        props.setOpenNotif({ open: true, message: `MultiSign Wallet "${name || 'Wallet ' + (i + 1)}" has been created` })
    }

    const checkAddress = (address, i, ignore = null) => { //Ignore for the repeat check
        if (address != '') {
            //Check address
            try {
                ethers.utils.getAddress(address);
            } catch (err) {
                return ('Wrong Address')
            }

            //Check repeated
            if (signers.filter((item, index) => ignore ? index != i && item.address == address && index != ignore : index != i && item.address == address).length > 0) {
                return ('Repeated Address')
            }
        }
        return true; //No errors
    }

    const handleAddSigner = () => {
        setSigners(prev => [...prev, { name: '', address: '', wrong: false, msg: '' }])
    }

    const handleSignerChange = (name, address, i) => {
        setSigners(prev => ( // [ { name, address, wrong, msg } ]
            prev.map((sig, index) => {               //Update
                if (index == i) {
                    const message = checkAddress(address != null ? address : sig.address, i)

                    let wrong = false
                    if (message !== true) {
                        wrong = true
                    }
                    //Return Updated object
                    return ({
                        name: name != null ? name : sig.name,
                        address: address != null ? address : sig.address,
                        wrong: wrong,
                        msg: message
                    })
                } else {                               //Keep as is (not updating)
                    return ({ ...sig })
                }
            })
        ))
    }

    const handleSignerDelete = (i) => {
        setSigners(prev => prev.filter((item, index) => i != index))
        for (const [x, sig] of signers.entries()) {
            if (x == i) continue;
            console.log(checkAddress(sig.address, x, i))
        }
    }

    const getAddress = async () => {
        const address = await signer.getAddress();
        setSigners([{ name: '', address: address, wrong: false, msg: '' }, { name: '', address: '', wrong: false, msg: '' }]);
        setMyAddress(address);
    }

    useEffect(() => {
        getAddress();
    }, [])

    return (
        <div className="wallet_create_container">

            <div className="steps">
                1. Select Name
                2. Add Signers
                3. Overview
            </div>

            {(() => {
                switch (stage) {
                    case 0:
                        return (
                            <div className="paper_container">
                                <Paper elevation={4} >
                                    <div className="selection_container">
                                        <h1>Name</h1>
                                        <TextField label='Name' value={name} onChange={e => setName(e.target.value)}></TextField>
                                        <Button sx={{ marginTop: '10px' }} variant='contained' fullWidth={false} onClick={handleClick}>Next</Button>
                                    </div>
                                </Paper>
                            </div>
                        )
                        break;
                    case 1:
                        return (
                            <div className="paper_container">
                                <Paper elevation={4} >
                                    <div className="selection_container">
                                        <h1>Signers</h1>
                                        {signers.map((signer, i) => (
                                            <div key={i} className="signer">
                                                <TextField sx={{ maxWidth: '100px', marginRight: '15px', minWidth: '70px' }} label='Name' value={signer.name} onChange={e => handleSignerChange(e.target.value, null, i)}></TextField>
                                                <TextField sx={{ minWidth: '400px' }} label='Address' value={signer.address} onChange={e => handleSignerChange(null, e.target.value, i)} error={signer.wrong} helperText={signer.wrong && signer.msg}></TextField>
                                                {signers.length != 1 && <DeleteIcon sx={{ cursor: 'pointer', marginLeft: '8px' }} onClick={() => handleSignerDelete(i)} />}
                                            </div>
                                        ))}
                                        <Button sx={{ marginTop: '8px' }} fullWidth onClick={handleAddSigner}>+ Add Signer</Button>
                                        <div className="confirmations_selector">
                                            <TextField select label='Signers' value={required} onChange={e => setRequired(e.target.value)} sx={{ minWidth: '80px' }}>
                                                {(() => { //One way to overcomplicate things
                                                    let count = 0;
                                                    return (signers.map(sig => {
                                                        if (!sig.wrong && sig.address != '') {
                                                            count++;
                                                            return (
                                                                <MenuItem key={count} value={count}>{count}</MenuItem>
                                                            )
                                                        }

                                                    }))
                                                })()}
                                            </TextField>
                                            <p> out of {signers.filter(sig => !sig.wrong && sig.address != '').length} required</p>
                                        </div>
                                        <div className="buttons_holder">
                                            <Button variant='contained' fullWidth onClick={() => setStage(stage - 1)}>Back</Button>
                                            <Button sx={{ marginLeft: '20px' }} disabled={signers.filter(sig => sig.wrong).length != 0 || signers.filter(sig => !sig.wrong && sig.address != '') == 0} variant='contained' fullWidth onClick={handleClick}>Next</Button>
                                        </div>
                                    </div>
                                </Paper>
                            </div>
                        )
                        break;
                    case 2:
                        return (
                            <div className="paper_container">
                                <Paper elevation={4} >
                                    <div className="selection_container">
                                        <h1>Overview</h1>
                                        <h2>Name: {name}</h2>
                                        <div className="eth_select">
                                            <h3>ETH: </h3>
                                            <TextField sx={{ maxWidth: '200px' }} type='number' label='ETH' value={eth} onChange={e => setEth(e.target.value)}></TextField>
                                        </div>
                                        <h3>Signers ({required} out of {signers.length} required): </h3>
                                        <div>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Name</TableCell>
                                                        <TableCell>Address</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {signers.map((sig, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>
                                                                <p>{sig.name}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <p>{sig.address}</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            {myAddress != '' && signers.filter(sig => sig.address == myAddress).length != 1 && <h3> You are not a signer in this wallet</h3>}
                                        </div>
                                        <div className="buttons_holder">
                                            <Button variant='contained' fullWidth onClick={() => setStage(stage - 1)}>Back</Button>
                                            <Button variant='contained' fullWidth onClick={handleClick} sx={{ marginLeft: '20px' }}>Confirm</Button>
                                        </div>
                                    </div>
                                </Paper>
                            </div >
                        )
                        break;
                    default:
                        return (
                            <h1>Error</h1>
                        )
                }
            })()}
        </div >
    )
}

export default CreateWallet;