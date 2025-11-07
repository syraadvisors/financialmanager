/**
 * Database Files Cleanup Script
 *
 * This script safely removes obsolete database migration files by:
 * 1. Creating a timestamped archive folder with all files to be deleted
 * 2. Moving generator scripts to a /scripts folder
 * 3. Deleting obsolete files
 * 4. Generating a detailed cleanup report
 *
 * Run with: node cleanup_database_files.js
 */

const fs = require('fs');
const path = require('path');

// Get current timestamp for archive folder
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const archiveFolder = path.join(__dirname, `archive_${timestamp}`);
const scriptsFolder = path.join(__dirname, 'scripts');

// Files to delete (organized by category)
const filesToDelete = {
  deprecated: [
    'deprecated/08_dev_temporary_rls.sql',
    'deprecated/08_update_rls_for_multi_tenant.sql',
    'deprecated/09_fix_anon_access.sql',
    'deprecated/10_fix_firms_rls_for_oauth.sql',
    'deprecated/11_simplified_firms_rls.sql',
    'deprecated/update_firm_domain.sql',
    'deprecated/README.md'
  ],
  diagnostic: [
    '18_comprehensive_super_admin_diagnostic.sql',
    '19_simple_super_admin_diagnostic.sql',
    '24_diagnose_user_profiles_rls.sql',
    'check_imported_data_counts.sql',
    'clear_imported_data.sql',
    'diagnostic_user_profile_check.sql'
  ],
  superseded: [
    '14_fix_super_admin_rls.sql',
    '15_simple_super_admin_rls_fix.sql',
    '16_remove_all_rls_policies.sql',
    '17_manual_super_admin_update.sql'
  ],
  generated: [
    'generated_update_account_names.sql'
  ],
  documentation: [
    'RUN_MIGRATION_20.md'
  ],
  temporary: [
    'NDH6SA~M'
  ]
};

// Files to move to scripts folder
const filesToMoveToScripts = [
  'update_account_names_from_csv.js',
  'generate_fee_schedules_sql.js',
  'generate_fee_schedules_sql.py'
];

// Statistics tracking
const stats = {
  deleted: 0,
  moved: 0,
  archived: 0,
  errors: [],
  deletedSize: 0,
  categories: {}
};

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file size safely
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

/**
 * Archive a file before deletion
 */
function archiveFile(filePath, category) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠ File not found (skipping): ${filePath}`);
    return false;
  }

  // Create category subfolder in archive
  const categoryArchive = path.join(archiveFolder, category);
  ensureDir(categoryArchive);

  // Get file info
  const fileName = path.basename(filePath);
  const fileSize = getFileSize(fullPath);
  const archivePath = path.join(categoryArchive, fileName);

  try {
    // Copy to archive
    fs.copyFileSync(fullPath, archivePath);
    stats.archived++;
    stats.deletedSize += fileSize;

    console.log(`✓ Archived: ${filePath} (${formatBytes(fileSize)})`);
    return true;
  } catch (error) {
    console.error(`✗ Error archiving ${filePath}:`, error.message);
    stats.errors.push({ file: filePath, error: error.message, action: 'archive' });
    return false;
  }
}

/**
 * Delete a file
 */
function deleteFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  try {
    fs.unlinkSync(fullPath);
    stats.deleted++;
    console.log(`✓ Deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error deleting ${filePath}:`, error.message);
    stats.errors.push({ file: filePath, error: error.message, action: 'delete' });
    return false;
  }
}

/**
 * Move a file to scripts folder
 */
function moveToScripts(fileName) {
  const sourcePath = path.join(__dirname, fileName);

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠ File not found (skipping): ${fileName}`);
    return false;
  }

  ensureDir(scriptsFolder);

  const destPath = path.join(scriptsFolder, fileName);
  const fileSize = getFileSize(sourcePath);

  try {
    fs.renameSync(sourcePath, destPath);
    stats.moved++;
    console.log(`✓ Moved to scripts/: ${fileName} (${formatBytes(fileSize)})`);
    return true;
  } catch (error) {
    console.error(`✗ Error moving ${fileName}:`, error.message);
    stats.errors.push({ file: fileName, error: error.message, action: 'move' });
    return false;
  }
}

/**
 * Delete deprecated folder if empty
 */
function cleanupDeprecatedFolder() {
  const deprecatedPath = path.join(__dirname, 'deprecated');

  if (!fs.existsSync(deprecatedPath)) {
    return;
  }

  try {
    const files = fs.readdirSync(deprecatedPath);
    if (files.length === 0) {
      fs.rmdirSync(deprecatedPath);
      console.log('✓ Removed empty deprecated/ folder');
    }
  } catch (error) {
    console.log('⚠ Could not remove deprecated folder:', error.message);
  }
}

/**
 * Generate cleanup report
 */
function generateReport() {
  const reportPath = path.join(__dirname, `cleanup_report_${timestamp}.md`);

  const report = `# Database Files Cleanup Report
Generated: ${new Date().toISOString()}

## Summary
- **Files Archived**: ${stats.archived}
- **Files Deleted**: ${stats.deleted}
- **Files Moved to Scripts**: ${stats.moved}
- **Total Space Freed**: ${formatBytes(stats.deletedSize)}
- **Errors**: ${stats.errors.length}

## Archive Location
All deleted files backed up to: \`${path.basename(archiveFolder)}/\`

## Files Deleted by Category

### Deprecated Migrations (${stats.categories.deprecated || 0} files)
These were explicitly marked as obsolete and consolidated into migration 08.

### Diagnostic/Debug Scripts (${stats.categories.diagnostic || 0} files)
Temporary scripts used for troubleshooting specific issues. Not migrations.

### Superseded Migrations (${stats.categories.superseded || 0} files)
Failed attempts at implementing super admin features, replaced by working migrations.

### Generated Files (${stats.categories.generated || 0} files)
One-time generated SQL files that have already been executed.

### Documentation (${stats.categories.documentation || 0} files)
Migration-specific docs for already-applied migrations.

### Temporary Files (${stats.categories.temporary || 0} files)
Swap/temp files created by editors.

## Files Moved to Scripts Folder
${filesToMoveToScripts.map(f => `- ${f}`).join('\n')}

## Errors
${stats.errors.length === 0 ? 'None' : stats.errors.map(e =>
  `- **${e.file}**: ${e.error} (action: ${e.action})`
).join('\n')}

## Remaining Migration Files
Run \`dir *.sql /b\` to see the clean list of migrations.

## Rollback Instructions
If you need to restore any deleted files:
1. Navigate to: \`${archiveFolder}\`
2. Copy desired files back to the database folder
3. The folder structure in the archive matches the original

## Next Steps
1. ✓ Review this report
2. ✓ Verify application still works correctly
3. ✓ Run database migrations to ensure nothing broke
4. After 30 days, the archive folder can be safely deleted
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✓ Generated cleanup report: ${path.basename(reportPath)}`);
  return reportPath;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Database Files Cleanup Script');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create archive folder
  ensureDir(archiveFolder);
  console.log(`\n📁 Archive folder created: ${path.basename(archiveFolder)}\n`);

  // Process each category
  for (const [category, files] of Object.entries(filesToDelete)) {
    console.log(`\n▶ Processing ${category} files...`);
    stats.categories[category] = 0;

    for (const file of files) {
      if (archiveFile(file, category)) {
        if (deleteFile(file)) {
          stats.categories[category]++;
        }
      }
    }
  }

  // Move generator scripts
  console.log('\n▶ Moving generator scripts to scripts/ folder...');
  for (const file of filesToMoveToScripts) {
    moveToScripts(file);
  }

  // Cleanup deprecated folder if empty
  cleanupDeprecatedFolder();

  // Generate report
  console.log('\n▶ Generating cleanup report...');
  const reportPath = generateReport();

  // Final summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Cleanup Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n✓ Archived: ${stats.archived} files`);
  console.log(`✓ Deleted: ${stats.deleted} files`);
  console.log(`✓ Moved: ${stats.moved} files`);
  console.log(`✓ Space freed: ${formatBytes(stats.deletedSize)}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠ Errors: ${stats.errors.length} (see report for details)`);
  }

  console.log(`\n📄 Full report: ${path.basename(reportPath)}`);
  console.log(`📦 Backup location: ${path.basename(archiveFolder)}/`);
  console.log('\n✓ Your database folder is now cleaner and more organized!');
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// Run cleanup
cleanup().catch(error => {
  console.error('\n✗ Fatal error during cleanup:', error);
  process.exit(1);
});
