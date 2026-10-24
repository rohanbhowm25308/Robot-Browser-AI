const { checkExternalUrl } = require("../electron/urlpolicy"); const assert = require("assert");
(async () => {
  const blocked = ["file:///etc/passwd", "javascript:alert(1)", "ms-msdt:/x", "http://127.0.0.1:5000/", "http://localhost/", "http://[::1]/", "http://192.168.1.5/", "http://10.0.0.1/", "http://169.254.169.254/latest", "https://user:pw@example.com/", "http://[::ffff:127.0.0.1]/", "http://internal.local/", "not a url", "http://" + "a".repeat(3000) + ".com"];
  for (const u of blocked) assert.strictEqual((await checkExternalUrl(u)).ok, false, "should block " + u);
  assert.strictEqual((await checkExternalUrl("https://93.184.216.34/")).ok, true);
  console.log("electron url policy: all " + (blocked.length + 1) + " cases pass");
})().catch(e => { console.error(e.message); process.exit(1); });
