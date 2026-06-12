/**
 * State-specific tribunal + consumer-protection contacts for all 8 Australian
 * states/territories. Single source of truth — used by the TribunalExport
 * component and the dispute-package PDF so a VIC homeowner never gets handed
 * NCAT's phone number.
 */

export interface TribunalInfo {
    name: string;
    phone: string;
    fairTrading: string;
    ftPhone: string;
    insurance: string;
    insPhone: string;
}

export const TRIBUNAL_INFO: Record<string, TribunalInfo> = {
    NSW: { name: "NCAT (NSW Civil & Administrative Tribunal)", phone: "1300 006 228", fairTrading: "NSW Fair Trading", ftPhone: "13 32 20", insurance: "HBCF Claims", insPhone: "1800 110 877" },
    VIC: { name: "VCAT (Victorian Civil & Administrative Tribunal)", phone: "1300 018 228", fairTrading: "Consumer Affairs Victoria", ftPhone: "1300 558 181", insurance: "VMIA Domestic Building", insPhone: "1800 623 694" },
    QLD: { name: "QCAT (Queensland Civil & Administrative Tribunal)", phone: "1300 753 228", fairTrading: "Office of Fair Trading QLD", ftPhone: "13 74 68", insurance: "QBCC Insurance", insPhone: "139 333" },
    WA: { name: "SAT (State Administrative Tribunal)", phone: "1300 306 017", fairTrading: "Consumer Protection WA", ftPhone: "1300 304 054", insurance: "Building Commission WA", insPhone: "1300 489 099" },
    SA: { name: "SACAT (SA Civil & Administrative Tribunal)", phone: "1800 723 767", fairTrading: "Consumer & Business Services SA", ftPhone: "131 882", insurance: "SA Building Insurance", insPhone: "131 882" },
    TAS: { name: "Magistrates Court (Civil Division)", phone: "1300 664 608", fairTrading: "Consumer Affairs Tasmania", ftPhone: "1300 654 499", insurance: "TAS Building Insurance", insPhone: "1300 654 499" },
    ACT: { name: "ACAT (ACT Civil & Administrative Tribunal)", phone: "(02) 6207 1740", fairTrading: "Access Canberra", ftPhone: "13 22 81", insurance: "ACT Building Insurance", insPhone: "13 22 81" },
    NT: { name: "NT Civil & Administrative Tribunal", phone: "1800 019 319", fairTrading: "NT Consumer Affairs", ftPhone: "1800 019 319", insurance: "NT Building Insurance", insPhone: "1800 019 319" },
};

export function getTribunalInfo(stateCode?: string | null): TribunalInfo {
    return TRIBUNAL_INFO[(stateCode || "").toUpperCase()] || TRIBUNAL_INFO.NSW;
}
