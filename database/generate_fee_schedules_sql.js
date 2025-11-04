const fs = require('fs');

// Import the fee schedules data
const allFeeSchedules = [
  // We'll manually copy the data structure here
  // Or read it from the file if we can parse it
];

const firmId = 'dc838876-888c-4cce-b37d-f055f40fcb0c';

function generateSQL() {
  let sql = `-- Insert all 50 real fee schedules from React app\n`;
  sql += `-- Firm ID: ${firmId}\n\n`;
  sql += `-- Drop NOT NULL constraint on old columns\n`;
  sql += `ALTER TABLE fee_schedules ALTER COLUMN schedule_name DROP NOT NULL;\n\n`;
  sql += `-- Delete sample/test data if exists\n`;
  sql += `DELETE FROM fee_schedules WHERE firm_id = '${firmId}';\n\n`;
  sql += `-- Insert real fee schedules\n`;
  sql += `INSERT INTO fee_schedules (\n`;
  sql += `  firm_id, code, name, status, structure_type, tiers,\n`;
  sql += `  flat_rate, flat_fee_per_quarter, has_minimum_fee, minimum_fee_per_year,\n`;
  sql += `  description, is_direct_bill, schedule_name, schedule_status\n`;
  sql += `) VALUES\n`;

  // Read the TypeScript file
  const tsContent = fs.readFileSync('../src/data/feeSchedulesData.ts', 'utf8');

  // Extract just the array content
  // This is a hack but will work for well-formatted data
  const arrayMatch = tsContent.match(/export const allFeeSchedules.*?= (\[[\s\S]*\]);/);

  if (!arrayMatch) {
    console.error('Could not parse fee schedules');
    return;
  }

  // Evaluate the JavaScript (convert TS to JS first by removing type annotations)
  const arrayStr = arrayMatch[1]
    .replace(/:\s*number/g, '')
    .replace(/:\s*string/g, '')
    .replace(/:\s*boolean/g, '')
    .replace(/FeeScheduleStatus\./g, '\'')
    .replace(/FeeScheduleTag\./g, '\'')
    .replace(/FeeStructureType\./g, '\'');

  let schedules;
  try {
    schedules = eval(arrayStr);
  } catch (e) {
    console.error('Error parsing schedules:', e);
    return;
  }

  const values = schedules.map((schedule, index) => {
    const tiers = schedule.tiers ? `'${JSON.stringify(schedule.tiers)}'::jsonb` : 'NULL';
    const flatRate = schedule.flatRate !== undefined ? schedule.flatRate : 'NULL';
    const flatFee = schedule.flatFeePerQuarter !== undefined ? schedule.flatFeePerQuarter : 'NULL';
    const minFee = schedule.minimumFeePerYear !== undefined ? schedule.minimumFeePerYear : 0;
    const isDirectBill = schedule.isDirectBill ? 'true' : 'false';

    return `(
  '${firmId}',
  '${schedule.code}',
  '${schedule.name}',
  '${schedule.status}',
  '${schedule.structureType}',
  ${tiers},
  ${flatRate},
  ${flatFee},
  ${schedule.hasMinimumFee},
  ${minFee},
  '${schedule.description.replace(/'/g, "''")}',
  ${isDirectBill},
  '${schedule.name}',
  '${schedule.status === 'active' ? 'Active' : 'Inactive'}'
)`;
  });

  sql += values.join(',\n');
  sql += `;\n\n`;
  sql += `-- Verify insert\n`;
  sql += `SELECT code, name, status FROM fee_schedules WHERE firm_id = '${firmId}' ORDER BY code;\n`;

  return sql;
}

const sql = generateSQL();
if (sql) {
  fs.writeFileSync('38_insert_all_real_fee_schedules.sql', sql);
  console.log('Generated 38_insert_all_real_fee_schedules.sql');
  console.log(sql);
}
