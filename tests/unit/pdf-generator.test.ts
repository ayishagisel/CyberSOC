import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFGenerator } from '../../server/pdf-generator';
import type { Report } from '@shared/schema';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn()
  }
}));

describe('PDFGenerator', () => {
  let mockReport: Report;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    mockReport = {
      id: 'report-001',
      session_id: 'session-001',
      generated_at: new Date('2025-01-17T10:00:00Z'),
      incident_summary: {
        title: 'Ransomware Attack - Financial Department',
        severity: 'Critical',
        affected_assets: 5,
        response_time: '15 minutes',
        status: 'In Progress'
      },
      timeline: [
        {
          timestamp: '2025-01-17T13:01:00Z',
          phase: 'Detection',
          action: 'Alert Generated',
          details: 'Ransomware detected on 5 endpoints'
        },
        {
          timestamp: '2025-01-17T13:05:00Z',
          phase: 'Scoping',
          action: 'Impact Assessment',
          details: 'Identified affected systems and users'
        }
      ],
      mitre_techniques: ['T1486', 'T1059.001'],
      recommendations: [
        'Implement regular backup verification procedures',
        'Enhance endpoint detection capabilities',
        'Conduct ransomware response training'
      ]
    };

    mockPage = {
      setContent: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content'))
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined)
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePDF', () => {
    it('should generate PDF for Analyst role', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      const result = await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: expect.any(String)
      });
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should generate PDF for Manager role', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Manager',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).toContain('Executive Summary Report');
      expect(htmlContent).toContain('Business Impact Analysis');
    });

    it('should generate PDF for Client role', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Client',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).toContain('Security Status Report');
      expect(htmlContent).toContain('Systems Affected');
      expect(htmlContent).toContain('Next Steps');
    });

    it('should include MITRE techniques only for Analyst role', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).toContain('MITRE ATT&CK Techniques');
      expect(htmlContent).toContain('T1486');
      expect(htmlContent).toContain('T1059.001');
    });

    it('should not include MITRE techniques for non-Analyst roles', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Manager',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).not.toContain('MITRE ATT&CK Techniques');
    });

    it('should handle empty timeline gracefully', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      const reportWithoutTimeline = {
        ...mockReport,
        timeline: []
      };

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: reportWithoutTimeline
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).not.toContain('Response Timeline');
    });

    it('should handle empty recommendations gracefully', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      const reportWithoutRecommendations = {
        ...mockReport,
        recommendations: []
      };

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: reportWithoutRecommendations
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).not.toContain('Recommendations');
    });

    it('should throw error when puppeteer fails', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockRejectedValue(new Error('Chrome not found'));

      await expect(
        PDFGenerator.generatePDF({
          userRole: 'Analyst',
          report: mockReport
        })
      ).rejects.toThrow('PDF generation failed: Chrome not found');
    });

    it('should close browser even when PDF generation fails', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);
      mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'));

      await expect(
        PDFGenerator.generatePDF({
          userRole: 'Analyst',
          report: mockReport
        })
      ).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should launch browser with correct configuration', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      expect(puppeteer.default.launch).toHaveBeenCalledWith({
        headless: true,
        executablePath: expect.stringContaining('chrome'),
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ])
      });
    });

    it('should log PDF generation progress', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      expect(consoleSpy).toHaveBeenCalledWith('Starting PDF generation for:', 'Analyst');
      expect(consoleSpy).toHaveBeenCalledWith('Browser launched successfully');
      expect(consoleSpy).toHaveBeenCalledWith('PDF generated successfully, size:', expect.any(Number), 'bytes');

      consoleSpy.mockRestore();
    });
  });

  describe('HTML generation', () => {
    it('should include proper styling', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('font-family: \'Arial\'');
      expect(htmlContent).toContain('.severity-critical');
      expect(htmlContent).toContain('.timeline-item');
    });

    it('should include report metadata', async () => {
      const puppeteer = await import('puppeteer');
      vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);

      await PDFGenerator.generatePDF({
        userRole: 'Analyst',
        report: mockReport
      });

      const htmlContent = mockPage.setContent.mock.calls[0][0];
      expect(htmlContent).toContain(mockReport.id);
      expect(htmlContent).toContain('SecureOps Platform');
    });
  });
});