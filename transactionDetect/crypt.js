"use strict";

const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });
const axios = require("axios");

class Transaction {
  async getTransaction(callback) {
    const users = await User.find();
    const processedChatIds = new Set();

    for (const user of users) {
      const chatId = user.chatId;
      if (processedChatIds.has(chatId)) {
        continue;
      }

      processedChatIds.add(chatId);

      const ID = user.chatId;
      const image = user.mImage;
      const token = user.ethAddress[0]?.token_Address;
      const pair = user.ethAddress[0]?.pair_Address;
      const Tname = user.ethAddress[0]?.name;
      const Temoji = user.emoji;
      const Tele = user.telegram;
      const stepp = user.step;
      const Csupply = user.cSupply;
      const Clock = [user.timeStamp];
      const Thash = [user.hash];

      if (token == undefined || pair == undefined) {
        console.log(`Token or pair is undefined for chatId: ${chatId}`);
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
            axios.spread(async (...responses) => {
              const { ContractName } = responses[1]?.data?.result[0] || {};
              const { id, date, sent, received } =
                responses[2].data.transactions[0] || {};
              const ball = responses[3].data;
              let ethBal = ball.find((o) => o.contract_name === "Ethereum");
              let whaleee = ball.find((o) => o.quote >= 100);
              let machala = whaleee?.contract_name || {};
              const { balance, quote } = ethBal || { balance: 0, quote: 0 };
              const { total_txs } = responses[4]?.data || { total_txs: 0 };
              const { price } = responses[5]?.data || { price: 0 };
              let priceNum = Number(price);
              const { total_supply } = responses[6]?.data || {
                total_supply: 0,
              };
              let ethValue =
                responses[7]?.data?.data[0]?.quote?.USD?.price || 0;
              let buyerBal = responses[8]?.data?.result || 0;

              if (received.length === 1) {
                if (received[0]?.name === "Wrapped Ether") {
                  // console.log("Received Transaction:", received);
                  // console.log("Sent Transaction:", sent);

                  await User.findOneAndUpdate(
                    { chatId },
                    {
                      timeStamp: date,
                      cSupply: total_supply,
                    },
                    (error, timeeee) => {
                      if (error) {
                        console.log("Error saving");
                      } else {
                        console.log("Na the name be this=>", `${Tname}`);

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
                          { maximumFractionDigits: 2 }
                        );

                        let spentEth;
                        if (
                          typeof ethValue !== "number" ||
                          isNaN(ethValue) ||
                          ethValue === 0 ||
                          isNaN(spentUsd)
                        ) {
                          spentEth = "N/A";
                        } else {
                          spentEth = (spentUsd / ethValue).toFixed(4);
                        }

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
                            position = buyerPOS.toFixed(4) + "%" + " ⬆️";
                          }
                        }

                        let walletVal = balance;
                        let ethWalletVal = (walletVal / 10 ** 18).toFixed(4);
                        let mcap = price * total_supply;
                        let stepVal = spentUsd;
                        let stepEVal = Math.floor(stepVal / stepp);

                        let mcapSum = Number(mcap).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        });
                        let mcapfin = mcapSum;
                        console.log("Working Now...");
                        let emojiRepeat = "";
                        if (stepEVal > 0) {
                          emojiRepeat = Temoji.repeat(stepEVal);
                        }

                        let whaleStats = whaleee
                          ? machala + " " + "🐋"
                          : "Not a Whale";
                        callback(` 
<a href="${Tele}" target="_blank">${ContractName}</a> <b>Buy!</b> 
${emojiRepeat}\n 
 
💲 Spent: <b>${spentEth}</b> ETH ($${spentUsd}) 
🛒 Bag: <b>${realSum} ${sent[0]?.symbol || "Unknown"}</b> 
😎 Buyers Fund: ${ethWalletVal} ETH ($${quote.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}) 
🔼 Position: ${position} 
🛒 Total Buys: # ${total_txs} 
💲 Price: $${priceNum.toFixed(8)} 
📈 MKTCap: $ ${mcapfin} 
🐳 Whale: ${whaleStats}\n 
<a href="https://etherscan.io/tx/${id}"><b>🔼 TX</b></a> | <a href="https://dextools.io/app/ether/pair-explorer/${pair}"><b>📊 Chart</b></a>
<a href="${Tele}"><b>👫 Telegram</b></a> | <a href="https://app.uniswap.org/#/swap?&chain=mainnet&use=v2&outputCurrency=${token}"><b>🦄 Uniswap</b></a>
`);
                      }
                    }
                  );
                } else {
                  // console.log("Received Transaction:", received);
                  // console.log("Sent Transaction:", sent);

                  await User.findOneAndUpdate(
                    { chatId },
                    {
                      timeStamp: date,
                      cSupply: total_supply,
                    },
                    (error, timeeee) => {
                      if (error) {
                        console.log("Error saving");
                      } else {
                        console.log("Na the name be this=>", `${Tname}`);
                      }
                    }
                  );
                }
              } else {
                return;
              }
            })
          );
      } catch (error) {
        console.log(error);
      }
    }
  }
}

// Exporting
module.exports = Transaction;
