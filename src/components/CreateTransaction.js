import React, { useContext, useState } from "react";
import Signer from '../context/Signer';
import Backdrop from '@mui/material/Backdrop';
import ClickAwayListener from '@mui/base/ClickAwayListener';
import Paper from '@mui/material/Paper'
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import './CreateTransaction.css'
import { ethers } from "ethers";
import MultiSignWallet from '../../artifacts/contracts/MultiSig.sol/MultiSignWallet.json'

const CreateTransaction = (props) => {
    const signer = useContext(Signer);

    const [to, setTo] = useState('');
    const [wrongTo, setWrongTo] = useState(false);
    const [eth, setEth] = useState(0);

    const handleToChange = (e) => {
        try {
            ethers.utils.getAddress(e.target.value);
            setWrongTo(false);
        }catch(err){
            setWrongTo(true);
        }
        setTo(e.target.value);
    }

    const handleCreateTx = async () =>{
        const contract = new ethers.Contract(props.address, MultiSignWallet.abi, signer);

        const tx = await contract.AddTransaction(to, ethers.utils.parseEther(eth), []); //TODO add calldata
        const receipt = await tx.wait()
        console.log(receipt);
        props.getTransactions();
        props.setCreatingTx(false) //Close the popup
    }

    return (
        <Backdrop open>
            <ClickAwayListener onClickAway={() => props.setCreatingTx(false)}>
                <Paper>
                    <div className="tx_holder">
                        <h1>Create Transaction </h1>
                        <div className="to_address">
                            <p>To address: </p>
                            <TextField label='Address' error={wrongTo} helperText={wrongTo && 'Wrong Address'} value={to} onChange={handleToChange} sx={{marginLeft: '10px', minWidth: '400px'}}></TextField>
                        </div>
                        <div className="to_address">
                            <p>Value: </p>
                            <TextField type='number' label='ETH' error={eth<0} helperText={eth<0 && 'Wrong Value'} value={eth} onChange={e=>setEth(e.target.value)} sx={{marginLeft: '10px', minWidth: '400px'}}></TextField>
                        </div>
                        <Button fullWidth variant='contained' disabled={eth<0 || wrongTo || to == ''} onClick={handleCreateTx}>Confirm</Button>
                    </div>
                </Paper>
            </ClickAwayListener>
        </Backdrop>
    )

}

export default CreateTransaction;