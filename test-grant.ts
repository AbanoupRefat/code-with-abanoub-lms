import { grantStudentAccess } from './src/lib/google-drive';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const folderId = '1F0c9ensI326MbPCjY-bsEVJH_39D0i3F'; // Folder ID from the previous run
  const email = 'abanoubrefat26@gmail.com'; // The user's other Google login email
  
  console.log(`Attempting to grant access to folder ${folderId} for email ${email}`);
  
  const result = await grantStudentAccess(folderId, email);
  
  console.log('Result:', result);
}

run();
