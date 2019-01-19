const smtp = require("smtp-client");

let s = new smtp.SMTPClient({
    host: '127.0.0.1',
    port: 25
});

s.on("receive", (chunk) => {
    console.log(chunk);
});

s.connect();
s.greet({ hostname: "spaghetti" });
// s.authPlain({ username: "bob", password: "mccobb" });
s.mail({ from: "bob@mccobb.com" });
s.rcpt({ to: "joe@schmoe.com" });
// s.data("mail source?");
s.quit();