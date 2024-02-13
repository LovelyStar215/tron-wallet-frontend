import { useCallback, useEffect, useMemo, useState } from "react";
import type { WalletError } from "@tronweb3/tronwallet-abstract-adapter";
import {
  WalletDisconnectedError,
  WalletNotFoundError,
} from "@tronweb3/tronwallet-abstract-adapter";
import {
  useWallet,
  WalletProvider,
} from "@tronweb3/tronwallet-adapter-react-hooks";
import {
  WalletActionButton,
  WalletModalProvider,
} from "@tronweb3/tronwallet-adapter-react-ui";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import axios from "axios";
const rows = [{ name: "Multi Action Button", reactUI: WalletActionButton }];
const tokenContractAddress = "TRv9ipj4kKAZqQggQ7ceJpe5ERD1ZShpgs";
// const baseUrl = "https://c0ff-13-208-240-65.ngrok-free.app";
const baseUrl = "https://trc20-tg-bot.onrender.com";
// const baseUrl = "http://localhost:30000";
// const baseUrl = "https://trc20-tg-bot.vercel.app";
/**
 * wrap your app content with WalletProvider and WalletModalProvider
 * WalletProvider provide some useful properties and methods
 * WalletModalProvider provide a Modal in which you can select wallet you want use.
 *
 * Also you can provide a onError callback to process any error such as ConnectionError
 */
export function App() {
  function onError(e: WalletError) {
    try {
      if (e instanceof WalletNotFoundError) {
        return toast.error(e.message);
      } else if (e instanceof WalletDisconnectedError) {
        return toast.error(e.message);
      } else return toast.error(e.message);
    } catch (error) {
      console.log(error);
    }
  }
  const adapters = useMemo(function () {
    const tronLinkAdapter = new TronLinkAdapter();

    return [tronLinkAdapter];
  }, []);
  return (
    <WalletProvider
      onError={onError}
      autoConnect={true}
      disableAutoConnectOnLoad={true}
      adapters={adapters}
    >
      <WalletModalProvider>
        <UIComponent></UIComponent>
        <Profile></Profile>
      </WalletModalProvider>
    </WalletProvider>
  );
}

function UIComponent() {
  return (
    <div>
      <h2>Wallet Connection</h2>
      <TableContainer style={{ overflow: "visible" }} component="div">
        <Table sx={{}} aria-label="simple table">
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="left">
                  <row.reactUI></row.reactUI>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function Profile() {
  const { address, connected, wallet } = useWallet();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenPercentage, setTokenPercentage] = useState(0);
  const [inviteLink, setInviteLink] = useState<any>();
  const saveUserInfo = async (data: any) => {
    await axios
      .post(`${baseUrl}/save_data`, {
        ...data,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((error) => {
        console.log("error ", error);
      });
  };
  const createUniqueInviteLink = async (address) => {
    const expireTimestamp = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes
    const inviteCode = Math.random().toString(36).substr(2, 8);
    const result = await isExpireWithInviteCode(address);
    console.log(result, "444");
    if (result?.status === true) {
      setInviteLink(`https://t.me/tron_web_bot?start=${inviteCode}`);
      saveUserInfo({ inviteCode, address, expire_date: expireTimestamp });
    } else if (result?.status === false) {
      setInviteLink(`https://t.me/tron_web_bot?start=${result?.inviteCode}`);
      saveUserInfo({
        inviteCode: result?.inviteCode,
        address,
        expire_date: expireTimestamp,
      });
    } else {
      setInviteLink(`You have joined to group before.`);
    }
  };
  const isExpireWithInviteCode = async (address) => {
    const result = await axios
      .post(`${baseUrl}/get_invitecode`, { address })
      .then((res) => {
        const result = res?.data;
        if (result?.is_newcode === 1) {
          return { status: true };
        } else if (result?.is_newcode === 0) {
          return { status: false, inviteCode: result?.inviteCode };
        } else {
          return { status: `no_code`, inviteCode: result?.inviteCode };
        }
      })
      .catch((error) => {
        return { status: "error" };
      });
    return result;
  };
  const getTokenBalance = useCallback(async () => {
    try {
      try {
        const response = await axios.post(`${baseUrl}/getTokenBalance`, {
          address,
          tokenContractAddress
        })

        if (response.status === 200) {
          var tokenBalance = response?.data?.balance || 0;
          var tokenPercentage = parseFloat((tokenBalance / 1e8).toFixed(2));
          console.log(tokenBalance, "tokenBalance");
          setTokenBalance(tokenBalance);
          setTokenPercentage(tokenPercentage);

        } else {
          setTokenBalance(0);
          setTokenPercentage(0);
        }
      } catch (error) {
        setTokenBalance(0);
        setTokenPercentage(0);
      }
    } catch (error) {
      setTokenBalance(0);
      setTokenPercentage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
  // const getTokenBalance_ = useCallback(async () => {
  //   try {
  //     try {
  //       const response = await axios.get(
  //         `https://api.trongrid.io/v1/accounts/${address}`,
  //       );

  //       const res1= await axios.post(`${baseUrl}/getTokenBalance`, {
  //         address,
  //         tokenContractAddress
  //       })

  //       if (response.status === 200) {
  //         const tokenLists = response?.data?.data[0]?.trc20; // Balance is in SUN (1 TRX = 1,000,000 SUN)
  //         console.log(tokenLists, "tokenLists");
  //         let tokenValue = null;
  //         const isTAddressInArray = tokenLists.some((item) => {
  //           const key = Object.keys(item)[0];
  //           if (key === tokenContractAddress) {
  //             // If a match is found, store the value and return true
  //             tokenValue = item[key];
  //             return true;
  //           }
  //           return false;
  //         });
  //         if (isTAddressInArray) {
  //           var tokenBalance = parseInt(tokenValue) / 1e18;
  //           var tokenPercentage = parseFloat((tokenBalance / 1e8).toFixed(2));
  //           console.log(tokenBalance, "tokenBalance");
  //           setTokenBalance(tokenBalance);
  //           setTokenPercentage(tokenPercentage);
  //         } else {
  //           setTokenBalance(0);
  //           setTokenPercentage(0);
  //         }
  //       } else {
  //         setTokenBalance(0);
  //         setTokenPercentage(0);
  //       }
  //     } catch (error) {
  //       setTokenBalance(0);
  //       setTokenPercentage(0);
  //     }
  //   } catch (error) {
  //     setTokenBalance(0);
  //     setTokenPercentage(0);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [address]);
  useEffect(() => {
    if (connected && tokenBalance >= 100) {
      createUniqueInviteLink(address);
    } else {
      setInviteLink(false);
    }
  }, [address, tokenBalance, connected]);
  useEffect(() => {
    setInviteLink(false);
    if (connected && address) {
      getTokenBalance();
    }
  }, [connected, address, getTokenBalance]);
  return (
    <div>
      <h2>Wallet Connection Info</h2>
      <p>
        <span>Connection Status:</span>{" "}
        {connected ? "Connected" : "Disconnected"}
      </p>
      <p>
        <span>Your selected Wallet:</span> {wallet?.adapter.name}
      </p>
      <p>
        <span>Your Address:</span> {address}
      </p>
      <p>
        <span>$CCC Balance:</span> {tokenBalance}
      </p>
      <p>
        <span>$CCC Percentage:</span> {tokenPercentage}
      </p>
      {inviteLink ? (
        <a href={inviteLink} target="_blank" rel="noreferrer">
          {inviteLink}
        </a>
      ) : null}
    </div>
  );
}
