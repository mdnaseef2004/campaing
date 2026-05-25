import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      timestamp,
      campaignId,
      campaignName,
      studentId,
      name,
      phone,
      category,
      referrerLink,
      deviceType,
      googleSheetsUrl,
    } = data;

    console.log('--- Sheets Sync Triggered ---');
    console.log(`Campaign: ${campaignName} (${campaignId})`);
    console.log(`Student: ${name} | ${phone} | ${category}`);
    console.log(`Device: ${deviceType} | Time: ${timestamp}`);

    // ─── PATH 1: Google Apps Script Web App URL (preferred, simple) ───────────
    if (googleSheetsUrl && googleSheetsUrl.startsWith('https://script.google.com')) {
      try {
        const payload = {
          timestamp,
          campaignId,
          campaignName,
          studentId,
          name: name || 'Anonymous',
          phone: phone || 'N/A',
          category: category || 'N/A',
          referrerLink: referrerLink || 'Direct',
          deviceType,
        };

        const response = await fetch(googleSheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Apps Script returned HTTP ${response.status}`);
        }

        console.log('✓ Synced via Google Apps Script Web App URL');
        return NextResponse.json({
          success: true,
          message: 'Submission synced to Google Sheets via Apps Script.',
          method: 'apps-script',
        });
      } catch (appsScriptError: any) {
        console.warn('Apps Script relay failed:', appsScriptError.message);
        // Fall through to Service Account method
      }
    }

    // ─── PATH 2: Google Service Account API (legacy / fallback) ───────────────
    const spreadsheetId = data.googleSpreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = data.googleClientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = data.googlePrivateKey || process.env.GOOGLE_PRIVATE_KEY;
    const sheetName = data.googleSheetName || 'Sheet1';

    if (spreadsheetId && clientEmail && privateKey) {
      try {
        const { google } = await import('googleapis');
        const formattedKey = privateKey.replace(/\\n/g, '\n');

        const auth = new google.auth.JWT(clientEmail, undefined, formattedKey, [
          'https://www.googleapis.com/auth/spreadsheets',
        ]);
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:I`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              timestamp,
              campaignId,
              campaignName || 'N/A',
              studentId,
              name || 'Anonymous',
              phone || 'N/A',
              category || 'N/A',
              referrerLink || 'Direct',
              deviceType,
            ]],
          },
        });

        console.log('✓ Synced via Google Service Account API');
        return NextResponse.json({
          success: true,
          message: 'Submission synced via Google Sheets API.',
          method: 'service-account',
        });
      } catch (saError: any) {
        console.warn('Service account sync failed:', saError.message);
      }
    }

    // ─── No integration configured ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Submission logged locally. No Google Sheets integration configured.',
      synced: false,
    });

  } catch (error: any) {
    console.error('sync-sheet route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
