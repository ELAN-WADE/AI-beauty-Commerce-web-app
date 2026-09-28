const dns = require('dns');
const net = require('net');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const origLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (!hostname || hostname === 'localhost') {
    const res = options && options.all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1';
    return process.nextTick(() => callback(null, res, 4));
  }

  if (net.isIP(hostname)) {
    return origLookup(hostname, options, callback);
  }

  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      }
      return callback(null, addresses[0], 4);
    }
    return origLookup(hostname, options, callback);
  });
};
