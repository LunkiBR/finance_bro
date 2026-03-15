const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const FIXTURES = __dirname;

function excelToCSV(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const csvComma = XLSX.utils.sheet_to_csv(sheet, { FS: "," });
  const headerComma = csvComma.split("\n")[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isCommaBankFormat =
    /^data,depend/.test(headerComma) ||
    /^data da compra,/.test(headerComma);
  return isCommaBankFormat ? csvComma : XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
}

const tests = [
  { file: "bb_conta_test.xlsx", expectedSep: ",", label: "BB Conta" },
  { file: "bb_cc_test.xlsx", expectedSep: ",", label: "BB CC" },
  { file: "santander_conta_test.xlsx", expectedSep: ";", label: "Santander Conta" },
  { file: "btg_conta_test.xlsx", expectedSep: ";", label: "BTG Conta" },
  { file: "xp_cc_test.xlsx", expectedSep: ";", label: "XP CC" },
];

let allPassed = true;
for (const t of tests) {
  const buf = fs.readFileSync(path.join(FIXTURES, t.file));
  const csv = excelToCSV(buf);
  const header = csv.split("\n")[0];
  // Check that the expected separator appears in the header (between fields)
  const usesExpectedSep = header.includes(t.expectedSep);
  const icon = usesExpectedSep ? "✓" : "✗";
  const sep = usesExpectedSep ? t.expectedSep : (t.expectedSep === "," ? ";" : ",");
  console.log(icon + " " + t.label + " (sep='" + sep + "'): " + header);
  if (!usesExpectedSep) allPassed = false;
}

console.log(allPassed ? "\nAll separator detection tests passed!" : "\nSome tests FAILED!");
if (!allPassed) process.exit(1);
