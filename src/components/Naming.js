import React, { useState } from "react";
import Backdrop from '@mui/material/Backdrop';
import ClickAwayListener from '@mui/base/ClickAwayListener';
import Paper from '@mui/material/Paper'
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import './Naming.css';

const Naming = (props) => {

    const [name, setName] = useState('');

    return (
        <Backdrop open>
            <ClickAwayListener onClickAway={() => props.setNaming(false)}>
                <Paper>
                    <div className="naming_holder">
                        <h1>Set new name for {props.name}</h1>
                        <TextField sx={{marginBottom: '15px'}} fullWidth label='Name' value={name} onChange={e=>setName(e.target.value)} />
                        <Button fullWidth variant='contained' onClick={() => {props.changeName(name); props.setNaming(false)}}>Confirm</Button>
                    </div>
                </Paper>
            </ClickAwayListener>
        </Backdrop>
    )
}

export default Naming