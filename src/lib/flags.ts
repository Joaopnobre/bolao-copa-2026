const FLAGS: Record<string, string> = {
  // Grupo A
  "México": "🇲🇽",
  "Coreia do Sul": "🇰🇷",
  "República Tcheca": "🇨🇿",
  "África do Sul": "🇿🇦",
  // Grupo B
  "Canadá": "🇨🇦",
  "Bósnia": "🇧🇦",
  "Catar": "🇶🇦",
  "Suíça": "🇨🇭",
  // Grupo C
  "Brasil": "🇧🇷",
  "Marrocos": "🇲🇦",
  "Haiti": "🇭🇹",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  // Grupo D
  "Estados Unidos": "🇺🇸",
  "Paraguai": "🇵🇾",
  "Austrália": "🇦🇺",
  "Turquia": "🇹🇷",
  // Grupo E
  "Alemanha": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Costa do Marfim": "🇨🇮",
  "Equador": "🇪🇨",
  // Grupo F
  "Holanda": "🇳🇱",
  "Japão": "🇯🇵",
  "Suécia": "🇸🇪",
  "Tunísia": "🇹🇳",
  // Grupo G
  "Bélgica": "🇧🇪",
  "Egito": "🇪🇬",
  "Irã": "🇮🇷",
  "Nova Zelândia": "🇳🇿",
  // Grupo H
  "Espanha": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Arábia Saudita": "🇸🇦",
  "Uruguai": "🇺🇾",
  // Grupo I
  "França": "🇫🇷",
  "Senegal": "🇸🇳",
  "Iraque": "🇮🇶",
  "Noruega": "🇳🇴",
  // Grupo J
  "Argentina": "🇦🇷",
  "Argélia": "🇩🇿",
  "Áustria": "🇦🇹",
  "Jordânia": "🇯🇴",
  // Grupo K
  "Portugal": "🇵🇹",
  "Congo": "🇨🇩",
  "Uzbequistão": "🇺🇿",
  "Colômbia": "🇨🇴",
  // Grupo L
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croácia": "🇭🇷",
  "Gana": "🇬🇭",
  "Panamá": "🇵🇦",
};

export function getFlag(team: string): string {
  return FLAGS[team] ?? "🏳️";
}
