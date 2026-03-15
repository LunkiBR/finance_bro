// Test Excel → CSV conversion for all bank Excel fixtures
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const FIXTURES = path.join(__dirname);

function excelToCSV(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet], { FS: ";" });
}

const testFiles = [
  "santander_conta_test.xlsx",
  "btg_conta_test.xlsx",
  "xp_cc_test.xlsx",
  "bb_cc_test.xlsx",
  "bb_conta_test.xlsx",
];

let allPassed = true;

for (const file of testFiles) {
  const filePath = path.join(FIXTURES, file);
  try {
    const csv = excelToCSV(filePath);
    const lines = csv.split("\n").filter(l => l.trim());
    console.log(`✓ ${file}: ${lines.length} rows`);
    console.log("  Header:", lines[0]);
    console.log("  Row 1: ", lines[1]);
    console.log();
  } catch (e) {
    console.error(`✗ ${file}: ${e.message}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log("=== All Excel tests passed! ===");
} else {
  process.exit(1);
}
