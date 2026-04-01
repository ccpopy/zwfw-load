// DNS 映射/解析方法
// 所有方法作为 ProxyLoadBalancer.prototype mixin

module.exports = {
  async loadDNSMappings () {
    try {
      const mappings = await this.db.all('SELECT domain, ip FROM dns_mappings WHERE enabled = 1');
      this.dnsCache.clear();
      for (const mapping of mappings) {
        this.dnsCache.set(mapping.domain.toLowerCase(), mapping.ip);
      }
    } catch (error) {
      console.error('加载DNS映射失败:', error);
    }
  },

  async resolveTarget (request) {
    if (request.addressType === 0x03) {
      const domain = request.host.toLowerCase();
      const mappedIP = this.dnsCache.get(domain);
      if (mappedIP) {
        return {
          ...request,
          originalHost: request.host,
          host: mappedIP,
          addressType: 0x01,
          dnsRewritten: true
        };
      }
    }
    return request;
  },

  flushConnectionsForDomain (domain) {
    if (!domain) return 0;
    const key = String(domain).toLowerCase();
    let closed = 0;
    for (const [client, meta] of this.clientTargets.entries()) {
      if (meta && typeof meta.originalHost === 'string' && meta.originalHost.toLowerCase() === key) {
        try { client.destroy(); } catch (_) { }
        this.clientTargets.delete(client);
        closed++;
      }
    }
    if (closed > 0) {
      // console.log(`[DNS] flushConnectionsForDomain(${key}) closed ${closed} client tunnels`);
    }
    return closed;
  }
};
