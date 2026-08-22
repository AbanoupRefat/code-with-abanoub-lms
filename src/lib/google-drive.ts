import { google } from 'googleapis';

/**
 * Validates that the Google Service Account credentials exist in the environment.
 */
function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Replace escaped newlines with actual newlines for the private key
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.warn("Google Drive Integration is missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in .env.local");
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

/**
 * Grants a specific email 'viewer' permission to a Google Drive Folder.
 */
export async function grantStudentAccess(folderId: string, studentEmail: string) {
  if (!folderId) return { success: false, error: "No folder ID provided" };
  
  const auth = getGoogleAuth();
  if (!auth) return { success: false, error: "Google credentials not configured" };

  try {
    const drive = google.drive({ version: 'v3', auth });

    // Note: We use sendNotificationEmail: false so we don't spam the student.
    const response = await drive.permissions.create({
      fileId: folderId,
      sendNotificationEmail: false,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: studentEmail,
      },
    });

    console.log(`Successfully granted ${studentEmail} access to folder ${folderId}`);
    return { success: true, permissionId: response.data.id };
  } catch (error: any) {
    console.error(`Failed to grant Google Drive access to ${studentEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Finds and removes a user's permission from a Google Drive Folder.
 */
export async function revokeStudentAccess(folderId: string, studentEmail: string) {
  if (!folderId) return { success: false, error: "No folder ID provided" };
  
  const auth = getGoogleAuth();
  if (!auth) return { success: false, error: "Google credentials not configured" };

  try {
    const drive = google.drive({ version: 'v3', auth });

    // First, we need to find the specific permission ID for this email address
    const permissionsResponse = await drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(id, emailAddress)',
    });

    const permissions = permissionsResponse.data.permissions || [];
    const targetPermission = permissions.find(
      (p) => p.emailAddress?.toLowerCase() === studentEmail.toLowerCase()
    );

    if (!targetPermission || !targetPermission.id) {
      console.log(`No existing permission found for ${studentEmail} on folder ${folderId}`);
      return { success: true }; // Technically successful if they already don't have access
    }

    // Delete the permission using its ID
    await drive.permissions.delete({
      fileId: folderId,
      permissionId: targetPermission.id,
    });

    console.log(`Successfully revoked ${studentEmail}'s access from folder ${folderId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to revoke Google Drive access for ${studentEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}
