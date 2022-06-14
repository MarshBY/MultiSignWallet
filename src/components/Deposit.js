import React, { useContext, useEffect, useState } from "react";
import Signer from '../context/Signer';
import Backdrop from '@mui/material/Backdrop';
import ClickAwayListener from '@mui/base/ClickAwayListener';
import Paper from '@mui/material/Paper'
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import { ethers } from "ethers";
import './Deposit.css'

const Deposit = (props) => {
    const signer = useContext(Signer)

    const [eth, setEth] = useState();
    const [balance, setBalance] = useState('');

    const handleConfirm = async () => {
        if(eth <= 0 || eth > balance) return;

        const tx = await signer.sendTransaction({
            to: props.address,
            value: ethers.utils.parseEther(eth.toString())
        })
        const receipt = await tx.wait();
        console.log(receipt);

        //GetBalance in Wallet
        props.getBalance();
        props.setDepositing(false);
    }

    const getBalance = async () => {
        const balance = await signer.getBalance()
        setBalance(parseInt(ethers.utils.formatEther(balance.toString())));
    }

    useEffect(() => {
        getBalance();
    }, [])

    return (
        <Backdrop open>
            <ClickAwayListener onClickAway={() => props.setDepositing(false)}>
                <Paper>
                    <div className="deposit_holder">
                        <h1>Deposit ETH</h1>
                        <TextField error={eth <= 0 || eth > balance} helperText={eth <= 0 ? 'Wrong Value' : (eth > balance ? 'Not enough balance' : '')} type='number' label='ETH' value={eth} onChange={e => setEth(e.target.value)}></TextField>
                        <Button disabled={eth <= 0 || eth > balance || !eth} fullWidth sx={{marginTop: '20px'}} variant='contained' onClick={handleConfirm}>Deposit</Button>
                    </div>
                </Paper>
            </ClickAwayListener>
        </Backdrop>
    )
}

export default Deposit