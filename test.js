const axios = require("axios");
const uniswapTokenPairAddress = "0x8823af1b9e9861bdafc637ce8d7f400523a8fe35"; // Replace with the actual token pair address
const uniswapApiUrl = `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`;
const query = `
{
  swaps(first: 5, where: { pair: "${uniswapTokenPairAddress}" }, orderBy: timestamp, orderDirection: desc) {
    transaction {
      id
    }
    amount0In
    amount1In
    amount0Out
    amount1Out
    timestamp
  }
}
`;

try {
  const response = axios.post(uniswapApiUrl, { query });
  const swaps = response.data.data.swaps;

  // Process the list of swaps (transactions)
  for (const swap of swaps) {
    console.log("Swap Transaction ID:", swap.transaction.id);
    console.log(
      "Amounts:",
      swap.amount0In,
      swap.amount1In,
      swap.amount0Out,
      swap.amount1Out
    );
    console.log("Timestamp:", new Date(swap.timestamp * 1000));
    console.log("----------------------");
  }
} catch (error) {
  console.error("Error fetching Uniswap data:", error);
}
