export type ScanType = 'PING' | 'SYN' | 'CONNECT' | 'UDP';

export type RoutingMode = 'DIRECT' | 'TOR' | 'VPN' | 'I2P';

export interface ScanConfig {
  subnet: string;
  scanType: ScanType;
  routingMode: RoutingMode;
  vpnCountry: string;
  scanSpeed: number; // ms delay per host
  portPreset: 'all' | 'web' | 'database' | 'iot' | 'custom';
  customPorts: string;
}

export interface PortInfo {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
}

export interface NetworkHost {
  id: string;
  ip: string;
  hostname: string;
  mac: string;
  vendor: string;
  status: 'alive' | 'dead';
  latency: number; // ms
  os: 'Linux' | 'Windows Server' | 'macOS' | 'iOS' | 'Android' | 'Cisco Router' | 'Embedded IoT';
  ports: PortInfo[];
  type: 'router' | 'switch' | 'server' | 'workstation' | 'iot' | 'printer' | 'firewall';
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface Hop {
  name: string;
  ip: string;
  country: string;
  latency: number;
  type: 'user' | 'relay' | 'exit' | 'vpn' | 'target';
}
