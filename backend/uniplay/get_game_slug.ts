// Mapping dari product name ke game slug untuk username validation API
// API dari: https://api.isan.eu.org/nickname/{slug}

export function getGameSlugFromProductName(productName: string): { slug: string; requiresServer: boolean } | null {
  const name = productName.toLowerCase();

  // Mobile Legends variants
  if (name.includes("mobile legends")) {
    return { slug: "ml", requiresServer: true };
  }

  // Free Fire variants
  if (name.includes("free fire")) {
    return { slug: "ff", requiresServer: false };
  }

  // Genshin Impact
  if (name.includes("genshin")) {
    return { slug: "gi", requiresServer: false };
  }

  // Valorant
  if (name.includes("valorant")) {
    return { slug: "valo", requiresServer: false };
  }

  // Call of Duty Mobile
  if (name.includes("call of duty") || name.includes("codm")) {
    return { slug: "codm", requiresServer: false };
  }

  // Arena of Valor
  if (name.includes("arena of valor") || name.includes("aov")) {
    return { slug: "aov", requiresServer: false };
  }

  // PUBG Mobile
  if (name.includes("pubg mobile") || name.includes("pubgm")) {
    return { slug: "pubgm", requiresServer: false };
  }

  // Honkai: Star Rail
  if (name.includes("honkai") && name.includes("star rail")) {
    return { slug: "hsr", requiresServer: false };
  }

  // Zenless Zone Zero
  if (name.includes("zenless")) {
    return { slug: "zzz", requiresServer: false };
  }

  // Point Blank
  if (name.includes("point blank")) {
    return { slug: "pb", requiresServer: false };
  }

  // LifeAfter
  if (name.includes("lifeafter")) {
    return { slug: "la", requiresServer: true };
  }

  // Punishing: Gray Raven
  if (name.includes("punishing") || name.includes("gray raven")) {
    return { slug: "pgr", requiresServer: true };
  }

  // Honkai Impact 3rd
  if (name.includes("honkai impact")) {
    return { slug: "hi", requiresServer: false };
  }

  // Magic Chess
  if (name.includes("magic chess")) {
    return { slug: "mcgg", requiresServer: false };
  }

  // Sausage Man
  if (name.includes("sausage man")) {
    return { slug: "sm", requiresServer: false };
  }

  // Super Sus
  if (name.includes("super sus")) {
    return { slug: "sus", requiresServer: false };
  }

  // Love and Deepspace
  if (name.includes("love and deepspace") || name.includes("deepspace")) {
    return { slug: "ld", requiresServer: false };
  }

  // Game tidak didukung untuk username validation
  return null;
}
