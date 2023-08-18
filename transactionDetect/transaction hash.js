module.exports = {
  validateToken: (tokenAddress) =>
    axios({
      method: "GET",
      url: `https://api.etherscan.io/api?module=account&action=txlist&address=${tokenAddress}&apikey=6CYPKK8GJK1QW4IR3XAVNAZWZKYSZ6NZ8R`,
    }),
};
