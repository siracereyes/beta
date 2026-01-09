
// dataService.ts: Service for fetching TAP records with Cloud Status Overrides

import { TARecord, MATATAGItem, TATarget, TAAgreement, Signatory } from "../types";

const BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGRxkahPOc_CiaRX6ZjXNPsREBUxUsJnhDwtTo8Z55gys2UikNMq4KPCmccnjUPyP_yj0d1AQzepFI/pub?output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

const getRows = async (url: string): Promise<string[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Network response was not ok");
  const csvText = await response.text();
  const rows: string[] = [];
  let currentRow = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === '\n' && !inQuotes) {
      rows.push(currentRow);
      currentRow = "";
    } else {
      currentRow += char;
    }
  }
  if (currentRow) rows.push(currentRow);
  return rows;
};

// Fetch status overrides from our DB
async function fetchStatusOverrides(): Promise<any[]> {
  try {
    const res = await fetch('/api/data/get-overrides');
    if (!res.ok) return [];
    const data = await res.json();
    return data.overrides || [];
  } catch {
    return [];
  }
}

export const updateTAPStatus = async (params: {
  office: string;
  division: string;
  period: string;
  targetIndex: number;
  status: string;
  username: string;
}) => {
  const res = await fetch('/api/data/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to sync status.");
  }
  return await res.json();
};

export const fetchFTADData = async (): Promise<TARecord[]> => {
  try {
    const [rows, overrides] = await Promise.all([
      getRows(BASE_URL),
      // We'll create a simple getter API or just try/catch the request
      fetch('/api/data/get-overrides').then(r => r.json()).then(d => d.overrides).catch(() => [])
    ]);
    
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const cells = parseCSVLine(rows[i]).map(c => c.toUpperCase());
      if (cells.includes("OFFICE") && cells.includes("DIVISION/SCHOOL")) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) return [];

    const rawHeaders = parseCSVLine(rows[headerRowIndex]);
    const normalizedHeaders = rawHeaders.map(h => h.trim().toUpperCase().replace(/[\s_/]/g, ''));
    
    const findIdx = (name: string) => {
      const search = name.trim().toUpperCase().replace(/[\s_/]/g, '');
      return normalizedHeaders.indexOf(search);
    };

    const records: TARecord[] = [];
    
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const v = parseCSVLine(rows[i]);
      if (v.length < 5) continue;

      const rawOffice = v[findIdx("OFFICE")] || "";
      if (!rawOffice || rawOffice.startsWith('●')) continue;

      const divisionSchool = v[findIdx("DIVISION SCHOOL")] || "";
      const period = v[findIdx("PERIOD")] || "";

      const extractMATATAG = (prefix: string): MATATAGItem[] => {
        const items: MATATAGItem[] = [];
        for (let j = 1; j <= 5; j++) {
          const sIdx = findIdx(`${prefix}STATUS${j}`);
          const iIdx = findIdx(`${prefix}ISSUE${j}`);
          if (sIdx !== -1 && v[sIdx]) items.push({ status: v[sIdx], issue: v[iIdx] || "" });
        }
        return items;
      };

      const extractTargets = (): TATarget[] => {
        const targets: TATarget[] = [];
        for (let j = 1; j <= 5; j++) {
          let objIdx = findIdx(`OBJECT OF THE TARGET RECIPIENT ${j}`);
          if (objIdx === -1) {
            objIdx = findIdx(`OBJECTIVE OF THE TARGET ${j}`);
          }
          
          const obj = objIdx !== -1 ? v[objIdx] : "";
          
          if (obj) {
            // Find if there's a database override for this specific target
            const override = overrides?.find((o: any) => 
              o.office === rawOffice && 
              o.division === divisionSchool && 
              o.period === period && 
              o.target_index === (j - 1)
            );

            targets.push({
              objective: obj,
              plannedAction: v[findIdx(`PLANEED ACTION ${j}`)] || "",
              dueDate: v[findIdx(`TARGET DUE DATE ${j}`)] || "",
              status: v[findIdx(`STATUS COMPLETION ${j}`)] || "",
              helpNeeded: v[findIdx(`TA NEEDED HELP NEEDED ${j}`)] || v[findIdx(`TA NEEDED/HELP NEEDED ${j}`)] || "",
              agree: v[findIdx(`Agree${j}`)] || "",
              specificOffice: v[findIdx(`SpecificOffice${j}`)] || "",
              tapDueDate: v[findIdx(`TAPDueDate${j}`)] || "",
              tapStatus: override ? override.status : (v[findIdx(`TAPStatusCompletion${j}`)] || "")
            });
          }
        }
        return targets;
      };

      records.push({
        id: `row-${i}`,
        office: rawOffice,
        district: v[findIdx("DISTRICT")] || "",
        divisionSchool: divisionSchool,
        period: period,
        taReceiver: v[findIdx("TA RECEIVER")] || "",
        taProvider: v[findIdx("TA PROVIDER")] || "",
        access: extractMATATAG("ACCESS"),
        equity: extractMATATAG("EQUITY"),
        quality: extractMATATAG("QUALITY"),
        resilience: extractMATATAG("RESILIENCE"),
        enabling: extractMATATAG("ENABLING"),
        reasons: [v[findIdx("REASON 1")], v[findIdx("REASON 2")], v[findIdx("REASON 3")]].filter(Boolean),
        targets: extractTargets(), 
        agreements: [], // Redundant since integrated in targets now
        receiverSignatories: [], // Redundant logic cleanup
        providerSignatories: [], 
        misc: { 
          taName4: v[findIdx("ta name 4")] || "", 
          taPosition4: v[findIdx("ta position 4")] || "", 
          taSignature4: v[findIdx("ta signature 4")] || "", 
          deptName5: v[findIdx("dept name 5")] || "", 
          deptPosition5: v[findIdx("dept position 5")] || "", 
          deptSignature5: v[findIdx("dept signature 5")] || "",
          taName5: v[findIdx("ta name 5")] || "", 
          taPosition5: v[findIdx("ta position 5")] || "", 
          taSignature5: v[findIdx("ta signature 5")] || "",
          deptTeamDate: v[findIdx("dept team date")] || "", 
          taTeamDate: v[findIdx("ta team date")] || "" 
        },
        raw: v
      });
    }
    return records;
  } catch (error) {
    console.error("Fetch FTAD Data Error:", error);
    return [];
  }
};
