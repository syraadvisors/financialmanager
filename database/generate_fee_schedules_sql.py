import json
import re

# Read the TypeScript file
with open('src/data/feeSchedulesData.ts', 'r') as f:
    content = f.read()

# Extract the array content
# This is a simplified parser - assumes the structure matches what we saw
schedules = []

# Find all fee schedule objects
pattern = r'\{[^}]*id:\s*[\'"]([^\'"]+)[\'"][^}]*\}'
matches = re.finditer(pattern, content, re.DOTALL)

firm_id = 'dc838876-888c-4cce-b37d-f055f40fcb0c'

# This is complex - let's manually create the SQL from the data we read
print("-- Insert all 50 fee schedules from React app into database")
print(f"-- Firm ID: {firm_id}")
print()
print("-- First, drop NOT NULL constraint on old columns")
print("ALTER TABLE fee_schedules ALTER COLUMN schedule_name DROP NOT NULL;")
print()
print("-- Insert fee schedules")
print("INSERT INTO fee_schedules (")
print("  firm_id, code, name, status, structure_type, tiers,")
print("  flat_rate, flat_fee_per_quarter, has_minimum_fee, minimum_fee_per_year,")
print("  description, is_direct_bill, schedule_name, schedule_status")
print(") VALUES")

# We'll need to manually process this
print("-- NOTE: This script needs to be completed by parsing the TypeScript file")
print("-- Run the node script instead to generate proper SQL")
