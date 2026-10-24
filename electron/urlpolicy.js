// Strict destination policy for anything the desktop app hands to the operating system.
const net = require("net"), dns = require("dns").promises;
function isPrivateIp(ip) {
  ip = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) return ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || /^fe[89ab]/.test(ip) || ip.startsWith("ff");
  return true;
}
async function checkExternalUrl(raw) {
  let u;
  try { u = new URL(String(raw)); } catch { return { ok: false, reason: "Invalid URL" }; }
  if (u.href.length > 2048) return { ok: false, reason: "URL too long" };
  if (!["https:", "http:"].includes(u.protocol)) return { ok: false, reason: "Only http(s) links may be opened (blocked: " + u.protocol + ")" };
  if (u.username || u.password) return { ok: false, reason: "Links with embedded credentials are blocked" };
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || /\.(localhost|local|internal|lan|home)$/.test(host)) return { ok: false, reason: "Local/internal destinations are blocked" };
  if (net.isIP(host)) { if (isPrivateIp(host)) return { ok: false, reason: "Private or loopback addresses are blocked" }; }
  else {
    let addrs; try { addrs = await dns.lookup(host, { all: true }); } catch { return { ok: false, reason: "Host could not be resolved" }; }
    if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) return { ok: false, reason: "Host resolves to a private/internal address" };
  }
  return { ok: true, url: u.href };
}
module.exports = { checkExternalUrl, isPrivateIp };
