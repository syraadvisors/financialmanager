const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

const FIRM_ID = 'dc838876-888c-4cce-b37d-f055f40fcb0c';

async function deduplicateHouseholds() {
  console.log('Fetching all households...\n');

  // Fetch ALL households
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

  if (duplicates.length === 0) {
    console.log('\n✓ No duplicate household names found!');
    return;
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`FOUND ${duplicates.length} DUPLICATE HOUSEHOLD NAMES`);
  console.log(`Total duplicate records to remove: ${duplicates.reduce((sum, [_, hhs]) => sum + (hhs.length - 1), 0)}`);
  console.log('='.repeat(70));

  // Deduplication strategy:
  // 1. For each duplicate group, keep the OLDEST household (earliest created_at)
  // 2. Reassign all accounts from duplicate households to the kept household
  // 3. Delete the duplicate households

  const stats = {
    householdsKept: 0,
    householdsDeleted: 0,
    accountsReassigned: 0,
    errors: []
  };

  for (const [householdName, households] of duplicates) {
    // Sort by created_at to find the oldest (first created)
    households.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const keepHousehold = households[0]; // Oldest
    const deleteHouseholds = households.slice(1); // All newer duplicates

    console.log(`\nProcessing "${householdName}"`);
    console.log(`  Keeping: ${keepHousehold.id} (created: ${new Date(keepHousehold.created_at).toLocaleString()})`);
    console.log(`  Removing ${deleteHouseholds.length} duplicate(s)`);

    try {
      // For each duplicate household, reassign its accounts to the kept household
      for (const dupHousehold of deleteHouseholds) {
        // Find all accounts assigned to this duplicate household
        const { data: accounts, error: fetchError } = await supabase
          .from('accounts')
          .select('id')
          .eq('household_id', dupHousehold.id);

        if (fetchError) {
          console.error(`    Error fetching accounts for duplicate ${dupHousehold.id}:`, fetchError.message);
          stats.errors.push({ household: householdName, error: fetchError.message });
          continue;
        }

        if (accounts && accounts.length > 0) {
          // Reassign these accounts to the kept household
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ household_id: keepHousehold.id })
            .eq('household_id', dupHousehold.id);

          if (updateError) {
            console.error(`    Error reassigning accounts from ${dupHousehold.id}:`, updateError.message);
            stats.errors.push({ household: householdName, error: updateError.message });
            continue;
          }

          console.log(`    Reassigned ${accounts.length} account(s) from duplicate ${dupHousehold.id}`);
          stats.accountsReassigned += accounts.length;
        }

        // Delete the duplicate household
        const { error: deleteError } = await supabase
          .from('households')
          .delete()
          .eq('id', dupHousehold.id);

        if (deleteError) {
          console.error(`    Error deleting duplicate ${dupHousehold.id}:`, deleteError.message);
          stats.errors.push({ household: householdName, error: deleteError.message });
        } else {
          stats.householdsDeleted++;
        }
      }

      stats.householdsKept++;

    } catch (error) {
      console.error(`  Unexpected error for "${householdName}":`, error.message);
      stats.errors.push({ household: householdName, error: error.message });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('DEDUPLICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Unique households kept: ${stats.householdsKept}`);
  console.log(`Duplicate households deleted: ${stats.householdsDeleted}`);
  console.log(`Accounts reassigned: ${stats.accountsReassigned}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0 && stats.errors.length <= 20) {
    console.log('\n' + '='.repeat(70));
    console.log('ERRORS');
    console.log('='.repeat(70));
    stats.errors.forEach(err => {
      console.log(`  ${err.household}: ${err.error}`);
    });
  }

  console.log('\nDeduplication complete!');
}

deduplicateHouseholds().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
