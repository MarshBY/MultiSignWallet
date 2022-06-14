import React, { useEffect, useState } from "react";
import Signer from "./context/Signer";
import Header from "./layout/Header";
import './App.css'
import Sidebar from "./layout/Sidebar";
import Wallet from "./layout/Wallet";
import { ThemeProvider } from "@mui/system";
import theme from "./utils/theme";
import CreateWallet from "./components/CreateWallet";
import { CookiesProvider } from "react-cookie";
import { useCookies } from "react-cookie";
import constants from "./utils/constants";
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { ethers } from "ethers";

const App = () => {

    const [signer, setSigner] = useState();
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false)
    const [wallets, setWallets] = useState([]);
    const [openNotif, setOpenNotif] = useState({ open: false, message: '' });

    const [cookies, setCookie] = useCookies(['wallets']);

    useEffect(() => {
        getWallets();
    }, [signer])

    const getWallets = async () => {
        if (!signer) return;
        
        const address = await signer.getAddress();
        console.log('Getting wallets for ', address)

        const filter = {
            fromBlock: constants.startingBlock,
            address: constants.factoryAddress,
            topics: [
                ethers.utils.id("MultiSignWalletOwner(address,address)"),
                ethers.utils.hexZeroPad(address, 32)
            ]
        }

        const logs = await signer.provider.getLogs(filter);

        if (logs.length == 0) {
            setWallets([]);
            return;
        }

        let wal = [];
        for (const [i, log] of logs.entries()) {
            //Get wallet address
            const walletAddress = ethers.utils.defaultAbiCoder.decode(['address'], log.data)[0];

            //Get wallet name
            const name = cookies[walletAddress] && cookies[walletAddress].name;

            console.log(name);

            //Add Wallet
            wal.push({
                address: walletAddress,
                id: i,
                blockCreated: log.blockNumber,
                name: name || 'Wallet ' + (i + 1),
            })
        }

        setWallets(wal);
    }

    const handleNotifClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenNotif({ open: false, message: '' })
    }

    return (
        <ThemeProvider theme={theme}>
            <Signer.Provider value={signer}>
                <CookiesProvider>
                    <Header setSigner={setSigner} setSelected={setSelected} />
                    <div className="main">
                        <Sidebar connected={signer != null} wallets={wallets} setSelected={setSelected} selected={selected} setCreating={setCreating} />
                        <Snackbar
                            open={openNotif.open}
                            autoHideDuration={5000}
                            onClose={handleNotifClose}
                            message={openNotif.message}
                            action={
                                <IconButton
                                    size="small"
                                    aria-label="close"
                                    color="inherit"
                                    onClick={handleNotifClose}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            }
                        />
                        {creating
                            ? <CreateWallet setOpenNotif={setOpenNotif} setWallets={setWallets} setSelected={setSelected} id={wallets.length} setCreating={setCreating} />
                            : selected != null &&
                            <Wallet setOpenNotif={setOpenNotif} wallet={wallets[selected]} selected={selected} setWallets={setWallets} />
                        }
                    </div>
                </CookiesProvider>
            </Signer.Provider>
        </ThemeProvider>
    )
}

export default App;