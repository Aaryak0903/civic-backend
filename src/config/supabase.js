const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Role Key is missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
