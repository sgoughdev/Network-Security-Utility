import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// List of realistic mock vendors based on MAC prefixes
const MAC_VENDORS = [
  { prefix: "00:00:0C", name: "Cisco Systems" },
  { prefix: "00:1A:11", name: "Hewlett Packard" },
  { prefix: "00:25:90", name: "Super Micro Computer" },
  { prefix: "44:65:0D", name: "Amazon Technologies (Echo/Fire)" },
  { prefix: "70:5A:0F", name: "Ubiquiti Networks" },
  { prefix: "D8:07:B6", name: "Apple Inc." },
  { prefix: "BC:CF:CC", name: "Dell Inc." },
  { prefix: "C0:E5:68", name: "Raspberry Pi Foundation" },
  { prefix: "F4:F2:6D", name: "Samsung Electronics" },
  { prefix: "18:62:2C", name: "Sagemcom Broadband" }
];

// OS options matching host types
const HOST_TYPES = [
  { type: 'router', os: 'Cisco Router', ports: [80, 443, 22, 23, 161] },
  { type: 'switch', os: 'Cisco IOS', ports: [22, 23, 161] },
  { type: 'server', os: 'Linux', ports: [22, 80, 443, 3306, 5432, 8080] },
  { type: 'server', os: 'Windows Server', ports: [80, 443, 139, 445, 3389] },
  { type: 'workstation', os: 'Windows Server', ports: [139, 445, 3389] },
  { type: 'workstation', os: 'macOS', ports: [22, 5900] },
  { type: 'iot', os: 'Embedded IoT', ports: [80, 554, 1883, 8081] },
  { type: 'printer', os: 'Embedded IoT', ports: [80, 443, 515, 631, 9100] },
  { type: 'firewall', os: 'Linux', ports: [22, 80, 443, 8443] }
];

const PORT_SERVICES: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  139: "NetBIOS",
  143: "IMAP",
  161: "SNMP",
  443: "HTTPS",
  445: "Microsoft-DS",
  515: "LPD",
  554: "RTSP",
  631: "IPP",
  1433: "MSSQL",
  1521: "Oracle",
  1883: "MQTT",
  3306: "MySQL",
  3389: "RDP",
  5432: "PostgreSQL",
  5900: "VNC",
  6379: "Redis",
  8080: "HTTP-Proxy",
  8081: "IoT-Web",
  8443: "HTTPS-Alt",
  27017: "MongoDB"
};

// Generates a predictable yet randomized set of hosts for a subnet
function generateSubnetHosts(subnet: string): any[] {
  // Extract first 3 octets, default to 192.168.1 if malformed
  const parts = subnet.split('.');
  let baseOctets = "192.168.1";
  if (parts.length >= 3) {
    baseOctets = `${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  const hosts: any[] = [];
  
  // Always place the default gateway at .1
  const gatewayMac = `70:5A:0F:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
  hosts.push({
    id: `host-1`,
    ip: `${baseOctets}.1`,
    hostname: "gateway.local",
    mac: gatewayMac,
    vendor: "Ubiquiti Networks",
    status: 'alive',
    latency: Math.floor(Math.random() * 3 + 1),
    os: "Cisco Router",
    type: 'router',
    ports: [
      { port: 22, service: "SSH", status: "open" },
      { port: 80, service: "HTTP", status: "open" },
      { port: 443, service: "HTTPS", status: "open" },
      { port: 161, service: "SNMP", status: "filtered" }
    ]
  });

  // Always place a firewall or switch at .2
  hosts.push({
    id: `host-2`,
    ip: `${baseOctets}.2`,
    hostname: "core-switch.local",
    mac: `00:00:0C:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
    vendor: "Cisco Systems",
    status: 'alive',
    latency: Math.floor(Math.random() * 4 + 2),
    os: "Cisco IOS",
    type: 'switch',
    ports: [
      { port: 22, service: "SSH", status: "open" },
      { port: 23, service: "Telnet", status: "closed" }
    ]
  });

  // Create additional simulated hosts
  const hostCount = Math.floor(Math.random() * 8) + 5; // 5 to 12 additional active hosts
  const usedIPs = new Set<number>([1, 2]);

  for (let i = 0; i < hostCount; i++) {
    let lastOctet = Math.floor(Math.random() * 252) + 3;
    while (usedIPs.has(lastOctet)) {
      lastOctet = Math.floor(Math.random() * 252) + 3;
    }
    usedIPs.add(lastOctet);

    const typeConfig = HOST_TYPES[Math.floor(Math.random() * HOST_TYPES.length)];
    const vendorConfig = MAC_VENDORS[Math.floor(Math.random() * MAC_VENDORS.length)];
    
    const mac = `${vendorConfig.prefix}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
    const hostname = `${typeConfig.type}-${lastOctet}.local`;

    // Scan types determine open ports
    const ports = typeConfig.ports.map(port => {
      const isFiltered = Math.random() > 0.85;
      const isOpen = Math.random() > 0.25;
      return {
        port,
        service: PORT_SERVICES[port] || "Unknown",
        status: isOpen ? "open" : (isFiltered ? "filtered" : "closed")
      };
    });

    hosts.push({
      id: `host-${lastOctet}`,
      ip: `${baseOctets}.${lastOctet}`,
      hostname,
      mac,
      vendor: vendorConfig.name,
      status: 'alive',
      latency: Math.floor(Math.random() * 85) + 5,
      os: typeConfig.os,
      type: typeConfig.type,
      ports
    });
  }

  // Sort by final octet
  return hosts.sort((a, b) => {
    const octetA = parseInt(a.ip.split('.').pop() || '0');
    const octetB = parseInt(b.ip.split('.').pop() || '0');
    return octetA - octetB;
  });
}

// Generate realistic hop trace routes based on routing modes
app.post("/api/traceroute", (req, res) => {
  const { routingMode, vpnCountry, target } = req.body;
  const hops: any[] = [];

  // Always starts at user local gateway
  hops.push({
    name: "Local Gateway",
    ip: "192.168.1.1",
    country: "Local Network",
    latency: 2,
    type: "user"
  });

  if (routingMode === "TOR") {
    hops.push({
      name: "Tor Entry Guard [tor-guard.or.de]",
      ip: "185.220.101.44",
      country: "Germany",
      latency: 45,
      type: "relay"
    });
    hops.push({
      name: "Tor Middle Relay [tor-middle.se]",
      ip: "95.143.193.30",
      country: "Sweden",
      latency: 110,
      type: "relay"
    });
    hops.push({
      name: "Tor Exit Node [tor-exit.is]",
      ip: "185.112.146.22",
      country: "Iceland",
      latency: 185,
      type: "exit"
    });
  } else if (routingMode === "VPN") {
    const country = vpnCountry || "Switzerland";
    const vpnIp = country === "Switzerland" ? "109.202.107.13" : 
                  country === "United States" ? "156.146.59.82" :
                  country === "Iceland" ? "185.112.146.5" : "194.242.110.15";
    hops.push({
      name: `ProtonVPN ${country} Server [secure-tunnel.protonvpn.net]`,
      ip: vpnIp,
      country: country,
      latency: 55,
      type: "vpn"
    });
  } else if (routingMode === "I2P") {
    hops.push({
      name: "I2P Local Router (Inbound Gateway)",
      ip: "127.0.0.1:2827",
      country: "Encrypted Tunnel",
      latency: 10,
      type: "relay"
    });
    hops.push({
      name: "I2P Inbound Tunnel Participant [i2p-node-us.i2p]",
      ip: "104.244.72.10",
      country: "United States",
      latency: 130,
      type: "relay"
    });
    hops.push({
      name: "I2P Outbound Tunnel Participant [i2p-node-fr.i2p]",
      ip: "51.15.11.23",
      country: "France",
      latency: 260,
      type: "exit"
    });
  } else {
    // Direct routing
    hops.push({
      name: "ISP Backbone Hop",
      ip: "74.125.242.12",
      country: "United Kingdom",
      latency: 14,
      type: "relay"
    });
  }

  // Final destination
  hops.push({
    name: target || "Target Subnet Host",
    ip: target || "192.168.1.100",
    country: "Target Network",
    latency: routingMode === "TOR" ? 220 : routingMode === "I2P" ? 310 : routingMode === "VPN" ? 65 : 20,
    type: "target"
  });

  res.json({ hops });
});

// Trigger host subnet scan
app.post("/api/scan", (req, res) => {
  const { subnet, scanType, routingMode, vpnCountry } = req.body;
  const hosts = generateSubnetHosts(subnet || "192.168.1.0/24");
  res.json({ hosts });
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
