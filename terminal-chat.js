const readline = require("readline");

const APP_PORT = process.env.APP_PORT || 3000;

const requestToServer = async (userId, message) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    message,
    userId,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const data = await fetch(`http://localhost:${APP_PORT}/message/process`, requestOptions)
    .then((response) => response.text())
    .then((result) =>result)

  return data;
};

function terminalChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Digite sua mensagem: ", async (message) => {
    rl.close();
    const response = await requestToServer("relampago-02", message);

    console.log("\n\n")
    console.log("\x1b[32mRESPOSTA GPT:", response, "\x1b[0m");
    console.log("\n\n")

    terminalChat();
  });
}

terminalChat();
