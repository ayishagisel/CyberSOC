import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { FileStorage, DatabaseStorage } from '../../server/storage';
import type { Alert, Endpoint, LogEntry, WorkflowSession } from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises');
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const mockFs = fs as {
  readFile: MockedFunction<typeof fs.readFile>;
  writeFile: MockedFunction<typeof fs.writeFile>;
};

describe('FileStorage', () => {
  let storage: FileStorage;
  let mockAlertsData: Alert[];
  let mockEndpointsData: Endpoint[];
  let mockLogsData: LogEntry[];
  let mockWorkflowSessionsData: WorkflowSession[];

  beforeEach(() => {
    storage = new FileStorage();

    mockAlertsData = [
      {
        id: 'alert-001',
        title: 'Ransomware Detection',
        description: 'Ransomware activity detected',
        severity: 'Critical',
        status: 'New',
        timestamp: '2025-01-17T10:00:00Z',
        source: 'EDR',
        affected_endpoints: ['endpoint-01', 'endpoint-02'],
        mitre_tactics: ['T1486'],
        recommended_actions: ['Isolate endpoints']
      }
    ];

    mockEndpointsData = [
      {
        id: 'endpoint-01',
        hostname: 'WS-001',
        ip_address: '192.168.1.100',
        os: 'Windows 10',
        department: 'Finance',
        last_seen: '2025-01-17T09:30:00Z',
        status: 'Normal',
        risk_score: 3
      }
    ];

    mockLogsData = [
      {
        id: 'log-001',
        timestamp: '2025-01-17T10:00:00Z',
        source: 'Windows Event Log',
        severity: 'High',
        message: 'Suspicious process execution detected',
        endpoint_id: 'endpoint-01',
        user_id: 'john.doe',
        process_name: 'encrypt.exe',
        details: { pid: 1234, command_line: 'encrypt.exe --all' }
      }
    ];

    mockWorkflowSessionsData = [
      {
        id: 'session-001',
        alert_id: 'alert-001',
        user_role: 'Analyst',
        current_node: 'detection_phase',
        started_at: '2025-01-17T10:05:00Z',
        completed_nodes: [],
        actions_taken: [],
        status: 'Active'
      }
    ];

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAlerts', () => {
    it('should return alerts from file', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAlertsData));

      const result = await storage.getAlerts();

      expect(result).toEqual(mockAlertsData);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('alerts.json'),
        'utf-8'
      );
    });

    it('should return empty array when file read fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await storage.getAlerts();

      expect(result).toEqual([]);
    });
  });

  describe('getAlert', () => {
    it('should return specific alert by id', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAlertsData));

      const result = await storage.getAlert('alert-001');

      expect(result).toEqual(mockAlertsData[0]);
    });

    it('should return undefined for non-existent alert', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAlertsData));

      const result = await storage.getAlert('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateAlert', () => {
    it('should update alert and write to file', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAlertsData));
      mockFs.writeFile.mockResolvedValue();

      const updates = { status: 'In Progress' as const };
      const result = await storage.updateAlert('alert-001', updates);

      expect(result).toEqual({ ...mockAlertsData[0], ...updates });
      
      // Verify file write with flexible assertions
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      const [filePath, fileContent] = mockFs.writeFile.mock.calls[0];
      
      // Assert file path contains alerts.json (avoid absolute vs relative path issues)
      expect(filePath).toMatch(/alerts\.json$/);
      
      // Parse JSON content and assert on object structure (avoid formatting differences)
      const writtenData = JSON.parse(fileContent as string);
      expect(Array.isArray(writtenData)).toBe(true);
      expect(writtenData[0]).toMatchObject({
        id: 'alert-001',
        status: 'In Progress'
      });
    });

    it('should return undefined for non-existent alert', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAlertsData));

      const result = await storage.updateAlert('non-existent', { status: 'Resolved' });

      expect(result).toBeUndefined();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      const multipleLogsData = [
        ...mockLogsData,
        {
          id: 'log-002',
          timestamp: '2025-01-17T09:00:00Z',
          source: 'Firewall',
          severity: 'Medium',
          message: 'Connection blocked',
          endpoint_id: 'endpoint-02',
          user_id: 'jane.doe',
          process_name: 'chrome.exe',
          details: { port: 443, destination: '192.168.1.200' }
        }
      ];
      mockFs.readFile.mockResolvedValue(JSON.stringify(multipleLogsData));
    });

    it('should return all logs when no filters provided', async () => {
      const result = await storage.getLogs();

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBe('2025-01-17T10:00:00Z'); // Newest first
    });

    it('should filter by source', async () => {
      const result = await storage.getLogs({ source: 'Windows Event Log' });

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('Windows Event Log');
    });

    it('should filter by severity', async () => {
      const result = await storage.getLogs({ severity: 'High' });

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('High');
    });

    it('should limit results', async () => {
      const result = await storage.getLogs({ limit: 1 });

      expect(result).toHaveLength(1);
    });

    it('should not filter when "All Sources" or "All Severities" provided', async () => {
      const result = await storage.getLogs({
        source: 'All Sources',
        severity: 'All Severities'
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('createWorkflowSession', () => {
    it('should create new workflow session with generated id', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify([]));
      mockFs.writeFile.mockResolvedValue();

      const sessionData = {
        alert_id: 'alert-001',
        user_role: 'Analyst' as const,
        current_node: 'detection_phase',
        started_at: '2025-01-17T10:05:00Z',
        completed_nodes: [],
        actions_taken: [],
        status: 'Active' as const
      };

      const result = await storage.createWorkflowSession(sessionData);

      expect(result.id).toBeDefined();
      expect(result.alert_id).toBe('alert-001');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('applyScenario', () => {
    beforeEach(() => {
      mockFs.readFile.mockImplementation((filePath) => {
        if (filePath.toString().includes('endpoints.json')) {
          return Promise.resolve(JSON.stringify(mockEndpointsData));
        }
        if (filePath.toString().includes('alerts.json')) {
          return Promise.resolve(JSON.stringify(mockAlertsData));
        }
        return Promise.resolve('[]');
      });
      mockFs.writeFile.mockResolvedValue();
    });

    it('should apply ransomware scenario correctly', async () => {
      const result = await storage.applyScenario('ransomware');

      expect(result.activeAlertId).toBe('alert-001');
      expect(result.scenarioName).toBe('Ransomware Attack');
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // endpoints + alerts
    });

    it('should throw error for unknown scenario', async () => {
      await expect(storage.applyScenario('unknown-scenario')).rejects.toThrow(
        'Unknown scenario: unknown-scenario'
      );
    });
  });

  describe('generateReport', () => {
    it('should generate report with mock data', async () => {
      mockFs.readFile.mockResolvedValue('[]');
      mockFs.writeFile.mockResolvedValue();

      const result = await storage.generateReport('session-001');

      expect(result.id).toBeDefined();
      expect(result.session_id).toBe('session-001');
      expect(result.incident_summary).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.mitre_techniques).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      const result = await storage.getAlerts();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading alerts.json:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('DatabaseStorage Edge Cases', () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    storage = new DatabaseStorage();
    vi.clearAllMocks();
  });

  it('should handle undefined results gracefully', async () => {
    const mockDb = await import('../../server/db');
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    });
    mockDb.db.select = mockSelect;

    const result = await storage.getAlert('non-existent');
    expect(result).toBeUndefined();
  });
});