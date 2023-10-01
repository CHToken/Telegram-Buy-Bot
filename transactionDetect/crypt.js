"use strict";

const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });
const axios = require("axios");
const web3 = require("web3");

// Function to get the token balance for a wallet address
async function getTokenBalance(tokenAddress, walletAddress) {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${walletAddress}&tag=latest&apikey=${process.env.ETHERSCAN}`
    );

    if (response.data.status === "1") {
      const balanceWei = response.data.result;
      const balanceEth = web3.utils.fromWei(balanceWei, "ether");
      
      console.log(`Balance in Wei: ${balanceWei}`);
      console.log(`Balance in Ether (ETH): ${balanceEth}`);
      
      return parseFloat(balanceEth);
    } else {
      return 0;
    }
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return 0;
  }
}

// Function to format balance
function formatBalance(balance) {
  if (balance >= 1000000000000) {
    const formattedBalance = (balance / 1000000000).toFixed(2) + "Trillion";
    return `${formattedBalance}`;
  }else if (balance >= 1000000000) {
    const formattedBalance = (balance / 1000000000).toFixed(2) + "Billion";
    return `${formattedBalance}`;
  } else if (balance >= 1000000) {
    const formattedBalance = (balance / 1000000).toFixed(2) + "Million";
    return `${formattedBalance}`;
  } else if (balance >= 1000) {
    const formattedBalance = (balance / 1000).toFixed(2) + "K";
    return `${formattedBalance}`;
  } else {
    return `${balance.toFixed(4)}`;
  }
}

class Transaction {
  async getTransaction(callback) {
    const users = await User.find();

    for (const user of users) {
      const chatId = user.chatId;
      console.log(`Processing chatId: ${chatId}`);
      
      let responses = {};
      try {
        const token = user.ethAddress[0]?.token_Address;
        const pair = user.ethAddress[0]?.pair_Address;
        const Temoji = user.emoji;
        const Tele = user.telegram;
        const stepp = user.step;
        
        if (token == undefined || pair == undefined) {
          console.log(`Token or pair is undefined for chatId: ${chatId}`);
          continue;
        }
        
        const lastProcessedTransaction = user.processedTransactions.slice(-1)[0];
        // Fetch the latest transaction data
        const res = await axios.get(
          `https://api.unmarshal.com/v3/ethereum/address/${token}/transactions?page=1&pageSize=1&contract=string&price=true&auth_key=${process.env.UNMARSHAL}`
        );

        const latestTransaction = res.data.transactions[0];
        if (latestTransaction && latestTransaction.id === lastProcessedTransaction) {
          console.log(`Skipping chatId: ${chatId} as the transaction ${latestTransaction.id} has already been processed.`);
          continue;
        }

        const transactionId = responses[2]?.data?.transactions[0]?.id;
        if (user.processedTransactions.includes(transactionId)) {
          console.log(`Skipping chatId: ${chatId} as the transaction ${transactionId} has already been processed.`);
          continue;
        }

        try {
          const res = await axios.get(
            `https://api.unmarshal.com/v3/ethereum/address/${token}/transactions?page=1&pageSize=5&contract=string&price=true&auth_key=${process.env.UNMARSHAL}`
          );

          const con = await axios.get(
            `https://api.etherscan.io/api?module=contract&action=getsourcecode&apikey=${process.env.ETHERSCAN}&address=${token}`
          );

          const vall = await axios.get(
            `https://api.unmarshal.com/v2/ethereum/address/${pair}/transactions?page=1&pageSize=10&contract=string&auth_key=${process.env.UNMARSHAL}`
          );

          const val = await axios.get(
            `https://api.unmarshal.com/v1/ethereum/address/${vall.data.transactions[0].from}/assets?verified=true&chainId=false&token=false&auth_key=${process.env.UNMARSHAL}`
          );

          const coun = await axios.get(
            `https://api.unmarshal.com/v2/ethereum/address/${vall.data.transactions[0].from}/transactions?page=1&pageSize=5&contract=${token}&auth_key=${process.env.UNMARSHAL}`
          );

          const priceS = await axios.get(
            `https://api.unmarshal.com/v1/pricestore/chain/ethereum/${token}?timestamp=${vall.data.transactions[0].date}&auth_key=${process.env.UNMARSHAL}`
          );

          const conversion = await axios.get(
            "https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=1&symbol=ETH",
            {
              headers: {
                "X-CMC_PRO_API_KEY": process.env.COINMARKET_CAP,
              },
            }
          );

          const buyerTBalance = await axios.get(
            `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${token}&address=${vall.data.transactions[0].from}&tag=latest&apikey=${process.env.ETHERSCAN}`
          );

          const supplyS = await axios.get(
            `https://api.unmarshal.com/v1/tokenstore/token/address/${token}?auth_key=${process.env.UNMARSHAL}`
          );

          await axios
            .all([
              res,
              con,
              vall,
              val,
              coun,
              priceS,
              supplyS,
              conversion,
              buyerTBalance,
            ])
            .then(
              axios.spread(async (...responseData) => {
                responses = responseData;

                const { ContractName } = responses[1]?.data?.result[0] || {};
                const { id, sent, received } =
                  responses[2].data.transactions[0] || {};
                const ball = responses[3].data;
                let ethBal = ball.find((o) => o.contract_name === "Ethereum");
                let whaleee = ball.find((o) => o.quote >= 300);
                const machala = whaleee?.contract_address || null;
                const { balance, quote } = ethBal || { balance: 0, quote: 0 };
                const total_txs = responses[4]?.data?.total_txs || 0;
                const { price } = responses[5]?.data || { price: 0 };
                let priceNum = Number(price);
                const { total_supply } = responses[6]?.data || {
                  total_supply: 0,
                };
                let ethValue = 0;

                if (
                  responses[7]?.data?.data[0]?.quote?.USD?.price !== undefined
                ) {
                  ethValue = parseFloat(
                    responses[7].data.data[0].quote.USD.price
                  );
                }
                let buyerBal = responses[8]?.data?.result || 0;

                let whaleeeBalance = 0;

                if (whaleee && machala) {
                  // Get the token balance for whaleee's contract
                  whaleeeBalance = await getTokenBalance(
                    machala,
                    vall.data.transactions[0].from
                  );
                }

                if (received.length === 1) {
                  if (received[0]?.name === "Wrapped Ether") {
                    let value1 = Number(sent[0]?.value) || 0;
                    let value2 = Number(sent[1]?.value) || 0;
                    let value3 = Number(sent[2]?.value) || 0;
                    let value4 = Number(sent[3]?.value) || 0;
                    let value5 = Number(sent[4]?.value) || 0;
                    let sum =
                      value1 / 10 ** sent[0]?.decimals +
                      value2 / 10 ** sent[0]?.decimals +
                      value3 / 10 ** sent[0]?.decimals +
                      value4 / 10 ** sent[0]?.decimals +
                      value5 / 10 ** sent[0]?.decimals;
                    let sumation = Number(sum);

                    let realSum = sumation.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    });
                    let spentUsd = (sumation * priceNum).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      }
                    );

                    // Calculate the ETH spent in Wei
                    let spentEthWei = "N/A";

                    if (typeof ethValue === "number" && !isNaN(ethValue) && ethValue !== 0) {
                      spentEthWei = (spentUsd / ethValue) * 10 ** 18;
                    }

                    let spentEth = "N/A";
                    if (typeof spentEthWei !== "string") {
                      spentEth = (spentEthWei / 10 ** 18).toFixed(3);
                    }
                    // Display the spent ETH in the console log
                    console.log(`Spent ETH in Wei: ${spentEthWei}`);
                    console.log(`Spent ETH in Ether: ${spentEth}`);

                    let buyerBalance =
                      Number(buyerBal) / 10 ** sent[0]?.decimals || 0;
                    let circulatingSupply = total_supply - buyerBalance;

                    let buyerPOS = (buyerBalance / circulatingSupply) * 100;
                    buyerPOS = isNaN(buyerPOS) ? 0 : buyerPOS;

                    let position;
                    if (total_txs === 1) {
                      position = "🆕 New Holder";
                    } else {
                      if (buyerPOS <= 0) {
                        position = "Not a Holder";
                      } else {
                        position = buyerPOS.toFixed(4) + "%" + " 🔝";
                      }
                    }

                    let walletVal = balance;
                    let ethWalletVal = (walletVal / 10 ** 18).toFixed(3);
                    let mcap = price * total_supply;
                    let stepVal = spentUsd;
                    let stepEVal = Math.floor(stepVal / stepp);

                    let mcapSum = Number(mcap).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    });
                    let mcapfin = mcapSum;
                    console.log("Working Now...");
                    let emojiRepeat = "";
                    if (stepEVal > 0) {
                      emojiRepeat = Temoji.repeat(stepEVal);
                    }

                    let whaleStats = whaleee ? true : false;

                    let formattedWhaleeeBalance = "";
                    if (whaleStats) {
                      formattedWhaleeeBalance =
                        formatBalance(whaleeeBalance);
                    }

                    let whaleStatsText = "";

                    if (whaleStats) {
                      if (whaleee?.contract_name === "Ethereum") {
                        whaleStatsText = `Ethereum 🐋 ${ethWalletVal} ETH ($${quote.toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )})`;
                      } else {
                        whaleStatsText = `<a href="https://etherscan.io/address/${machala}" target="_blank">${whaleee?.contract_name}</a> 🐋 ${formattedWhaleeeBalance}`;
                      }
                    } else {
                      whaleStatsText = "Not a whale";
                    }

                    console.log(
                      `Ethereum Whale Balance: ${whaleeeBalance} ${whaleee?.contract_name}`
                    );

                    callback(`
<a href="${Tele}" target="_blank">${ContractName}</a> <b>Buy!</b>
${emojiRepeat}

💲 Spent: <b>${spentEth}</b> ETH ($${spentUsd})
🛒 Bag: <b>${realSum} ${sent[0]?.symbol || "Unknown"}</b>
😎 Buyers Fund: ${ethWalletVal} ETH ($${quote.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })})
🔼 Position: ${position}
🛒 Total Buys: # ${total_txs}
💲 Price: $${priceNum.toFixed(6)}
📈 MKTCap: $ ${mcapfin}
🐳 Whale: ${whaleStatsText}\n
<a href="https://etherscan.io/tx/${id}"><b>🔼 TX</b></a> | <a href="https://dextools.io/app/ether/pair-explorer/${pair}"><b>📊 Chart</b></a>
<a href="${Tele}"><b>👫 Telegram</b></a> | <a href="https://app.uniswap.org/#/swap?&chain=mainnet&use=v2&outputCurrency=${token}"><b>🦄 Uniswap</b></a>
                      `);
                  }
                } else {
                  return;
                }
              })
            );
            // Send the transaction to Telegram
            const transactionId = latestTransaction.id;
            // Update the user's processedTransactions array with the new transactionId
            await User.findOneAndUpdate(
              { chatId },
              {
                processedTransactions: [...user.processedTransactions, transactionId],
              }
            );
          } catch (error) {
            console.log(error);
          }
        } catch (error) {
        console.log(error);
      }
    }
  }
}

module.exports = Transaction;
