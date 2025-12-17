
require('dotenv').config({ path: './server/.env' });
const supabase = require('./server/supabase');

async function testBucket() {
    console.log('Testing "attachments" bucket access...');
    try {
        const { data, error } = await supabase.storage.getBucket('attachments');
        if (error) {
            console.error('Error getting bucket:', error);
        } else {
            console.log('Bucket "attachments" exists:', data);

            // Try listing files to ensure we have access
            const { data: files, error: listError } = await supabase.storage.from('attachments').list();
            if (listError) {
                console.error('Error listing files in "attachments":', listError);
            } else {
                console.log('Successfully listed files in "attachments". Count:', files.length);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testBucket();
