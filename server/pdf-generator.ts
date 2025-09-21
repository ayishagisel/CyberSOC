import puppeteer from 'puppeteer';
import type { Report } from '@shared/schema';

interface PDFGenerationOptions {
  userRole: 'Analyst' | 'Manager' | 'Client';
  report: Report;
}

export class PDFGenerator {
  private static async createHTML(options: PDFGenerationOptions): Promise<string> {
    const { userRole, report } = options;
    const incident_summary = report.incident_summary as any;
    const timeline = report.timeline as any[];
    const mitre_techniques = report.mitre_techniques as string[];
    const recommendations = report.recommendations as string[];
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    const baseStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: white;
        }
        .header { 
          background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
          color: white; 
          padding: 30px; 
          text-align: center; 
          margin-bottom: 30px;
        }
        .company-logo { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .report-title { 
          font-size: 28px; 
          margin-bottom: 5px; 
        }
        .report-subtitle { 
          font-size: 16px; 
          opacity: 0.9; 
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 0 30px; 
        }
        .section { 
          margin-bottom: 30px; 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 4px solid #3182ce; 
        }
        .section-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 15px; 
          color: #1a365d; 
        }
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin-bottom: 25px; 
        }
        .metric-card { 
          background: white; 
          padding: 20px; 
          border-radius: 8px; 
          text-align: center; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .metric-value { 
          font-size: 32px; 
          font-weight: bold; 
          color: #3182ce; 
        }
        .metric-label { 
          font-size: 14px; 
          color: #666; 
          margin-top: 5px; 
        }
        .timeline-item { 
          border-left: 3px solid #3182ce; 
          padding-left: 15px; 
          margin-bottom: 15px; 
          position: relative; 
        }
        .timeline-item::before { 
          content: ''; 
          width: 10px; 
          height: 10px; 
          background: #3182ce; 
          border-radius: 50%; 
          position: absolute; 
          left: -6px; 
          top: 5px; 
        }
        .timeline-time { 
          font-size: 12px; 
          color: #666; 
          margin-bottom: 5px; 
        }
        .timeline-title { 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .timeline-details { 
          color: #666; 
        }
        .recommendations-list { 
          list-style: none; 
        }
        .recommendations-list li { 
          padding: 10px 0; 
          border-bottom: 1px solid #e2e8f0; 
          position: relative; 
          padding-left: 25px; 
        }
        .recommendations-list li::before { 
          content: '✓'; 
          color: #38a169; 
          font-weight: bold; 
          position: absolute; 
          left: 0; 
        }
        .severity-critical { color: #e53e3e; }
        .severity-high { color: #dd6b20; }
        .severity-medium { color: #d69e2e; }
        .severity-low { color: #38a169; }
        .footer { 
          margin-top: 40px; 
          padding: 20px; 
          text-align: center; 
          border-top: 1px solid #e2e8f0; 
          color: #666; 
          font-size: 12px; 
        }
        .mitre-techniques { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 10px; 
        }
        .mitre-tag { 
          background: #bee3f8; 
          color: #1a365d; 
          padding: 5px 10px; 
          border-radius: 15px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 5px 15px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: bold; 
          text-transform: uppercase; 
        }
        .status-new { background: #fed7d7; color: #c53030; }
        .status-progress { background: #fbd38d; color: #c05621; }
        .status-resolved { background: #c6f6d5; color: #22543d; }
        .page-break { page-break-after: always; }
      </style>
    `;

    const headerTitle = userRole === 'Analyst' ? 'Technical Incident Report' :
                       userRole === 'Manager' ? 'Executive Summary Report' :
                       'Security Status Report';

    const headerSubtitle = userRole === 'Analyst' ? 'Detailed Analysis & Response Metrics' :
                          userRole === 'Manager' ? 'Business Impact & Response Overview' :
                          'Current Status & Next Steps';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${headerTitle}</title>
          ${baseStyles}
        </head>
        <body>
          <div class="header">
            <div class="company-logo">🛡️ SecureOps Platform</div>
            <div class="report-title">${headerTitle}</div>
            <div class="report-subtitle">${headerSubtitle}</div>
            <div class="report-subtitle">Generated on ${currentDate}</div>
          </div>

          <div class="container">
            <div class="section">
              <h2 class="section-title">📊 Incident Overview</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${incident_summary.affected_assets}</div>
                  <div class="metric-label">${userRole === 'Client' ? 'Systems Affected' : 'Affected Endpoints'}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value severity-${incident_summary.severity.toLowerCase()}">${incident_summary.severity}</div>
                  <div class="metric-label">Severity Level</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${incident_summary.response_time}</div>
                  <div class="metric-label">Response Time</div>
                </div>
                <div class="metric-card">
                  <div class="status-badge status-${incident_summary.status.toLowerCase().replace(' ', '')}">${incident_summary.status}</div>
                  <div class="metric-label">Current Status</div>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-bottom: 15px; color: #1a365d;">📝 Incident Summary</h3>
                <p><strong>Title:</strong> ${incident_summary.title}</p>
                <p style="margin-top: 10px;"><strong>Description:</strong> ${
                  userRole === 'Client' 
                    ? 'Our security team has identified and is actively containing a security incident. Affected systems have been isolated to prevent further impact.'
                    : 'Security incident detected and response procedures initiated according to established protocols.'
                }</p>
              </div>
            </div>

            ${Array.isArray(timeline) && timeline.length > 0 ? `
            <div class="section">
              <h2 class="section-title">⏱️ Response Timeline</h2>
              ${timeline.map(item => `
                <div class="timeline-item">
                  <div class="timeline-time">${new Date(item.timestamp).toLocaleString()}</div>
                  <div class="timeline-title">${item.phase}: ${item.action}</div>
                  <div class="timeline-details">${item.details}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${userRole === 'Analyst' && Array.isArray(mitre_techniques) && mitre_techniques.length > 0 ? `
            <div class="section">
              <h2 class="section-title">🎯 MITRE ATT&CK Techniques</h2>
              <p style="margin-bottom: 15px;">The following attack techniques have been identified:</p>
              <div class="mitre-techniques">
                ${mitre_techniques.map(technique => `
                  <span class="mitre-tag">${technique}</span>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${Array.isArray(recommendations) && recommendations.length > 0 ? `
            <div class="section">
              <h2 class="section-title">${userRole === 'Client' ? '📋 Next Steps' : '💡 Recommendations'}</h2>
              <ul class="recommendations-list">
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${userRole === 'Manager' ? `
            <div class="section">
              <h2 class="section-title">💼 Business Impact Analysis</h2>
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <h4 style="margin-bottom: 10px; color: #1a365d;">Financial Impact</h4>
                    <p style="color: #666;">Estimated downtime costs and recovery expenses are being assessed.</p>
                  </div>
                  <div>
                    <h4 style="margin-bottom: 10px; color: #1a365d;">Operational Impact</h4>
                    <p style="color: #666;">Critical business processes have been maintained with minimal disruption.</p>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="footer">
              <p>This report was generated automatically by the SecureOps Incident Response Platform</p>
              <p>For questions or additional information, please contact the Security Operations Center</p>
              <p style="margin-top: 10px;">Report ID: ${report.id} | Generated: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return htmlContent;
  }

  static async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      try {
        const page = await browser.newPage();
        await page.setContent(await this.createHTML(options), {
          waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
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
          footerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
              <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
          `
        });

        return Buffer.from(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('Puppeteer PDF generation failed:', error);
      // Fallback: Create a simple PDF-like text response
      const fallbackContent = `
PDF Generation Not Available
============================

This is a fallback response because PDF generation requires Chrome/Chromium
to be installed on the system.

Report Details:
- User Role: ${options.userRole}
- Report ID: ${options.report.id}
- Generated: ${new Date().toISOString()}

To enable PDF generation, please install Chrome/Chromium:
npx puppeteer browsers install chrome

Or install system chromium package if available.
      `;

      throw new Error(`PDF generation failed: ${error.message}. Chrome/Chromium is required for PDF generation.`);
    }
  }
}