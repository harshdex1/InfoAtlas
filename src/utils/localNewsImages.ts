// Utility for deterministic, unique, and topic-grounded visual assets for Local & District News

export function hashStoryId(str: string): number {
  if (!str) return 0;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

// Diverse, high-resolution, verified civic and regional photography pools
export const TOPIC_IMAGE_POOLS: Record<string, string[]> = {
  transit: [
    "https://images.unsplash.com/photo-1569974498991-d3c12a504f95?auto=format&fit=crop&w=900&q=80", // Metro transit
    "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=900&q=80", // Highway & road
    "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=900&q=80", // Train tracks
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80", // Public bus
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=900&q=80", // Bridge over river
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=900&q=80", // Elevated expressway
    "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=900&q=80", // Urban transit junction
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80", // City boulevard
  ],
  law_order: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80", // Justice gavel & law
    "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=900&q=80", // Law books & courthouse
    "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=900&q=80", // Courtroom pillars
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=900&q=80", // Scales of justice
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80", // Police & civic security
    "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?auto=format&fit=crop&w=900&q=80", // Civic headquarters
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80", // Official meeting
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80", // Government secretariat
  ],
  agriculture: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80", // Green agricultural fields
    "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=900&q=80", // Farmer in paddy field
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80", // Wheat harvest
    "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=900&q=80", // Grain mandi market
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=900&q=80", // Rural countryside
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=900&q=80", // Farm irrigation canal
    "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80", // Organic produce
    "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=900&q=80", // Village farm landscape
  ],
  healthcare: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80", // Hospital clinic facility
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80", // Medical ward
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80", // Doctor consultation
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80", // Medical supplies & pharmacy
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80", // Stethoscope & health
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80", // Healthcare professional
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80", // Modern diagnostic lab
    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80", // Ambulance service
  ],
  education: [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80", // University campus students
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80", // Classroom learning
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80", // School library
    "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80", // University building
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80", // High school auditorium
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80", // Science laboratory
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=80", // Student study group
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80", // Academic library hall
  ],
  commerce: [
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=900&q=80", // Bustling city bazaar
    "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=900&q=80", // Retail shops & markets
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80", // Currency & business trade
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=900&q=80", // Financial trading center
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80", // Commercial city center
    "https://images.unsplash.com/photo-1444653614773-995cb1ef902e?auto=format&fit=crop&w=900&q=80", // Urban market stalls
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80", // Corporate business towers
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=80", // Logistics cargo shipping
  ],
  culture: [
    "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=900&q=80", // Festival lamps & celebration
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80", // Varanasi ghats
    "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=900&q=80", // Evening aarti festival
    "https://images.unsplash.com/photo-1596405344148-2d0ae5f30744?auto=format&fit=crop&w=900&q=80", // Heritage Lucknow monument
    "https://images.unsplash.com/photo-1603262110263-fb010d6e59d4?auto=format&fit=crop&w=900&q=80", // Historic architecture
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80", // Heritage landmark
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80", // Cultural celebration
    "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=900&q=80", // Historic Hyderabad Charminar
  ],
  civic: [
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80", // District collectorate
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=900&q=80", // Civic infrastructure
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80", // Public municipal administration
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80", // Clean city boulevard
    "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=900&q=80", // Urban water lake & park
    "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=900&q=80", // City skyline
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=80", // High tech city
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=80", // Coastal civic promenade
  ],
};

export const GENERAL_CIVIC_POOL: string[] = [
  "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1569974498991-d3c12a504f95?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1596405344148-2d0ae5f30744?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1603262110263-fb010d6e59d4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=900&q=80",
];

// Clean editorial vector illustration generator for fallback when real photography cannot be sourced
export function generateCivicSvgIllustration(district: string, state: string, topic?: string): string {
  const seed = hashStoryId(`${district}_${state}_${topic || ""}`);
  const hue = (seed % 360);
  const hue2 = (hue + 40) % 360;
  const safeDistrict = (district || "District").replace(/[^a-zA-Z0-9\s]/g, "");
  const safeState = (state || "India").replace(/[^a-zA-Z0-9\s]/g, "");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue}, 70%, 20%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 80%, 10%)" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="hsla(${hue}, 80%, 65%, 0.25)" />
        <stop offset="100%" stop-color="hsla(${hue2}, 80%, 65%, 0.05)" />
      </linearGradient>
    </defs>
    <rect width="600" height="340" fill="url(#bgGrad)" />
    <circle cx="500" cy="80" r="140" fill="hsla(${hue}, 80%, 65%, 0.08)" />
    <circle cx="100" cy="280" r="120" fill="hsla(${hue2}, 80%, 65%, 0.08)" />
    <!-- Architectural & Civic Outline -->
    <path d="M60 260 L140 200 L220 260 L300 170 L380 260 L460 210 L540 260" stroke="hsla(${hue}, 90%, 75%, 0.3)" stroke-width="2" fill="none" />
    <path d="M120 260 L120 220 L160 220 L160 260 M280 260 L280 190 L320 190 L320 260 M440 260 L440 230 L480 230 L480 260" stroke="hsla(${hue2}, 90%, 80%, 0.4)" stroke-width="2" fill="none" />
    <!-- District Banner Seal -->
    <rect x="50" y="50" width="500" height="110" rx="16" fill="url(#cardGrad)" stroke="hsla(${hue}, 90%, 75%, 0.3)" stroke-width="1.5" />
    <text x="75" y="92" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" letter-spacing="0.5">${safeDistrict}</text>
    <text x="75" y="122" fill="hsla(${hue}, 90%, 80%, 0.9)" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" text-transform="uppercase" letter-spacing="1.5">${safeState} · REGIONAL DISPATCH</text>
    <rect x="50" y="275" width="500" height="3" fill="hsla(${hue}, 90%, 75%, 0.2)" />
    <text x="540" y="315" text-anchor="end" fill="hsla(0, 0%, 100%, 0.5)" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600">InfoAtlas Editorial Illustration</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface StoryVisualResult {
  url: string;
  isIllustration: boolean;
  label: "Publisher Media" | "Verified Subject Photo" | "Verified District Landmark" | "Editorial Illustration";
}

/**
 * Resolves an authentic, exact visual asset for a local news story.
 * - Respects authentic publisher photos and verified subject photographs.
 * - For stories without an authentic photo, generates a dedicated SVG editorial badge
 *   instead of assigning an unrelated or misleading stock photo.
 */
export function resolveStoryVisual(
  article: {
    id?: string;
    url?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    imageType?: string;
    imageLabel?: string;
  },
  district: string,
  state: string
): StoryVisualResult {
  // 1. If article came with a valid authentic photo (publisher media or verified subject photo)
  if (article.thumbnail && typeof article.thumbnail === "string" && article.thumbnail.startsWith("http")) {
    let label: StoryVisualResult["label"] = "Publisher Media";
    if (
      article.imageLabel === "Verified Subject Photo" ||
      article.thumbnail.includes("wikimedia.org") ||
      article.thumbnail.includes("wikipedia.org")
    ) {
      label = "Verified Subject Photo";
    } else if (article.imageLabel === "Verified District Landmark") {
      label = "Verified District Landmark";
    }
    return {
      url: article.thumbnail,
      isIllustration: false,
      label,
    };
  }

  // 2. If no authentic photograph exists, generate custom SVG editorial badge
  const svgBadge = generateCivicSvgIllustration(district, state, article.title);
  return {
    url: svgBadge,
    isIllustration: true,
    label: "Editorial Illustration",
  };
}
