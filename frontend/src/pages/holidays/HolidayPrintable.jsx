import React from 'react';
import dayjs from 'dayjs';

const HolidayPrintable = React.forwardRef(({ holidays, company }, ref) => {
  const logoUrl = company?.logo ? `${import.meta.env.VITE_API_ADDRESS}logo/${company.logo}` : null;

  return (
    <div style={{ display: 'none' }}>
      <div ref={ref} className="print-container">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
            }
            .print-container {
              position: relative;
              font-family: 'Inter', sans-serif;
              color: #333;
              background: white;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(0, 0, 0, 0.03);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              text-transform: uppercase;
              font-weight: bold;
              width: 100%;
              text-align: center;
            }
            .watermark-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 400px;
              opacity: 0.04;
              z-index: 0;
              pointer-events: none;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #115e59;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .company-info {
              text-align: right;
              flex: 1;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #115e59;
              margin: 0;
            }
            .company-address {
              font-size: 12px;
              color: #666;
              margin: 5px 0 0;
              white-space: pre-line;
            }
            .logo {
              max-height: 70px;
              max-width: 200px;
              object-fit: contain;
            }
            .title-section {
              text-align: center;
              margin-bottom: 20px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              text-decoration: underline;
              text-transform: uppercase;
            }
            .holiday-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              position: relative;
              z-index: 1;
            }
            .holiday-table th {
              background-color: #f0fdfa;
              color: #115e59;
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }
            .holiday-table td {
              border: 1px solid #ddd;
              padding: 10px;
              font-size: 12px;
            }
            .holiday-table tr:nth-child(even) {
              background-color: #fafafa;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 10px;
              font-style: italic;
              font-size: 10px;
              color: #888;
              position: relative;
              z-index: 1;
            }
            .print-date {
              text-align: right;
              font-size: 10px;
              margin-top: 5px;
            }
          }
        `}</style>

        {/* Header Section */}
        <div className="header">
          {logoUrl && <img src={logoUrl} alt="Logo" className="logo" />}
          <div className="company-info">
            <h1 className="company-name">{company?.name || 'Company Name'}</h1>
            <p className="company-address">
              {company?.address || 'Company Address'}<br />
              {company?.contact || company?.email || ''}
            </p>
          </div>
        </div>

        {/* Title Section */}
        <div className="title-section">
          <h2 className="document-title">Official Holiday List - {dayjs().year()}</h2>
        </div>

        {/* Watermark Section */}
        {logoUrl ? (
          <img src={logoUrl} alt="" className="watermark-logo" />
        ) : (
          <div className="watermark">{company?.name || 'OFFICIAL'}</div>
        )}

        {/* Table Section */}
        <table className="holiday-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S.No</th>
              <th>Holiday Name</th>
              <th style={{ width: '120px' }}>From</th>
              <th style={{ width: '120px' }}>To</th>
              <th style={{ width: '100px' }}>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holi, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td style={{ fontWeight: 'bold' }}>{holi.name}</td>
                <td>{dayjs(holi.From).format('DD MMM, YYYY')}</td>
                <td>{dayjs(holi.till).format('DD MMM, YYYY')}</td>
                <td>{holi.type}</td>
                <td>{holi.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Section */}
        <div className="footer">
          <p>Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates.</p>
          <div className="print-date">Generated on: {dayjs().format('DD/MM/YYYY HH:mm')}</div>
        </div>
      </div>
    </div>
  );
});

HolidayPrintable.displayName = 'HolidayPrintable';

export default HolidayPrintable;
