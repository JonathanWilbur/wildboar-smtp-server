const smtp = require("smtp-client");

let s = new smtp.SMTPClient({
    host: '127.0.0.1',
    port: 25
});

s.on("receive", (chunk) => {
    console.log(chunk);
});

(async function() {
    await s.connect();
    await s.rset();
    // await s.vrfy(); // Not implemented in this client.
    // await s.expn(); // Not implemented in this client.
    await s.noop();
    // await s.help(); // Not implemented in this client.
    await s.greet({hostname: 'spaghetti'});
    await s.authPlain({username: 'john', password: 'secret'}); // authenticates a user
    await s.mail({from: 'from@sender.com'});
    await s.rcpt({to: 'to@recipient.com'});
    await s.data('TESTERONI\r\n.something else \r\n...WUTT?'); // runs DATA command and streams email source
    await s.quit(); // runs QUIT command
})().catch(console.error);