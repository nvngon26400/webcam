import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { SystemMetrics, AuditLog } from '../../types';
import {
  Activity,
  Server,
  Shield,
  Wifi,
  Users,
  HardDrive,
  Clock,
  Radio,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeMeetings: 4,
    concurrentParticipants: 18,
    activeSignalingSockets: 24,
    webrtcSuccessRate: 99.85,
    avgLatencyMs: 38.4,
    turnBandwidthMbps: 412.6,
    cpuUsagePercent: 18.2,
    memoryUsagePercent: 34.5,
    uptimeSeconds: 14280,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = async () => {
    try {
      setIsRefreshing(true);
      const [metricsRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/audit-logs'),
      ]);

      if (metricsRes.ok) {
        const json = await metricsRes.json();
        setMetrics(json.data);
      }
      if (logsRes.ok) {
        const json = await logsRes.json();
        setAuditLogs(json.data);
      }
    } catch (e) {
      console.warn('Admin fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider uppercase">
              <span>AuraMedia Operations</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cluster Healthy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {t.admin.title}
            </h1>
          </div>

          <button
            onClick={fetchAdminData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Active Meetings */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{t.admin.activeMeetings}</span>
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics.activeMeetings}
            </div>
            <div className="text-[10px] text-slate-500">Live SFU Rooms</div>
          </div>

          {/* Concurrent Peers */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{t.admin.concurrentUsers}</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics.concurrentParticipants}
            </div>
            <div className="text-[10px] text-slate-500">Subscribed streams</div>
          </div>

          {/* WebSocket Sockets */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Signaling Sockets</span>
              <Server className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics.activeSignalingSockets}
            </div>
            <div className="text-[10px] text-slate-500">WSS connections</div>
          </div>

          {/* ICE Success */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{t.admin.webrtcSuccess}</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {metrics.webrtcSuccessRate}%
            </div>
            <div className="text-[10px] text-slate-500">Direct + STUN/TURN</div>
          </div>

          {/* Avg Latency */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>RTT Latency</span>
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics.avgLatencyMs}ms
            </div>
            <div className="text-[10px] text-slate-500">Global median P50</div>
          </div>

          {/* TURN Bandwidth */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>SFU Bandwidth</span>
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics.turnBandwidthMbps}M
            </div>
            <div className="text-[10px] text-slate-500">Mbps aggregate</div>
          </div>
        </div>

        {/* SFU Cluster Node Health */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-tight">
            Infrastructure Cluster Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { node: 'sfu-us-east-cluster-01', region: 'US East (N. Virginia)', load: '22% CPU', status: 'Optimal' },
              { node: 'sfu-eu-west-cluster-01', region: 'Europe (Frankfurt)', load: '18% CPU', status: 'Optimal' },
              { node: 'sfu-ap-southeast-01', region: 'Asia Pacific (Singapore)', load: '14% CPU', status: 'Optimal' },
            ].map((node) => (
              <div
                key={node.node}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white font-mono">{node.node}</div>
                  <div className="text-[11px] text-slate-400">{node.region}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-mono text-emerald-400 font-medium flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{node.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono tabular-nums">{node.load}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit Trail Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.admin.auditLogs}
            </h2>
            <span className="text-xs text-slate-500 font-mono">Immutable Append-Only Audit Stream</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{log.userName}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-indigo-400 font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 uppercase text-[10px] font-semibold">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{log.details}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
