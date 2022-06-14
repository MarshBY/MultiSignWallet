import React from "react";
import './Sidebar.css';
import { Button } from "@mui/material";

const Sidebar = (props) => {
    const handleWalletClick = (id) => {
        console.log('Clicked', id);
        props.setCreating(false);
        props.setSelected(id);
    }

    const handleCreate = () => {
        props.setSelected(null);
        props.setCreating(true)
    }

    return (
        props.connected
            ? <div className="sidebar_container">
                <h1>My Wallets</h1>
                <Button onClick={handleCreate} variant='outlined' sx={{margin: '5px'}} >Create New</Button>
                {props.wallets.length > 0 ?
                    props.wallets.map((wallet, i) => (
                        <div className={props.selected != null && props.selected == wallet.id ? 'wallet_container selected' : 'wallet_container'} key={wallet.id} onClick={() => handleWalletClick(i)}>
                            <h2>{wallet.name}</h2>
                        </div>
                    ))
                    :
                    'No wallets'}
            </div>
            : <div className="sidebar_container">
                <h2 style={{padding: '8px'}}>Please connect your wallet</h2>
            </div>
    )
}

export default Sidebar;