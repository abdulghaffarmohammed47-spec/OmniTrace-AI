import { Transaction, TransactionGraph, GraphNode, GraphEdge } from './types';

// Seeded random number generator
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

const CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
];

const DEVICE_IDS = [
  'DEV-A01', 'DEV-A02', 'DEV-B01', 'DEV-B02', 'DEV-C01',
  'DEV-C02', 'DEV-D01', 'DEV-D02', 'DEV-E01', 'DEV-E02',
  'DEV-F01', 'DEV-G01', 'DEV-H01',
];

const IP_ADDRESSES = [
  '192.168.1.10', '192.168.1.20', '10.0.0.5', '10.0.0.15',
  '172.16.0.1', '172.16.0.2', '203.0.113.1', '203.0.113.2',
  '198.51.100.1', '198.51.100.2', '192.0.2.1', '192.0.2.2',
];

export function generateTransactions(seed: number = 42, count: number = 120): Transaction[] {
  const rng = new SeededRandom(seed);
  const transactions: Transaction[] = [];
  const baseTime = Date.now() - 86400000; // 24h ago
  const userIds = Array.from({ length: 20 }, (_, i) => `USR-${String(i + 1).padStart(3, '0')}`);

  // Generate normal transactions
  for (let i = 0; i < count * 0.65; i++) {
    const city = rng.pick(CITIES);
    transactions.push({
      id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
      userId: rng.pick(userIds),
      amount: Math.round(rng.nextFloat(5, 2000) * 100) / 100,
      deviceId: rng.pick(DEVICE_IDS),
      ipAddress: rng.pick(IP_ADDRESSES),
      lat: city.lat + rng.nextFloat(-0.5, 0.5),
      lng: city.lng + rng.nextFloat(-0.5, 0.5),
      city: city.name,
      timestamp: baseTime + rng.nextInt(0, 86400000),
      cardAge: rng.nextInt(6, 120),
      isFraud: false,
    });
  }

  // Velocity Spikes: 5 rapid-fire transactions from one user
  const velocityUser = 'USR-007';
  const velocityTime = baseTime + 43200000;
  for (let i = 0; i < 5; i++) {
    const city = rng.pick(CITIES);
    transactions.push({
      id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
      userId: velocityUser,
      amount: Math.round(rng.nextFloat(800, 5000) * 100) / 100,
      deviceId: 'DEV-A01',
      ipAddress: '203.0.113.1',
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      timestamp: velocityTime + i * 2000, // 2 seconds apart
      cardAge: 3,
      isFraud: true,
      fraudType: 'velocity_spike',
    });
  }

  // Impossible Travel: user in NY then London 2 min later
  const travelUser = 'USR-012';
  const travelTime = baseTime + 50000000;
  transactions.push({
    id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
    userId: travelUser,
    amount: 3200,
    deviceId: 'DEV-B01',
    ipAddress: '10.0.0.5',
    lat: 40.7128, lng: -74.006,
    city: 'New York',
    timestamp: travelTime,
    cardAge: 12,
    isFraud: true,
    fraudType: 'impossible_travel',
  });
  transactions.push({
    id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
    userId: travelUser,
    amount: 4500,
    deviceId: 'DEV-B02',
    ipAddress: '198.51.100.1',
    lat: 51.5074, lng: -0.1278,
    city: 'London',
    timestamp: travelTime + 120000, // 2 minutes later
    cardAge: 12,
    isFraud: true,
    fraudType: 'impossible_travel',
  });

  // Coordinated Fraud Ring: A->B->C->D->A cyclic transfers
  const ringUsers = ['USR-015', 'USR-016', 'USR-017', 'USR-018'];
  const sharedIP = '192.0.2.1';
  const sharedDevice = 'DEV-F01';
  const ringTime = baseTime + 60000000;
  for (let i = 0; i < ringUsers.length; i++) {
    const city = rng.pick(CITIES);
    transactions.push({
      id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
      userId: ringUsers[i],
      amount: Math.round(rng.nextFloat(5000, 15000) * 100) / 100,
      deviceId: sharedDevice,
      ipAddress: sharedIP,
      lat: city.lat, lng: city.lng,
      city: city.name,
      timestamp: ringTime + i * 30000,
      cardAge: 2,
      isFraud: true,
      fraudType: 'fraud_ring',
    });
  }

  // Add more fraud patterns
  // Large midnight transaction
  const midnightUser = 'USR-003';
  transactions.push({
    id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
    userId: midnightUser,
    amount: 14500,
    deviceId: 'DEV-G01',
    ipAddress: '172.16.0.2',
    lat: 25.2048, lng: 55.2708,
    city: 'Dubai',
    timestamp: new Date().setHours(2, 30, 0, 0),
    cardAge: 1,
    isFraud: true,
    fraudType: 'high_value_midnight',
  });

  // Additional suspicious transactions
  for (let i = 0; i < count * 0.1; i++) {
    const city = rng.pick(CITIES);
    transactions.push({
      id: `TXN-${String(transactions.length + 1).padStart(4, '0')}`,
      userId: rng.pick(userIds),
      amount: Math.round(rng.nextFloat(5000, 25000) * 100) / 100,
      deviceId: rng.pick(DEVICE_IDS),
      ipAddress: rng.pick(IP_ADDRESSES),
      lat: city.lat + rng.nextFloat(-0.5, 0.5),
      lng: city.lng + rng.nextFloat(-0.5, 0.5),
      city: city.name,
      timestamp: baseTime + rng.nextInt(0, 86400000),
      cardAge: rng.nextInt(0, 3),
      isFraud: rng.next() > 0.5,
      fraudType: rng.next() > 0.5 ? 'suspicious_amount' : undefined,
    });
  }

  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}

export function buildTransactionGraph(transactions: Transaction[]): TransactionGraph {
  const nodesMap = new Map<string, GraphNode>();
  const edgesArr: GraphEdge[] = [];
  const adjacency = new Map<string, { node: string; weight: number }[]>();
  const rng = new SeededRandom(123);

  // Create account nodes
  const userIds = [...new Set(transactions.map(t => t.userId))];
  const ipAddrs = [...new Set(transactions.map(t => t.ipAddress))];
  const deviceIds = [...new Set(transactions.map(t => t.deviceId))];

  // Position nodes in a circle-based layout
  const totalNodes = userIds.length + ipAddrs.length + deviceIds.length;
  let idx = 0;

  userIds.forEach(uid => {
    const userTxns = transactions.filter(t => t.userId === uid);
    const isFraud = userTxns.some(t => t.isFraud);
    const angle = (idx / totalNodes) * 2 * Math.PI;
    const radius = 200 + rng.nextFloat(-30, 30);
    nodesMap.set(uid, {
      id: uid,
      type: 'account',
      label: uid,
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
      isFraud,
      riskScore: isFraud ? rng.nextFloat(0.6, 1.0) : rng.nextFloat(0, 0.3),
    });
    idx++;
  });

  ipAddrs.forEach(ip => {
    const ipTxns = transactions.filter(t => t.ipAddress === ip);
    const isFraud = ipTxns.some(t => t.isFraud);
    const angle = (idx / totalNodes) * 2 * Math.PI;
    const radius = 130 + rng.nextFloat(-20, 20);
    nodesMap.set(ip, {
      id: ip,
      type: 'ip',
      label: ip,
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
      isFraud,
      riskScore: isFraud ? rng.nextFloat(0.5, 0.9) : rng.nextFloat(0, 0.2),
    });
    idx++;
  });

  deviceIds.forEach(did => {
    const devTxns = transactions.filter(t => t.deviceId === did);
    const isFraud = devTxns.some(t => t.isFraud);
    const angle = (idx / totalNodes) * 2 * Math.PI;
    const radius = 80 + rng.nextFloat(-15, 15);
    nodesMap.set(did, {
      id: did,
      type: 'device',
      label: did,
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
      isFraud,
      riskScore: isFraud ? rng.nextFloat(0.4, 0.8) : rng.nextFloat(0, 0.15),
    });
    idx++;
  });

  // Create edges: account -> ip, account -> device, account -> account (sequential transfers)
  const edgeSet = new Set<string>();

  transactions.forEach(txn => {
    // User -> IP
    const eKey1 = `${txn.userId}|${txn.ipAddress}`;
    if (!edgeSet.has(eKey1)) {
      edgeSet.add(eKey1);
      const weight = Math.max(1, Math.round(txn.amount / 1000));
      edgesArr.push({
        source: txn.userId,
        target: txn.ipAddress,
        weight,
        amount: txn.amount,
        label: `$${txn.amount.toFixed(0)}`,
      });
    }
    // User -> Device
    const eKey2 = `${txn.userId}|${txn.deviceId}`;
    if (!edgeSet.has(eKey2)) {
      edgeSet.add(eKey2);
      const weight = Math.max(1, Math.round(txn.amount / 1500));
      edgesArr.push({
        source: txn.userId,
        target: txn.deviceId,
        weight,
        amount: txn.amount,
        label: `$${txn.amount.toFixed(0)}`,
      });
    }
  });

  // Create account-to-account edges for fraud ring
  const fraudRingUsers = transactions
    .filter(t => t.fraudType === 'fraud_ring')
    .map(t => t.userId);
  const uniqueRingUsers = [...new Set(fraudRingUsers)];
  for (let i = 0; i < uniqueRingUsers.length; i++) {
    const next = uniqueRingUsers[(i + 1) % uniqueRingUsers.length];
    const eKey = `${uniqueRingUsers[i]}|${next}`;
    if (!edgeSet.has(eKey)) {
      edgeSet.add(eKey);
      edgesArr.push({
        source: uniqueRingUsers[i],
        target: next,
        weight: 2,
        amount: rng.nextFloat(5000, 15000),
        label: 'Ring Transfer',
      });
    }
  }

  // Build adjacency list
  const nodes = Array.from(nodesMap.values());
  nodes.forEach(n => adjacency.set(n.id, []));

  edgesArr.forEach(e => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    if (!adjacency.has(e.target)) adjacency.set(e.target, []);
    adjacency.get(e.source)!.push({ node: e.target, weight: e.weight });
    adjacency.get(e.target)!.push({ node: e.source, weight: e.weight });
  });

  return { nodes, edges: edgesArr, adjacency };
}
