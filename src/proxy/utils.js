function getArithmeticName (str) {
  const mapName = {
    'adaptive': '自适应算法',
    'weighted_round_robin': '加权轮询',
    'least_connections': '最小连接数',
    'sticky_host': '会话粘滞（按域名）'
  };
  return mapName[str] || str;
}

// ProxyLoadBalancer prototype mixin 方法
const methods = {
  readDataWithTimeout (socket, timeout = 2000) {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      let timer;

      const cleanup = () => {
        clearTimeout(timer);
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);
        socket.removeListener('end', onEnd);
      };

      const resetTimeout = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          cleanup();
          if (buffer.length > 0) {
            resolve(buffer);
          } else {
            reject(new Error('读取超时'));
          }
        }, timeout);
      };

      const onData = (data) => {
        buffer = Buffer.concat([buffer, data]);

        if (buffer.length >= 10) {
          cleanup();
          resolve(buffer);
        } else {
          resetTimeout();
        }
      };

      const onError = (err) => {
        cleanup();
        reject(err);
      };

      const onEnd = () => {
        cleanup();
        if (buffer.length > 0) {
          resolve(buffer);
        } else {
          reject(new Error('连接意外关闭'));
        }
      };

      resetTimeout();
      socket.on('data', onData);
      socket.once('error', onError);
      socket.once('end', onEnd);
    });
  },

  readData (socket, timeout = 5000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeout);
      const onData = (data) => {
        clearTimeout(timer);
        resolve(data);
      };
      socket.once('data', onData);
      socket.once('error', () => {
        clearTimeout(timer);
        resolve(null);
      });
    });
  },

  readHttpHeader (socket, timeout = 5000) {
    return new Promise((resolve) => {
      let buffer = Buffer.alloc(0);
      const timer = setTimeout(() => {
        cleanup();
        resolve(buffer);
      }, timeout);

      const onData = (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.includes(Buffer.from('\r\n\r\n'))) {
          cleanup();
          resolve(buffer);
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        socket.off('data', onData);
      };

      socket.on('data', onData);
      socket.once('error', () => {
        cleanup();
        resolve(null);
      });
    });
  },

  parseSocks5Request (data) {
    if (!data || data.length < 7 || data[0] !== 0x05 || data[1] !== 0x01) {
      return null;
    }

    const addressType = data[3];
    let host, port;

    switch (addressType) {
      case 0x01:
        if (data.length < 10) return null;
        host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
        port = (data[8] << 8) | data[9];
        break;

      case 0x03: {
        const domainLength = data[4];
        const end = 5 + domainLength;
        if (data.length < end + 2) return null;
        host = data.toString('utf8', 5, end);
        port = (data[end] << 8) | data[end + 1];
        break;
      }

      case 0x04:
        return null;

      default:
        return null;
    }

    return { cmd: data[1], addressType, host, port };
  },

  buildSocks5ConnectRequest (request) {
    if (request.addressType === 0x03) {
      const domain = Buffer.from(request.host, 'utf8');
      const port = request.port;

      return Buffer.concat([
        Buffer.from([0x05, 0x01, 0x00, 0x03]),
        Buffer.from([domain.length]),
        domain,
        Buffer.from([
          (port >> 8) & 0xff,
          port & 0xff
        ])
      ]);
    } else if (request.addressType === 0x01) {
      const ipParts = request.host.split('.').map(p => parseInt(p, 10));
      return Buffer.from([
        0x05, 0x01, 0x00, 0x01,
        ...ipParts,
        (request.port >> 8) & 0xff,
        request.port & 0xff
      ]);
    } else if (request.addressType === 0x04) {
      throw new Error('暂不支持IPv6地址');
    }

    throw new Error(`不支持的地址类型: ${request.addressType}`);
  },

  setupBidirectionalPipe (client, proxySocket, conn) {
    client.pipe(proxySocket);
    proxySocket.pipe(client);

    const cleanup = () => {
      if (!client.destroyed) client.destroy();
      if (!proxySocket.destroyed) proxySocket.destroy();
      if (conn) this.connectionPool.releaseConnection(conn);
    };

    client.once('error', cleanup);
    client.once('close', cleanup);
    client.once('end', cleanup);
    proxySocket.once('error', cleanup);
    proxySocket.once('close', cleanup);
    proxySocket.once('end', cleanup);
  },

  sendSocks5Error (client, errorCode) {
    if (client.destroyed) return;

    const response = Buffer.from([
      0x05, errorCode, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00
    ]);

    try {
      client.write(response);
      setTimeout(() => {
        if (!client.destroyed) {
          client.end();
        }
      }, 100);
    } catch (e) {
    }
  },

  isCriticalError (error) {
    const criticalMessages = [
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENETUNREACH'
    ];

    return criticalMessages.some(msg =>
      error.code === msg || error.message.includes(msg)
    );
  },

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = { getArithmeticName, methods };
