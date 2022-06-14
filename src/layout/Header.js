import React, { useEffect, useState } from "react";
import Signer from "../context/Signer";
import { useContext } from "react";
import { ethers } from "ethers";
import Button from '@mui/material/Button';
import './Header.css'

const Header = (props) => {
    const signer = useContext(Signer);

    const [account, setAccount] = useState();
    const [balance, setBalance] = useState();

    window.ethereum.on('accountsChanged', () => {
        console.log("Account changed")
        props.setSelected(null)
        getSigner();
    })

    const getSigner = async () => {
        if(window.ethereum){
            const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            const sig = provider.getSigner()
            setAccount(accounts[0])
            props.setSigner(sig);
        }else {
            console.log('No MetaMask found');
            alert('Please install Metamask to continue');
        }
    }

    const getBalance = async () => {
        if(!signer) return;

        const bal = await signer.getBalance()
        setBalance((+ethers.utils.formatEther(bal.toString()).toString()).toFixed(3))
    }

    const handleAccountClick = () => {
        if(account) {
            //Logout
        }else {
            //Login
            getSigner();
        }
    }

    useEffect(() => {
        getSigner();
    }, [])

    useEffect(() => {
        getBalance();
    }, [signer])

    return(
        <div className="header_container">
            <h1>LOGO</h1>
            <div className="account_container">
                <p>{balance != null && `${balance} ETH`}</p>
                <Button sx={{backgroundColor: '#2b78af', borderRadius: '14px', color: 'white'}} variant='contained' onClick={handleAccountClick}>{account ? account.substring(0,6) + '...' + account.substring(account.length - 4, account.length) : "Connect Wallet"}</Button>
            </div>
        </div>
    )
}

export default Header;