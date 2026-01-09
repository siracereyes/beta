
import { TARecord, MATATAGItem, TATarget } from "../types";

const BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGRxkahPOc_CiaRX6ZjXNPsREBUxUsJnhDwtTo8Z55gys2UikNMq4KPCmccnjUPyP_yj0d1AQzepFI/pub?output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; } 
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else { cell += char; }
  }
  result.push(cell.trim());
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

const getRows = async (url: string): Promise<string[]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    const csvText = await response.text();
    const rows: string[] = [];
    let currentRow = "";
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      if (char === '"') inQuotes = !inQuotes;
      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentRow.trim()) rows.push(currentRow);
        currentRow = "";
        if (char === '\r' && csvText[i+1] === '\n') i++;
      } else { currentRow += char; }
    }
    if (currentRow.trim()) rows.push(currentRow);
    return rows;
  } catch (e) {
    return [];
  }
};

export const fetchFTADData = async (): Promise<TARecord[]> => {
  try {
    const rows = await getRows(BASE_URL);
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const cells = parseCSVLine(rows[i]).map(c => c.toUpperCase());
      if (cells.includes("OFFICE") && (cells.some(c => c.includes("DIVISION")))) {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex === -1) return [];
    
    const rawHeaders = parseCSVLine(rows[headerRowIndex]);
    const normalizedHeaders = rawHeaders.map(h => h.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));
    const findIdx = (name: string) => {
      const search = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const idx = normalizedHeaders.indexOf(search);
      return idx !== -1 ? idx : normalizedHeaders.findIndex(h => h.includes(search));
    };

    const records: TARecord[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const v = parseCSVLine(rows[i]);
      if (v.length < 5) continue;
      const rawOfficeIdx = findIdx("OFFICE");
      const rawOffice = rawOfficeIdx !== -1 ? v[rawOfficeIdx] : "";
      if (!rawOffice || rawOffice.startsWith('●')) continue;

      const extractTargets = (): TATarget[] => {
        const targets: TATarget[] = [];
        for (let j = 1; j <= 5; j++) {
          let objIdx = findIdx(`OBJECTIVE${j}`);
          if (objIdx === -1) objIdx = findIdx(`TARGET${j}`);
          const obj = objIdx !== -1 ? v[objIdx] : "";
          if (obj) {
            targets.push({
              objective: obj,
              plannedAction: v[findIdx(`PLANNEDACTION${j}`)] || "",
              dueDate: v[findIdx(`TARGETDUEDATE${j}`)] || "",
              status: v[findIdx(`STATUSCOMPLETION${j}`)] || "",
              helpNeeded: v[findIdx(`TANEEDED${j}`)] || v[findIdx(`HELPNEEDED${j}`)] || "",
              agree: v[findIdx(`AGREE${j}`)] || "",
              specificOffice: v[findIdx(`SPECIFICOFFICE${j}`)] || "",
              tapDueDate: v[findIdx(`TAPDUEDATE${j}`)] || "",
              tapStatus: v[findIdx(`TAPSTATUS${j}`)] || ""
            });
          }
        }
        return targets;
      };

      records.push({
        id: `row-${i}`,
        office: rawOffice,
        district: v[findIdx("DISTRICT")] || "",
        divisionSchool: v[findIdx("DIVISIONSCHOOL")] || "",
        period: v[findIdx("PERIOD")] || "",
        taReceiver: v[findIdx("TARECEIVER")] || "",
        taProvider: v[findIdx("TAPROVIDER")] || "",
        access: [], equity: [], quality: [], resilience: [], enabling: [],
        reasons: [], targets: extractTargets(), agreements: [], receiverSignatories: [], providerSignatories: [],
        misc: { taName4: "", taPosition4: "", taSignature4: "", deptName5: "", deptPosition5: "", deptSignature5: "", taName5: "", taPosition5: "", taSignature5: "", deptTeamDate: "", taTeamDate: "" },
        raw: v
      });
    }
    return records;
  } catch (error) {
    return [];
  }
};
