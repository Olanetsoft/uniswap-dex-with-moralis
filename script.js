const serverUrl = "https://hbc5m1pibhdo.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "fW0wg44rey4RBD4dkMhGlde8bwbjS0sy5K790VKc"; // Application id from moralis.io

// Global variables
let currentUser;
let trade = {};
let selection;
let tokens;

// App initialization
async function initialize() {
  await Moralis.start({
    serverUrl,
    appId,
  });

  // Login Functionality
  currentUser = Moralis.User.current();
  if (currentUser) {
    document.getElementById("top-connect-wallet-button").innerText =
      "Connected";
    document.getElementById("main-connect-wallet-button").innerText = "Swap";
  }

  // Load Tokens
  await availableTokens();
}

// Login
async function login() {
  try {
    // Validate is user is logged in
    currentUser = Moralis.User.current();
    if (!currentUser) {
      currentUser = await Moralis.authenticate();
    }

    // Update UI
    document.getElementById("top-connect-wallet-button").innerText =
      "Connected";
    document.getElementById("main-connect-wallet-button").innerText = "Swap";
  } catch (error) {
    console.log(error);
  }
}

// List all available tokens
async function availableTokens() {
  // Get all tokens
  const result = await Moralis.Plugins.oneInch.getSupportedTokens({
    chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
  });
  tokens = result.tokens;

  // Render all tokens
  let parent = document.getElementById("all-coin-list");

  let ul = document.createElement("ul");

  // Render all tokens
  for (const address in tokens) {
    let token = tokens[address];

    let li = document.createElement("li");

    li.innerHTML = `<img src="${token.logoURI}" alt=""><span class="token_list_text">${token.symbol}</span>`;

    ul.appendChild(li);

    // Add event listener to select token
    li.addEventListener("click", () => {
      selectToken(address);
    });
  }

  // Append all tokens to the parent div
  parent.appendChild(ul);
}

// Search for a token functionality
function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("search-input");
  filter = input.value.toUpperCase();
  div = document.getElementById("all-coin-list");
  a = div.getElementsByTagName("li");

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

// Select token functionality
function selectToken(address) {
  // Get token
  trade[selection] = tokens[address];

  // Render selected token on the interface
  renderInterface();

  // Get estimated quotation and Gas fee
  getQuotation();
}

// Render selected token on the interface
function renderInterface() {
  // Render selected token on the interface
  if (trade.from) {
    document.getElementById("from-token-img").src = trade.from.logoURI;
    document.getElementById("from-token-text").innerHTML = trade.from.symbol;
    document.getElementById("token-default-img").style.display = "none";
  }

  // Render selected token on the interface
  if (trade.to) {
    document.getElementById("to-token-img").src = trade.to.logoURI;
    document.getElementById("to-token-text").innerHTML = trade.to.symbol;
    document.getElementById("select-token-text").innerHTML = "";
  }
}

// Get estimated quotation and Gas fee
async function getQuotation() {
  // Validate fields are not empty
  if (!trade.from || !trade.to || !document.getElementById("from-amount").value)
    return;

  // Get from amount
  let amount = Number(
    document.getElementById("from-amount").value * 10 ** trade.from.decimals
  );

  // Get estimated quotation and Gas fee
  const quote = await Moralis.Plugins.oneInch.quote({
    chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: trade.from.address, // The token you want to swap
    toTokenAddress: trade.to.address, // The token you want to receive
    amount: amount,
  });

  console.log(quote);

  // Render quotation
  document.getElementById("gas-estimate").innerHTML = quote.estimatedGas;
  document.getElementById("to-amount").value =
    quote.toTokenAmount / 10 ** quote.toToken.decimals;
}

// Validate if User can Swap
async function validateSwap() {
  // Enable Moralis web3 instance to enable swap functionality
  await Moralis.enableWeb3();

  let address = Moralis.User.current().get("ethAddress");
  let amount = Number(
    document.getElementById("from-amount").value * 10 ** trade.from.decimals
  );

  // Validate if User can Swap
  if (trade.from.symbol !== "ETH") {
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
      chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: trade.from.address, // The token you want to swap
      fromAddress: address, // Your wallet address
      amount: amount,
    });
    console.log(allowance);

    // If user has allowance
    if (!allowance) {
      await Moralis.Plugins.oneInch.approve({
        chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
        tokenAddress: trade.from.address, // The token you want to swap
        fromAddress: address, // Your wallet address
      });
    }
  }

  try {
    // Do the swap
    await Swap(address, amount);
  } catch (error) {
    console.log(error);
  }
}

// Swap functionality
async function Swap(userAddress, amount) {
  // Swap token
  return Moralis.Plugins.oneInch.swap({
    chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: trade.from.address, // The token you want to swap
    toTokenAddress: trade.to.address, // The token you want to receive
    amount: amount,
    fromAddress: userAddress, // Your wallet address
    slippage: 1,
  });
}

// App initialization
initialize();

// Login button
document.getElementById("top-connect-wallet-button").onclick = login;
document.getElementById("main-connect-wallet-button").onclick = login;

// Select side
document.getElementById("from-token-selected").onclick = () => {
  selection = "from";
};
document.getElementById("to-token-selected").onclick = () => {
  selection = "to";
};

// Swap button
document.getElementById("main-connect-wallet-button").onclick = validateSwap;
