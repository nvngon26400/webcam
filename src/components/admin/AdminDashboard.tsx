import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SystemMetrics, AuditLog, User, UserRole, RolePermissions } from '../../types';
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
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Check,
  UserCheck,
  Lock,
  Sparkles,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationName: string;
  createdAt: string;
  avatarUrl?: string;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const { token, user: currentUser } = useAuth();
  const toast = useToast();

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
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, RolePermissions>>({
    PARTICIPANT: {
      canStartInstantMeeting: false,
      canScheduleMeeting: false,
      canRecordMeeting: false,
      canCreateBreakoutRooms: false,
      canAccessAiSummary: false,
      canLockRoom: false,
      canMuteAll: false,
      canManageUsers: false,
    },
    HOST: {
      canStartInstantMeeting: true,
      canScheduleMeeting: true,
      canRecordMeeting: true,
      canCreateBreakoutRooms: true,
      canAccessAiSummary: true,
      canLockRoom: true,
      canMuteAll: true,
      canManageUsers: false,
    },
    ADMIN: {
      canStartInstantMeeting: true,
      canScheduleMeeting: true,
      canRecordMeeting: true,
      canCreateBreakoutRooms: true,
      canAccessAiSummary: true,
      canLockRoom: true,
      canMuteAll: true,
      canManageUsers: true,
    },
    SUPER_ADMIN: {
      canStartInstantMeeting: true,
      canScheduleMeeting: true,
      canRecordMeeting: true,
      canCreateBreakoutRooms: true,
      canAccessAiSummary: true,
      canLockRoom: true,
      canMuteAll: true,
      canManageUsers: true,
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsRefreshing(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [metricsRes, logsRes, usersRes, permRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/audit-logs'),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/permissions'),
      ]);

      if (metricsRes.ok) {
        const json = await metricsRes.json();
        setMetrics(json.data);
      }
      if (logsRes.ok) {
        const json = await logsRes.json();
        setAuditLogs(json.data);
      }
      if (usersRes.ok) {
        const json = await usersRes.json();
        if (json.users) setUsersList(json.users);
      }
      if (permRes.ok) {
        const json = await permRes.json();
        if (json.permissions) setPermissionsMatrix(json.permissions);
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
  }, [token]);

  const handleUpdateUserRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(targetUserId);
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newRole }),
      });

      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
        );
        toast.success(`Đã cập nhật vai trò thành ${newRole}!`, 'Phân quyền người dùng');
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Không thể đổi vai trò.');
      }
    } catch (e) {
      toast.error('Lỗi khi kết nối cập nhật quyền.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleTogglePermission = async (
    role: string,
    permissionKey: keyof RolePermissions
  ) => {
    const current = permissionsMatrix[role];
    if (!current) return;

    const updatedPermissions = {
      ...current,
      [permissionKey]: !current[permissionKey],
    };

    setPermissionsMatrix((prev) => ({
      ...prev,
      [role]: updatedPermissions,
    }));

    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          permissions: updatedPermissions,
        }),
      });

      if (res.ok) {
        toast.success(`Đã lưu thiết lập quyền ${permissionKey} cho ${role}!`, 'Ma trận quyền');
      } else {
        toast.error('Lỗi lưu quyền lên máy chủ.');
      }
    } catch {
      toast.error('Lỗi mạng khi lưu quyền.');
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const permissionLabels: Record<keyof RolePermissions, string> = {
    canStartInstantMeeting: 'Tạo cuộc họp tức thì',
    canScheduleMeeting: 'Lên lịch cuộc họp',
    canRecordMeeting: 'Ghi hình (WebM/MP4)',
    canCreateBreakoutRooms: 'Phòng nhóm (Breakout)',
    canAccessAiSummary: 'Tóm tắt AI Gemini',
    canLockRoom: 'Khóa phòng họp',
    canMuteAll: 'Tắt tiếng tất cả',
    canManageUsers: 'Quản trị & Phân quyền',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">
              <span>Bảng điều khiển Quản trị viên (Admin RBAC)</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cơ sở dữ liệu đang kết nối
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{t.admin.title}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={isRefreshing}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer min-h-[38px] shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {/* Active Meetings */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">{t.admin.activeMeetings}</span>
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {metrics.activeMeetings}
            </div>
          </div>

          {/* Concurrent Users */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">{t.admin.concurrentUsers}</span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {metrics.concurrentParticipants}
            </div>
          </div>

          {/* WebSocket Sockets */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">{t.admin.signalingSockets}</span>
              <Radio className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {metrics.activeSignalingSockets}
            </div>
          </div>

          {/* ICE Success */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">{t.admin.webrtcSuccess}</span>
              <Wifi className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {metrics.webrtcSuccessRate}%
            </div>
          </div>

          {/* SFU Throughput */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">{t.admin.turnBandwidth}</span>
              <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {metrics.turnBandwidthMbps} <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">Mbps</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5 sm:space-y-2 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs flex items-center justify-between">
              <span className="truncate">Thời gian chạy</span>
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatUptime(metrics.uptimeSeconds)}
            </div>
          </div>
        </div>

        {/* SECTION 1: User Role Management (Phân quyền người dùng) */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Quản lý & Phân quyền người dùng (User Role Assignment)</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Chỉ Quản trị viên (Admin) mới có quyền chỉ định vai trò trong Database thật (Super Admin, Admin, Host, User thường).
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 self-start sm:self-auto font-semibold">
              Tổng: {usersList.length} tài khoản
            </span>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Thành viên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Tổ chức</th>
                    <th className="py-3 px-4">Vai trò hiện tại</th>
                    <th className="py-3 px-4 text-right">Phân quyền mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {usersList.map((usr) => {
                    const isSelf = usr.id === currentUser.id;
                    return (
                      <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {usr.avatarUrl ? (
                              <img
                                src={usr.avatarUrl}
                                alt={usr.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                                {usr.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{usr.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{usr.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{usr.email}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{usr.organizationName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded ${
                              usr.role === 'SUPER_ADMIN'
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                                : usr.role === 'ADMIN'
                                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30'
                                : usr.role === 'HOST'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {usr.role === 'PARTICIPANT' ? 'USER THƯỜNG' : usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <select
                              value={usr.role}
                              disabled={updatingUserId === usr.id}
                              onChange={(e) =>
                                handleUpdateUserRole(usr.id, e.target.value as UserRole)
                              }
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                            >
                              <option value="SUPER_ADMIN">Super Admin (Toàn quyền)</option>
                              <option value="ADMIN">Admin (Quản trị viên)</option>
                              <option value="HOST">Host (Chủ tọa cuộc họp)</option>
                              <option value="PARTICIPANT">User thường (Participant)</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: Role Permissions Configuration Matrix (Phân quyền chức năng) */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Ma trận Phân quyền Chức năng (RBAC Permission Matrix)</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cấu hình các chức năng mà từng vai trò được phép sử dụng trong Database. Thay đổi có hiệu lực ngay lập tức.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tính năng hệ thống</th>
                    <th className="py-3 px-4 text-center">User thường</th>
                    <th className="py-3 px-4 text-center">Host</th>
                    <th className="py-3 px-4 text-center">Admin</th>
                    <th className="py-3 px-4 text-center">Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {(Object.keys(permissionLabels) as Array<keyof RolePermissions>).map((permKey) => (
                    <tr key={permKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-xs">{permissionLabels[permKey]}</span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">({permKey})</span>
                      </td>

                      {/* Participant */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!permissionsMatrix.PARTICIPANT?.[permKey]}
                          onChange={() => handleTogglePermission('PARTICIPANT', permKey)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Host */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!permissionsMatrix.HOST?.[permKey]}
                          onChange={() => handleTogglePermission('HOST', permKey)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Admin */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!permissionsMatrix.ADMIN?.[permKey]}
                          onChange={() => handleTogglePermission('ADMIN', permKey)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Super Admin */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!permissionsMatrix.SUPER_ADMIN?.[permKey]}
                          onChange={() => handleTogglePermission('SUPER_ADMIN', permKey)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Audit Trail Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{t.admin.auditLogs}</span>
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-500 font-mono">Immutable Audit Trail</span>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                    <th className="py-3 px-4">Hành động</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Chi tiết</th>
                    <th className="py-3 px-4 text-right">Địa chỉ IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {auditLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{log.userName}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.details}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400 tabular-nums text-[11px]">
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
