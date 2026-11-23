const fs = require("fs")
const p = "src/screens/trip/TripInProgressScreen.tsx"
const raw = fs.readFileSync(p, "utf8")
const crlf = raw.includes("\r\n")
let c = raw.replace(/\r\n/g, "\n")
const reA = /  const handlePrimaryAction = \(\) => \{\n[\s\S]*?\n  \};\n\n/
const reB = /  const handleSimulatePriceChange = \(\) => \{\n[\s\S]*?\n  \};\n\n/
const nA = (c.match(new RegExp(reA.source, "g")) || []).length
const nB = (c.match(new RegExp(reB.source, "g")) || []).length
console.log("handlePrimaryAction -> " + nA + "x ; handleSimulatePriceChange -> " + nB + "x")
if (nA !== 1 || nB !== 1) { console.error("ABORTADO. Nada foi escrito."); process.exit(1) }
c = c.replace(reA, "").replace(reB, "")
fs.writeFileSync(p, crlf ? c.replace(/\n/g, "\r\n") : c, "utf8")
console.log("OK")
