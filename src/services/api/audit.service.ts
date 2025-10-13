import { supabase } from '../../lib/supabase';
import { AuditLog } from '../../types/User';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

class AuditService {
  /**
   * Get audit logs for a firm with optional filters
   */
  async getAuditLogs(firmId: string, filters?: AuditLogFilters): Promise<ApiResponse<AuditLog[]>> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_profiles!audit_logs_user_id_fkey(
            email,
            full_name
          )
        `)
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return { data: null, error: error.message };
      }

      // Transform the data to match AuditLog type
      const auditLogs: AuditLog[] = (data || []).map((log: any) => ({
        id: log.id,
        createdAt: new Date(log.created_at),
        userId: log.user_id,
        firmId: log.firm_id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        // Include user info if joined
        user: log.user,
      }));

      return { data: auditLogs, error: null };
    } catch (err: any) {
      console.error('Error in getAuditLogs:', err);
      return { data: null, error: err.message || 'Failed to fetch audit logs' };
    }
  }

  /**
   * Get audit log statistics for dashboard
   */
  async getAuditStats(firmId: string, days: number = 30): Promise<ApiResponse<{
    totalActions: number;
    uniqueUsers: number;
    actionsByType: Record<string, number>;
    recentActions: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, user_id, created_at')
        .eq('firm_id', firmId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        return { data: null, error: error.message };
      }

      // Calculate stats
      const uniqueUsers = new Set(data.map(log => log.user_id)).size;
      const actionsByType: Record<string, number> = {};

      data.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      });

      // Recent actions (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      const recentActions = data.filter(
        log => new Date(log.created_at) > oneDayAgo
      ).length;

      return {
        data: {
          totalActions: data.length,
          uniqueUsers,
          actionsByType,
          recentActions,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch audit stats' };
    }
  }

  /**
   * Get unique actions for filter dropdown
   */
  async getUniqueActions(firmId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .eq('firm_id', firmId)
        .order('action');

      if (error) {
        return { data: null, error: error.message };
      }

      const uniqueActions = Array.from(new Set(data.map(log => log.action))).filter(Boolean);
      return { data: uniqueActions, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch actions' };
    }
  }

  /**
   * Get unique resource types for filter dropdown
   */
  async getUniqueResourceTypes(firmId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('resource_type')
        .eq('firm_id', firmId)
        .not('resource_type', 'is', null)
        .order('resource_type');

      if (error) {
        return { data: null, error: error.message };
      }

      const uniqueTypes = Array.from(new Set(data.map(log => log.resource_type))).filter(Boolean) as string[];
      return { data: uniqueTypes, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch resource types' };
    }
  }

  /**
   * Export audit logs to CSV
   */
  exportToCSV(logs: AuditLog[]): string {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      (log as any).user?.email || log.userId || 'N/A',
      log.action,
      log.resourceType || 'N/A',
      log.resourceId || 'N/A',
      log.ipAddress || 'N/A',
      JSON.stringify(log.details || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

export const auditService = new AuditService();
