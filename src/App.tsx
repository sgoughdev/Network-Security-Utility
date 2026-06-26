import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Shield, 
  Settings, 
  FileSpreadsheet, 
  Download, 
  Network, 
  Terminal, 
  Server, 
  Search, 
  RefreshCw, 
  Wifi, 
  MapPin, 
  Compass, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Globe, 
  Monitor, 
  Layers, 
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScanType, 
  RoutingMode, 
  ScanConfig, 
  NetworkHost, 
  LogEntry, 
  Hop, 
  PortInfo 
} from './types';

// Default subnets list
const SUBNET_PRESETS = [
  { value: '192.168.1.0/24', label: 'Local Home Subnet (192.168.1.x)' },
  { value: '10.0.0.0/24', label: 'Enterprise Core (10.0.0.x)' },
  { value: '172.16.0.0/24', label: 'Dev & Staging (172.16.0.x)' },
  { value: '8.8.8.0/24', label: 'Public DNS Range (8.8.8.x)' }
];

// Predefined VPN Country Servers
const VPN_COUNTRIES = [
  { code: 'CH', name: 'Switzerland' },
  { code: 'US', name: 'United States' },
  { code: 'IS', name: 'Iceland' },
  { code: 'JP', name: 'Japan' }
];

export default function App() {
  // Config state
  const [config, setConfig] = useState<ScanConfig>({
    subnet: '192.168.1.0/24',
    scanType: 'PING',
    routingMode: 'DIRECT',
    vpnCountry: 'Switzerland',
    scanSpeed: 10,
    portPreset: 'web',
    customPorts: '80, 443, 8080'
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'map' | 'sheet' | 'routing' | 'logs'>('map');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hosts, setHosts] = useState<NetworkHost[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hops, setHops] = useState<Hop[]>([]);
  const [selectedHost, setSelectedHost] = useState<NetworkHost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alive' | 'dead'>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  
  // Custom interactive terminal prompt
  const [terminalCommand, setTerminalCommand] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Network Security Terminal v1.4.2 initialized.',
    'Ready for stealth diagnostic queries. Try: "help", "scan -t syn", "traceroute 8.8.8.8"'
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, terminalHistory]);

  // Handle Scan triggers
  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp: time, level, message }]);
  };

  // Perform full subnet scan simulation
  const startNetworkScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setHosts([]);
    setSelectedHost(null);
    setLogs([]);

    addLog(`Initiating global network survey of subnet ${config.subnet}...`, 'info');
    addLog(`Method Selected: ${config.scanType} (${getScanTypeExplanation(config.scanType)})`, 'info');
    addLog(`Tunneling Layer: ${config.routingMode} ${config.routingMode === 'VPN' ? `(${config.vpnCountry} Endpoint)` : ''}`, 'warning');

    // Fetch traceroute hops
    try {
      const traceRes = await fetch('/api/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routingMode: config.routingMode,
          vpnCountry: config.vpnCountry,
          target: config.subnet.replace('.0/24', '.1')
        })
      });
      const traceData = await traceRes.json();
      setHops(traceData.hops);
      addLog(`Secure proxy tunnel established. Latency overhead: ${traceData.hops[traceData.hops.length - 1].latency}ms.`, 'success');
    } catch (e) {
      addLog(`Failed to fetch secure routing context. Defaulting to virtual direct mode.`, 'warning');
      // Fallback local hops
      setHops([
        { name: 'Local Gateway', ip: '192.168.1.1', country: 'Local Network', latency: 1, type: 'user' },
        { name: 'Target Subnet Host', ip: config.subnet.replace('.0/24', '.1'), country: 'Target Network', latency: 15, type: 'target' }
      ]);
    }

    // Begin Simulated scan phases
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      
      const step = progress / 10;
      switch (step) {
        case 1:
          addLog("Broadcasting Address Resolution Protocol (ARP) discover frames...", "info");
          break;
        case 3:
          addLog("Mapping MAC address vendors to network hardware database...", "info");
          break;
        case 5:
          addLog("Sending specialized socket probes to evaluate active ports...", "info");
          break;
        case 7:
          addLog("Analyzing packet TCP/IP flag signatures to determine remote OS...", "info");
          break;
        case 9:
          addLog("Compiling response frames & computing route path integrity...", "info");
          break;
      }

      if (progress >= 100) {
        clearInterval(interval);
        finalizeScan();
      }
    }, 280);
  };

  const finalizeScan = async () => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setHosts(data.hosts);
      setIsScanning(false);
      setScanProgress(100);
      addLog(`Scan completed successfully! Discovered ${data.hosts.length} active node instances.`, 'success');
      
      // Auto select the first host for detailed view if any
      if (data.hosts.length > 0) {
        setSelectedHost(data.hosts[0]);
      }
    } catch (err) {
      addLog(`Error contacting scanning agent server. Falling back to local offline map.`, 'error');
      setIsScanning(false);
    }
  };

  const getScanTypeExplanation = (type: ScanType) => {
    switch (type) {
      case 'PING': return 'ICMP echo requests with low-footprint latency feedback';
      case 'SYN': return 'Half-open TCP handshake scan for stealth port inspection';
      case 'CONNECT': return 'Full three-way TCP handshake matching local system routing';
      case 'UDP': return 'ICMP port-unreachable probe frames for UDP validation';
    }
  };

  // Helper function to export scan results to a standard CSV sheet
  const downloadCSV = () => {
    if (hosts.length === 0) {
      alert("No network scan data available to export. Run a scan first!");
      return;
    }

    // Define CSV columns
    const headers = ["IP Address", "Hostname", "Status", "Latency (ms)", "Hardware Vendor", "MAC Address", "Operating System", "Category", "Open Ports"];
    const rows = hosts.map(host => [
      host.ip,
      host.hostname,
      host.status,
      host.latency,
      host.vendor,
      host.mac,
      host.os,
      host.type,
      host.ports.filter(p => p.status === 'open').map(p => `${p.port}/${p.service}`).join(' | ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `network_scan_${config.subnet.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Successfully downloaded spreadsheet report: CSV Format", "success");
  };

  // Export visual map coordinates/JSON
  const downloadJSON = () => {
    if (hosts.length === 0) {
      alert("No network scan data available to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      scanConfiguration: config,
      scanTimestamp: new Date().toISOString(),
      discoveredNodes: hosts,
      routingPath: hops
    }, null, 2));
    
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `network_topology_${config.subnet.replace('/', '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Successfully downloaded technical topology: JSON Format", "success");
  };

  // Custom CLI simulator handler
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCommand.trim()) return;

    const cmd = terminalCommand.toLowerCase().trim();
    setTerminalHistory(prev => [...prev, `$ ${terminalCommand}`]);
    setTerminalCommand('');

    setTimeout(() => {
      if (cmd === 'help') {
        setTerminalHistory(prev => [
          ...prev,
          'Available Commands:',
          '  scan -t [ping|syn|connect]   Trigger network subnet discovery',
          '  traceroute [target]         Simulate hop-route diagnostic details',
          '  tor                         Switch routing mode to Tor relay circuit',
          '  vpn [country]               Change ProtonVPN endpoint tunnel country',
          '  clear                       Reset diagnostic terminal log history',
          '  hosts                       Print a brief tabular list of active hosts'
        ]);
      } else if (cmd.startsWith('scan')) {
        setTerminalHistory(prev => [...prev, 'Executing automated scan sequence...']);
        startNetworkScan();
      } else if (cmd === 'clear') {
        setTerminalHistory([]);
      } else if (cmd === 'tor') {
        setConfig(prev => ({ ...prev, routingMode: 'TOR' }));
        setTerminalHistory(prev => [...prev, 'Routing updated to: TOR Onion Relay Networks.']);
      } else if (cmd.startsWith('vpn')) {
        const country = cmd.split(' ')[1] || 'Switzerland';
        setConfig(prev => ({ ...prev, routingMode: 'VPN', vpnCountry: country }));
        setTerminalHistory(prev => [...prev, `Routing updated to: ProtonVPN Secure Core [${country}].`]);
      } else if (cmd === 'hosts') {
        if (hosts.length === 0) {
          setTerminalHistory(prev => [...prev, 'No hosts currently mapped. Run "scan" command first.']);
        } else {
          const list = hosts.map(h => `  • ${h.ip} - ${h.hostname} [${h.vendor}] (LATENCY: ${h.latency}ms)`).join('\n');
          setTerminalHistory(prev => [...prev, 'Active Network Nodes:\n' + list]);
        }
      } else if (cmd.startsWith('traceroute')) {
        const target = cmd.split(' ')[1] || '192.168.1.1';
        setTerminalHistory(prev => [...prev, `Tracing network path to target ${target}...`]);
        setActiveTab('routing');
      } else {
        setTerminalHistory(prev => [...prev, `Command not recognized: "${cmd}". Type "help" for support.`]);
      }
    }, 100);
  };

  // Filter hosts based on user query and dropdowns
  const filteredHosts = useMemo(() => {
    return hosts.filter(host => {
      const matchesSearch = 
        host.ip.includes(searchQuery) || 
        host.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        host.os.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'alive' && host.status === 'alive') ||
        (statusFilter === 'dead' && host.status === 'dead');

      const matchesType = 
        deviceTypeFilter === 'all' || 
        host.type === deviceTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [hosts, searchQuery, statusFilter, deviceTypeFilter]);

  // Host Type styling config helper
  const getHostIcon = (type: string) => {
    switch (type) {
      case 'router': return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'switch': return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'server': return <Server className="w-5 h-5 text-emerald-400" />;
      case 'iot': return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'printer': return <FileText className="w-5 h-5 text-orange-400" />;
      default: return <Monitor className="w-5 h-5 text-slate-400" />;
    }
  };

  // Pre-fill a fast scan config on load
  useEffect(() => {
    startNetworkScan();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-[#0F1524]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-900/10">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">NetSentry Security Utility</h1>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold border border-emerald-500/20">
                STABLE
              </span>
            </div>
            <p className="text-xs text-slate-400">ICMP SYN, TCP & Routing Analysis Dashboard</p>
          </div>
        </div>

        {/* Global Action Status */}
        <div className="flex items-center gap-4">
          {/* Quick Routing Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="relative">
              <Shield className={`w-4 h-4 ${config.routingMode !== 'DIRECT' ? 'text-emerald-400' : 'text-amber-400'}`} />
              {config.routingMode !== 'DIRECT' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </div>
            <div className="text-left">
              <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Active Conduit</p>
              <p className="text-xs font-mono font-medium text-slate-300">
                {config.routingMode === 'DIRECT' && 'Direct ISP (Cleartext)'}
                {config.routingMode === 'TOR' && 'Tor Onion Relay Network'}
                {config.routingMode === 'VPN' && `ProtonVPN (${config.vpnCountry})`}
                {config.routingMode === 'I2P' && 'I2P Darknet Tunnel'}
              </p>
            </div>
          </div>

          <button
            onClick={startNetworkScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md duration-200 ${
              isScanning 
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-indigo-900/20 hover:scale-[1.02]'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mapping Subnet...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Network Scan</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Left Side: Scan & Anonymization Configurations */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Target Setup */}
          <div className="bg-[#0F1524] rounded-2xl border border-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Scan Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Target IP Subnet Range</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.subnet}
                    onChange={(e) => setConfig({ ...config, subnet: e.target.value })}
                    className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. 192.168.1.0/24"
                  />
                </div>
                
                {/* Preset Subnets */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {SUBNET_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setConfig({ ...config, subnet: preset.value })}
                      className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-all ${
                        config.subnet === preset.value
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                      title={preset.label}
                    >
                      {preset.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan Methodology Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Scan Discovery Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PING', 'SYN', 'CONNECT', 'UDP'] as ScanType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setConfig({ ...config, scanType: type })}
                      className={`py-2 px-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                        config.scanType === type
                          ? 'bg-indigo-600/10 text-white border-indigo-500 shadow-md shadow-indigo-900/5'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold tracking-wide">{type}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                        {type === 'PING' && 'ICMP Echo Probe'}
                        {type === 'SYN' && 'Stealth Stealth Half-Open'}
                        {type === 'CONNECT' && 'TCP Full Connect'}
                        {type === 'UDP' && 'UDP Port Probing'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Port Ranges Configurations */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Port Preset Range</label>
                <select
                  value={config.portPreset}
                  onChange={(e) => setConfig({ ...config, portPreset: e.target.value as any })}
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Full Scan (Top 100 Common Ports)</option>
                  <option value="web">Web Services (80, 443, 8080, 8443)</option>
                  <option value="database">Database Engines (3306, 5432, 1433, 27017)</option>
                  <option value="iot">IoT Protocols (1883, 554, 8081)</option>
                  <option value="custom">Custom Specified Ports</option>
                </select>

                {config.portPreset === 'custom' && (
                  <input
                    type="text"
                    value={config.customPorts}
                    onChange={(e) => setConfig({ ...config, customPorts: e.target.value })}
                    className="mt-2 w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 21, 22, 23, 25, 443"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Secure Routing and Proxies Config */}
          <div className="bg-[#0F1524] rounded-2xl border border-slate-800 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Conduit Tunnel Options
              </h2>
              <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/10 font-mono font-medium">
                SECURE
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Route network requests via decentralized networks, ProtonVPN servers, or I2P relays to anonymize source address headers.
            </p>

            <div className="space-y-4">
              {/* Routing Mode Picker */}
              <div className="space-y-2">
                {[
                  { mode: 'DIRECT', title: 'Direct Routing (Default)', desc: 'Cleartext request packets broadcasted from local ISP address' },
                  { mode: 'TOR', title: 'Tor Decentralized Protocol', desc: 'Tunnel data through 3 nested onion-encrypted circuits' },
                  { mode: 'VPN', title: 'ProtonVPN Secure Core', desc: 'Encrypted tunnel with virtual commercial exit nodes' },
                  { mode: 'I2P', title: 'I2P Garli-Routed Tunnel', desc: 'Decentralized peer-to-peer metadata obfuscation' }
                ].map((item) => (
                  <label
                    key={item.mode}
                    onClick={() => setConfig({ ...config, routingMode: item.mode as RoutingMode })}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      config.routingMode === item.mode
                        ? 'bg-indigo-600/5 border-indigo-500/60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="routing_mode"
                      checked={config.routingMode === item.mode}
                      onChange={() => {}} // handled by onClick
                      className="mt-1 accent-indigo-500 focus:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{item.title}</span>
                        {item.mode !== 'DIRECT' && (
                          <Lock className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* VPN Location selector */}
              {config.routingMode === 'VPN' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-800"
                >
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">VPN Exit Gateway Location</label>
                  <select
                    value={config.vpnCountry}
                    onChange={(e) => setConfig({ ...config, vpnCountry: e.target.value })}
                    className="w-full bg-[#182032] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {VPN_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Tabbed Map/Sheet View and Diagnostic Logs */}
        <section className="xl:col-span-3 flex flex-col gap-6">

          {/* Active Scan Indicator Progress */}
          {isScanning && (
            <div className="bg-[#0F1524] rounded-2xl border border-indigo-500/20 p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="text-xs font-mono font-semibold text-indigo-300">Evaluating hosts within {config.subnet} range...</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Tab Selection */}
          <div className="bg-[#0F1524] p-2 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div className="flex gap-1.5">
              {[
                { id: 'map', label: 'Network topology Map', icon: <Network className="w-4 h-4" /> },
                { id: 'sheet', label: 'Tabular Spreadsheet', icon: <FileSpreadsheet className="w-4 h-4" /> },
                { id: 'routing', label: 'Onion / Tunnel Routing Path', icon: <Compass className="w-4 h-4" /> },
                { id: 'logs', label: 'Active Terminal Console', icon: <Terminal className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-900/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Download CSV file containing mapped hosts for Excel / Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV Sheet</span>
              </button>
              <button
                onClick={downloadJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Export detailed topology node blueprint in JSON format"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Topology JSON</span>
              </button>
            </div>
          </div>

          {/* Interactive Container Panel */}
          <div className="bg-[#0F1524] rounded-2xl border border-slate-800 min-h-[500px] flex flex-col overflow-hidden relative shadow-md">
            
            <AnimatePresence mode="wait">
              
              {/* TAB 1: RADIAL TOPOLOGY NETWORK MAP */}
              {activeTab === 'map' && (
                <motion.div
                  key="map-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800"
                >
                  {/* Left part: Interactive Topology Canvas Visualization */}
                  <div className="lg:col-span-2 p-6 flex flex-col relative min-h-[350px]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Visual Node Structure</h3>
                        <p className="text-[11px] text-slate-400">Click individual hardware nodes to interrogate open sockets</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Router</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Switch</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Server</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Workstation / IoT</span>
                      </div>
                    </div>

                    {hosts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                        <Network className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                        <p className="text-sm">No active subnet mapped in temporary cache memory.</p>
                        <p className="text-xs text-slate-600 mt-1">Initiate a Scan above to evaluate active hosts in {config.subnet}.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Topology Radial Layout Container */}
                        <div className="relative flex-1 flex items-center justify-center py-6 min-h-[300px]">
                          {/* Central Switch Switch Node */}
                          <div className="absolute z-10 flex flex-col items-center">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => {
                                const sw = hosts.find(h => h.type === 'switch');
                                if (sw) setSelectedHost(sw);
                              }}
                              className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-400/80 flex items-center justify-center shadow-lg shadow-cyan-900/10 hover:shadow-cyan-400/20 transition-all duration-200"
                            >
                              <Layers className="w-7 h-7 text-cyan-400" />
                            </motion.button>
                            <span className="text-[9px] font-mono mt-1 text-slate-400 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded-md">
                              Core Switch
                            </span>
                          </div>

                          {/* Outer Network Hosts (Distributed) */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {hosts.filter(h => h.type !== 'switch').map((host, idx, arr) => {
                              // Distribute points in a circle
                              const total = arr.length;
                              const angle = (idx / total) * 2 * Math.PI;
                              const radius = 130; // Radius pixels
                              const x = Math.cos(angle) * radius;
                              const y = Math.sin(angle) * radius;

                              const isSelected = selectedHost?.id === host.id;

                              return (
                                <div
                                  key={host.id}
                                  className="absolute transition-transform duration-300"
                                  style={{ transform: `translate(${x}px, ${y}px)` }}
                                >
                                  {/* Line connector to core switch */}
                                  <svg className="absolute top-1/2 left-1/2 w-[200px] h-[200px] pointer-events-none -translate-x-1/2 -translate-y-1/2 overflow-visible">
                                    <line
                                      x1="0"
                                      y1="0"
                                      x2={-x}
                                      y2={-y}
                                      stroke={isSelected ? '#6366f1' : '#1e293b'}
                                      strokeWidth={isSelected ? '2' : '1'}
                                      strokeDasharray={isSelected ? '0' : '4 3'}
                                      className="transition-all duration-300"
                                    />
                                  </svg>

                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    onClick={() => setSelectedHost(host)}
                                    className={`relative z-20 w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-indigo-950 scale-110'
                                        : host.type === 'router'
                                          ? 'bg-slate-900 text-indigo-400 border border-indigo-500/40'
                                          : host.type === 'server'
                                            ? 'bg-slate-900 text-emerald-400 border border-emerald-500/40'
                                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-indigo-400'
                                    }`}
                                  >
                                    {getHostIcon(host.type)}
                                    {/* Small Ping badge indicator */}
                                    <span className="absolute -bottom-1 -right-1 text-[8px] px-1 font-mono bg-[#1E293B] border border-slate-700 text-slate-300 rounded">
                                      {host.latency}ms
                                    </span>
                                  </motion.button>

                                  <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none whitespace-nowrap bg-[#0B0F19]/90 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-300">
                                    {host.ip.split('.').pop()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Visual statistics overview bar */}
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex justify-between text-xs font-mono">
                          <div className="flex gap-4">
                            <div><span className="text-slate-500">Hosts Found:</span> <span className="text-indigo-400 font-bold">{hosts.length}</span></div>
                            <div><span className="text-slate-500">Gateway:</span> <span className="text-slate-300 font-bold">{hosts.find(h => h.type === 'router')?.ip || 'Unknown'}</span></div>
                          </div>
                          <div>
                            <span className="text-slate-500">Encryption Circuit Layer:</span> <span className="text-emerald-400">{config.routingMode}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right part: Selected Host Details, Ports and Hardware Signatures */}
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Node Inspection</h3>
                        <span className="text-[10px] text-slate-500 font-mono">Detailed Interrogation</span>
                      </div>

                      {selectedHost ? (
                        <div className="space-y-4">
                          {/* Host Title info */}
                          <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                              {getHostIcon(selectedHost.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white font-mono">{selectedHost.ip}</h4>
                                <span className={`w-2 h-2 rounded-full ${selectedHost.status === 'alive' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              </div>
                              <p className="text-xs text-slate-400 truncate">{selectedHost.hostname}</p>
                            </div>
                          </div>

                          {/* Technical Hardware Table */}
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-500 font-medium">Manufacturer Vendor</span>
                              <span className="text-slate-200 font-mono font-semibold">{selectedHost.vendor}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-500 font-medium">MAC Hardware ID</span>
                              <span className="text-slate-200 font-mono">{selectedHost.mac}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-500 font-medium">Target Operating System</span>
                              <span className="text-slate-200 font-mono font-semibold text-cyan-400">{selectedHost.os}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800">
                              <span className="text-slate-500 font-medium">Last Ping Latency</span>
                              <span className="text-slate-200 font-mono font-bold text-indigo-400">{selectedHost.latency} ms</span>
                            </div>
                          </div>

                          {/* Port Matrix Evaluation */}
                          <div className="mt-5">
                            <h5 className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wide">TCP Sockets & Services ({selectedHost.ports.length})</h5>
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                              {selectedHost.ports.map((p) => (
                                <div key={p.port} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400 font-semibold w-10">:{p.port}</span>
                                    <span className="font-mono text-slate-300 font-medium px-1.5 py-0.5 rounded bg-[#182032]">{p.service}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                    p.status === 'open' 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                      : p.status === 'filtered'
                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                        : 'bg-slate-800/80 text-slate-500 border border-slate-800'
                                  }`}>
                                    {p.status.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Info className="w-10 h-10 text-slate-700 mx-auto mb-2.5" />
                          <p className="text-xs">No active node currently selected for deeper investigation.</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed bg-slate-950 p-3 rounded-xl">
                      💡 <strong>Note:</strong> SYN scanning is passive and relies on monitoring TCP segment flags (RST vs SYN-ACK) to bypass connection limits.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: DETAILED SPREADSHEET VIEW */}
              {activeTab === 'sheet' && (
                <motion.div
                  key="sheet-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 p-6 flex flex-col"
                >
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Tabular Network Directory</h3>
                      <p className="text-[11px] text-slate-400">Searchable dataset containing deep Operating System fingerprints and MAC vendor indexes</p>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                      <div className="relative flex-1 md:flex-initial">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search IP, vendor, OS..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-1.5 w-full md:w-56 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <select
                        value={deviceTypeFilter}
                        onChange={(e) => setDeviceTypeFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Device Classes</option>
                        <option value="router">Routers Only</option>
                        <option value="switch">Switches Only</option>
                        <option value="server">Servers Only</option>
                        <option value="workstation">Workstations</option>
                        <option value="iot">Embedded IoT</option>
                      </select>
                    </div>
                  </div>

                  {hosts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-500">
                      <FileSpreadsheet className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-sm">No tabular metrics collected.</p>
                      <button 
                        onClick={startNetworkScan}
                        className="mt-4 text-xs font-semibold text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
                      >
                        Trigger Diagnostic Scan Now
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                            <th className="p-3.5 font-semibold">IP Address</th>
                            <th className="p-3.5 font-semibold">Hostname</th>
                            <th className="p-3.5 font-semibold">Hardware Vendor</th>
                            <th className="p-3.5 font-semibold">MAC Address</th>
                            <th className="p-3.5 font-semibold">Operating System</th>
                            <th className="p-3.5 font-semibold">Latency</th>
                            <th className="p-3.5 font-semibold text-center">Open Ports</th>
                            <th className="p-3.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredHosts.map((host) => {
                            const openPorts = host.ports.filter(p => p.status === 'open');
                            return (
                              <tr key={host.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="p-3.5 font-mono text-white font-semibold">{host.ip}</td>
                                <td className="p-3.5 text-slate-300 truncate max-w-[150px]">{host.hostname}</td>
                                <td className="p-3.5 text-slate-400 font-medium">{host.vendor}</td>
                                <td className="p-3.5 font-mono text-slate-500">{host.mac}</td>
                                <td className="p-3.5 font-mono text-cyan-400 font-medium">{host.os}</td>
                                <td className="p-3.5 font-mono text-indigo-400 font-semibold">{host.latency}ms</td>
                                <td className="p-3.5 text-center">
                                  <div className="flex flex-wrap justify-center gap-1">
                                    {openPorts.length === 0 ? (
                                      <span className="text-[10px] text-slate-600 font-mono">none</span>
                                    ) : (
                                      openPorts.map(p => (
                                        <span key={p.port} className="text-[9px] font-mono font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                                          :{p.port}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedHost(host);
                                      setActiveTab('map');
                                    }}
                                    className="p-1.5 hover:bg-indigo-600/10 hover:text-indigo-400 rounded-lg text-slate-400 transition-colors"
                                    title="View Visual Node Map"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: SECURE ROUTING TRACEROUTE PATH */}
              {activeTab === 'routing' && (
                <motion.div
                  key="routing-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Anonymized Route Integrity Graph</h3>
                        <p className="text-[11px] text-slate-400">Verifies data encryption and relays currently obscuring local hardware headers</p>
                      </div>
                      <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-3 py-1 rounded-xl border border-indigo-500/20 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Routing: <strong className="text-white uppercase">{config.routingMode}</strong>
                      </span>
                    </div>

                    {hops.length === 0 ? (
                      <div className="text-center py-24 text-slate-500">
                        <Compass className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                        <p className="text-sm">Secure routing network mapping pending.</p>
                        <p className="text-xs text-slate-600 mt-1">Start a scan to observe active encryption circuit hops.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Hops timeline chart */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                          {hops.map((hop, idx) => (
                            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative shadow-sm min-h-[120px]">
                              
                              {/* Connector arrow on desktops */}
                              {idx < hops.length - 1 && (
                                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                  <ChevronRight className="w-6 h-6 text-indigo-500 animate-pulse" />
                                </div>
                              )}

                              <div>
                                <div className="flex justify-between items-start mb-2.5">
                                  <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                                    HOP #{idx + 1}
                                  </span>
                                  {hop.type === 'user' ? (
                                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">SOURCE</span>
                                  ) : hop.type === 'exit' || hop.type === 'vpn' ? (
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">ANONYMOUS SHIELD</span>
                                  ) : hop.type === 'target' ? (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">TARGET</span>
                                  ) : (
                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">MIDDLE LAYER</span>
                                  )}
                                </div>

                                <h4 className="text-xs font-bold text-white truncate mb-1">{hop.name}</h4>
                                <p className="text-[10px] text-indigo-300 font-mono truncate">{hop.ip}</p>
                              </div>

                              <div className="mt-4 flex justify-between items-center text-[10px] border-t border-slate-800/80 pt-2 font-mono">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-slate-600" />
                                  {hop.country}
                                </span>
                                <span className="text-indigo-400 font-bold">{hop.latency}ms</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Summary Box */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 mt-6">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Conduit Analysis Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                              <span className="text-slate-500 block text-[10px]">Total Hop Latency</span>
                              <strong className="text-white text-sm">{hops[hops.length - 1]?.latency || 0} ms</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                              <span className="text-slate-500 block text-[10px]">Tunnel Cryptography</span>
                              <strong className="text-emerald-400 text-sm">
                                {config.routingMode === 'TOR' && 'Onion v3 256-bit AES'}
                                {config.routingMode === 'VPN' && 'ChaCha20-Poly1305 / OpenVPN'}
                                {config.routingMode === 'I2P' && 'ElGamal/AES + Garlic'}
                                {config.routingMode === 'DIRECT' && 'None (Exposed ISP Header)'}
                              </strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/50">
                              <span className="text-slate-500 block text-[10px]">Obfuscation Status</span>
                              <strong className={`text-sm ${config.routingMode !== 'DIRECT' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {config.routingMode !== 'DIRECT' ? 'HIGHLY SECURE' : 'UNSECURED'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 text-right mt-4 font-mono">
                    * Latency metrics calculated utilizing ICMP echo timestamp intervals.
                  </div>
                </motion.div>
              )}

              {/* TAB 4: ACTIVE TERMINAL CONSOLE / LOGS */}
              {activeTab === 'logs' && (
                <motion.div
                  key="logs-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 p-6 flex flex-col justify-between"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-xs font-mono font-bold text-slate-300">Live Network Inspection Session</h3>
                        </div>
                        <button
                          onClick={() => setTerminalHistory([])}
                          className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono"
                        >
                          Clear History
                        </button>
                      </div>

                      {/* Diagnostic Log Output screen */}
                      <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 font-mono text-[11px] h-[280px] overflow-y-auto space-y-2 select-text selection:bg-slate-800">
                        {terminalHistory.map((line, idx) => (
                          <div key={idx} className="whitespace-pre-wrap leading-relaxed text-slate-300">
                            {line}
                          </div>
                        ))}

                        {/* Display background server logs too */}
                        {logs.map((log, idx) => (
                          <div key={`srv-${idx}`} className="flex gap-2">
                            <span className="text-slate-600">[{log.timestamp}]</span>
                            <span className={`font-semibold ${
                              log.level === 'error' ? 'text-rose-400' : 
                              log.level === 'warning' ? 'text-amber-400' : 
                              log.level === 'success' ? 'text-emerald-400' : 'text-indigo-400'
                            }`}>
                              [{log.level.toUpperCase()}]
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    </div>

                    {/* Interactive CLI Form Prompt */}
                    <form onSubmit={handleTerminalSubmit} className="mt-4 flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-mono text-xs select-none">$</span>
                        <input
                          type="text"
                          value={terminalCommand}
                          onChange={(e) => setTerminalCommand(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600"
                          placeholder="Type 'help' to review syntax..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-mono text-xs transition-all"
                      >
                        Execute
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900/60 bg-[#070B13] px-6 py-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-mono gap-4">
        <div>
          <span>© 2026 NetSentry Labs. Strictly for educational and network diagnostic verification.</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-indigo-400" /> Engine Connected</span>
          <span>Latency: ~2ms</span>
        </div>
      </footer>

    </div>
  );
}
