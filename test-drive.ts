import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testDrive() {
  console.log("Testing Google Drive Integration...");
  
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in .env.local");
    return;
  }

  console.log(`Authenticating as: ${clientEmail}`);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Try to list files to verify auth works
    console.log("Checking authentication and API access...");
    const res = await drive.files.list({
      pageSize: 5,
      fields: 'nextPageToken, files(id, name)',
    });
    
    console.log("Authentication successful! Here are files accessible by the service account:");
    if (res.data.files && res.data.files.length > 0) {
      res.data.files.forEach((file) => {
        console.log(`- ${file.name} (${file.id})`);
      });
    } else {
      console.log("No files found. The service account hasn't been added to any folders yet.");
    }
  } catch (error: any) {
    console.error("Google Drive API Error:", error.message);
    if (error.response?.data) {
      console.error("Detailed Error:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDrive();
