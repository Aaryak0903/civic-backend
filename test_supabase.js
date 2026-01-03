require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    console.log('Validating connection to:', supabaseUrl);
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error fetching buckets:', error);
    } else {
        console.log('Supabase Connection Successful!');
        console.log('Available Buckets:', data.map(b => b.name));

        // Check for 'citizen-images' specifically
        if (data.find(b => b.name === 'citizen-images')) {
            console.log('✅ Bucket "citizen-images" exists.');
        } else {
            console.log('❌ Bucket "citizen-images" NOT found. You need to create this bucket in your Supabase dashboard.');
            console.log('Attempting to create it automatically...');
            const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('citizen-images', {
                public: true // Make it public so images can be viewed
            });

            if (bucketError) {
                console.error('Failed to create bucket:', bucketError.message);
            } else {
                console.log('✅ Bucket "citizen-images" created successfully.');
            }
        }
    }
}

checkBuckets();
