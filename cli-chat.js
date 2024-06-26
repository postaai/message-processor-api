const readline = require("readline");

const APP_PORT = process.env.APP_PORT || 3000;

const userId = process.argv[2] || "user-default";

console.log("\x1b[32mChat com user id ---->", userId, "\x1b[0m");

const requestToServer = async (userId, message) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    message,
    userId,
    assistantId:"asst_tePfOqvESxoNrsvxOYZ9m93t"
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const data = await fetch(`http://localhost:${APP_PORT}/message/process`, requestOptions)
    .then((response) => response.text())
    .then((result) =>result).catch((error) => console.log("error", error));

  return data;
};

function terminalChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Digite sua mensagem: ", async (message) => {
    rl.close();
    console.log("\x1b[34mprocessando...\x1b[0m");
    const response = await requestToServer(userId, message);

    const responseObj = JSON.parse(response);

    console.log("\n")
    console.log("\x1b[32mRESPOSTA GPT:", responseObj.message, "\x1b[0m");

    terminalChat();
  });
}

terminalChat();
