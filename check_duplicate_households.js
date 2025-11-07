const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

const FIRM_ID = 'dc838876-888c-4cce-b37d-f055f40fcb0c';

async function checkDuplicates() {
  console.log('Fetching all households...\n');

  let allHouseholds = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('households')
      .select('id, household_name, firm_id, created_at')
      .eq('firm_id', FIRM_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allHouseholds = allHouseholds.concat(data);
      console.log(`Page ${page + 1}: ${data.length} households (total: ${allHouseholds.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nTotal households: ${allHouseholds.length}`);

  // Find duplicates by name
  const nameCount = {};
  allHouseholds.forEach(h => {
    const name = h.household_name;
    if (!nameCount[name]) {
      nameCount[name] = [];
    }
    nameCount[name].push(h);
  });

  const duplicates = Object.entries(nameCount).filter(([name, households]) => households.length > 1);

  if (duplicates.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`FOUND ${duplicates.length} DUPLICATE HOUSEHOLD NAMES`);
    console.log('='.repeat(70));

    duplicates.forEach(([name, households]) => {
      console.log(`\n"${name}" - ${households.length} instances:`);
      households.forEach(h => {
        console.log(`  - ID: ${h.id} (created: ${new Date(h.created_at).toLocaleString()})`);
      });
    });
  } else {
    console.log('\n✓ No duplicate household names found!');
  }
}

checkDuplicates();
