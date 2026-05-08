import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

function buildPrisma() {
  if (isPostgres) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as any);
  } else {
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url: dbUrl });
    return new PrismaClient({ adapter } as any);
  }
}

const prisma = buildPrisma();

// Match phases as string constants (SQLite doesn't have enums)
const MatchPhase = {
  GROUP: "GROUP",
  ROUND_OF_16: "ROUND_OF_16",
  QUARTER_FINAL: "QUARTER_FINAL",
  SEMI_FINAL: "SEMI_FINAL",
  THIRD_PLACE: "THIRD_PLACE",
  FINAL: "FINAL",
} as const;

// Converte texto com acentos em slug ASCII seguro para URLs e IDs
function slugify(text: string): string {
  return text
    .normalize("NFD")                    // decompõe acentos: "é" → "e" + combining accent
    .replace(/[̀-ͯ]/g, "")     // remove os combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")         // qualquer não-alfanumérico vira "-"
    .replace(/^-|-$/g, "");              // remove hífens nas pontas
}

// Copa do Mundo 2026 - dates from spreadsheet (Excel serial date 46184 = June 11, 2026)
// Excel date 46184 = 2026-06-11
function excelDate(serial: number, timeStr: string): Date {
  // Excel epoch: Jan 0, 1900 (but with leap year bug, so Jan 1, 1900 = 1)
  const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  const [hours, minutes] = timeStr.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const matches = [
  // === GRUPO A ===
  { homeTeam: "México", awayTeam: "África do Sul", groupName: "A", round: 1, excelDay: 46184, time: "16:00" },
  { homeTeam: "Coreia do Sul", awayTeam: "República Tcheca", groupName: "A", round: 1, excelDay: 46184, time: "23:00" },
  { homeTeam: "República Tcheca", awayTeam: "África do Sul", groupName: "A", round: 2, excelDay: 46191, time: "13:00" },
  { homeTeam: "México", awayTeam: "Coreia do Sul", groupName: "A", round: 2, excelDay: 46191, time: "22:00" },
  { homeTeam: "África do Sul", awayTeam: "Coreia do Sul", groupName: "A", round: 3, excelDay: 46197, time: "22:00" },
  { homeTeam: "República Tcheca", awayTeam: "México", groupName: "A", round: 3, excelDay: 46197, time: "22:00" },
  // === GRUPO B ===
  { homeTeam: "Canadá", awayTeam: "Bósnia", groupName: "B", round: 1, excelDay: 46185, time: "16:00" },
  { homeTeam: "Catar", awayTeam: "Suíça", groupName: "B", round: 1, excelDay: 46186, time: "16:00" },
  { homeTeam: "Suíça", awayTeam: "Bósnia", groupName: "B", round: 2, excelDay: 46191, time: "16:00" },
  { homeTeam: "Canadá", awayTeam: "Catar", groupName: "B", round: 2, excelDay: 46191, time: "19:00" },
  { homeTeam: "Suíça", awayTeam: "Canadá", groupName: "B", round: 3, excelDay: 46197, time: "16:00" },
  { homeTeam: "Bósnia", awayTeam: "Catar", groupName: "B", round: 3, excelDay: 46197, time: "16:00" },
  // === GRUPO C ===
  { homeTeam: "Brasil", awayTeam: "Marrocos", groupName: "C", round: 1, excelDay: 46186, time: "19:00" },
  { homeTeam: "Haiti", awayTeam: "Escócia", groupName: "C", round: 1, excelDay: 46186, time: "22:00" },
  { homeTeam: "Escócia", awayTeam: "Marrocos", groupName: "C", round: 2, excelDay: 46192, time: "19:00" },
  { homeTeam: "Brasil", awayTeam: "Haiti", groupName: "C", round: 2, excelDay: 46192, time: "21:30" },
  { homeTeam: "Marrocos", awayTeam: "Haiti", groupName: "C", round: 3, excelDay: 46197, time: "19:00" },
  { homeTeam: "Escócia", awayTeam: "Brasil", groupName: "C", round: 3, excelDay: 46197, time: "19:00" },
  // === GRUPO D ===
  { homeTeam: "Estados Unidos", awayTeam: "Paraguai", groupName: "D", round: 1, excelDay: 46185, time: "22:00" },
  { homeTeam: "Austrália", awayTeam: "Turquia", groupName: "D", round: 1, excelDay: 46187, time: "01:00" },
  { homeTeam: "Estados Unidos", awayTeam: "Austrália", groupName: "D", round: 2, excelDay: 46192, time: "16:00" },
  { homeTeam: "Turquia", awayTeam: "Paraguai", groupName: "D", round: 2, excelDay: 46193, time: "01:00" },
  { homeTeam: "Turquia", awayTeam: "Estados Unidos", groupName: "D", round: 3, excelDay: 46198, time: "23:00" },
  { homeTeam: "Paraguai", awayTeam: "Austrália", groupName: "D", round: 3, excelDay: 46198, time: "23:00" },
  // === GRUPO E ===
  { homeTeam: "Alemanha", awayTeam: "Curaçao", groupName: "E", round: 1, excelDay: 46187, time: "14:00" },
  { homeTeam: "Costa do Marfim", awayTeam: "Equador", groupName: "E", round: 1, excelDay: 46187, time: "20:00" },
  { homeTeam: "Alemanha", awayTeam: "Costa do Marfim", groupName: "E", round: 2, excelDay: 46193, time: "17:00" },
  { homeTeam: "Equador", awayTeam: "Curaçao", groupName: "E", round: 2, excelDay: 46193, time: "21:00" },
  { homeTeam: "Equador", awayTeam: "Alemanha", groupName: "E", round: 3, excelDay: 46198, time: "17:00" },
  { homeTeam: "Curaçao", awayTeam: "Costa do Marfim", groupName: "E", round: 3, excelDay: 46198, time: "17:00" },
  // === GRUPO F ===
  { homeTeam: "Holanda", awayTeam: "Japão", groupName: "F", round: 1, excelDay: 46187, time: "17:00" },
  { homeTeam: "Suécia", awayTeam: "Tunísia", groupName: "F", round: 1, excelDay: 46187, time: "23:00" },
  { homeTeam: "Holanda", awayTeam: "Suécia", groupName: "F", round: 2, excelDay: 46193, time: "14:00" },
  { homeTeam: "Tunísia", awayTeam: "Japão", groupName: "F", round: 2, excelDay: 46194, time: "01:00" },
  { homeTeam: "Tunísia", awayTeam: "Holanda", groupName: "F", round: 3, excelDay: 46198, time: "20:00" },
  { homeTeam: "Japão", awayTeam: "Suécia", groupName: "F", round: 3, excelDay: 46198, time: "20:00" },
  // === GRUPO G ===
  { homeTeam: "Bélgica", awayTeam: "Egito", groupName: "G", round: 1, excelDay: 46188, time: "16:00" },
  { homeTeam: "Irã", awayTeam: "Nova Zelândia", groupName: "G", round: 1, excelDay: 46188, time: "22:00" },
  { homeTeam: "Bélgica", awayTeam: "Irã", groupName: "G", round: 2, excelDay: 46194, time: "16:00" },
  { homeTeam: "Nova Zelândia", awayTeam: "Egito", groupName: "G", round: 2, excelDay: 46194, time: "22:00" },
  { homeTeam: "Egito", awayTeam: "Irã", groupName: "G", round: 3, excelDay: 46200, time: "00:00" },
  { homeTeam: "Nova Zelândia", awayTeam: "Bélgica", groupName: "G", round: 3, excelDay: 46200, time: "00:00" },
  // === GRUPO H ===
  { homeTeam: "Espanha", awayTeam: "Cabo Verde", groupName: "H", round: 1, excelDay: 46188, time: "13:00" },
  { homeTeam: "Arábia Saudita", awayTeam: "Uruguai", groupName: "H", round: 1, excelDay: 46188, time: "19:00" },
  { homeTeam: "Espanha", awayTeam: "Arábia Saudita", groupName: "H", round: 2, excelDay: 46194, time: "13:00" },
  { homeTeam: "Uruguai", awayTeam: "Cabo Verde", groupName: "H", round: 2, excelDay: 46194, time: "19:00" },
  { homeTeam: "Cabo Verde", awayTeam: "Arábia Saudita", groupName: "H", round: 3, excelDay: 46199, time: "21:00" },
  { homeTeam: "Uruguai", awayTeam: "Espanha", groupName: "H", round: 3, excelDay: 46199, time: "21:00" },
  // === GRUPO I ===
  { homeTeam: "França", awayTeam: "Senegal", groupName: "I", round: 1, excelDay: 46189, time: "16:00" },
  { homeTeam: "Iraque", awayTeam: "Noruega", groupName: "I", round: 1, excelDay: 46189, time: "19:00" },
  { homeTeam: "França", awayTeam: "Iraque", groupName: "I", round: 2, excelDay: 46195, time: "18:00" },
  { homeTeam: "Noruega", awayTeam: "Senegal", groupName: "I", round: 2, excelDay: 46195, time: "21:00" },
  { homeTeam: "Senegal", awayTeam: "Iraque", groupName: "I", round: 3, excelDay: 46199, time: "16:00" },
  { homeTeam: "Noruega", awayTeam: "França", groupName: "I", round: 3, excelDay: 46199, time: "16:00" },
  // === GRUPO J ===
  { homeTeam: "Argentina", awayTeam: "Argélia", groupName: "J", round: 1, excelDay: 46189, time: "22:00" },
  { homeTeam: "Áustria", awayTeam: "Jordânia", groupName: "J", round: 1, excelDay: 46190, time: "01:00" },
  { homeTeam: "Argentina", awayTeam: "Áustria", groupName: "J", round: 2, excelDay: 46195, time: "14:00" },
  { homeTeam: "Jordânia", awayTeam: "Argélia", groupName: "J", round: 2, excelDay: 46196, time: "00:00" },
  { homeTeam: "Jordânia", awayTeam: "Argentina", groupName: "J", round: 3, excelDay: 46200, time: "23:00" },
  { homeTeam: "Argélia", awayTeam: "Áustria", groupName: "J", round: 3, excelDay: 46200, time: "23:00" },
  // === GRUPO K ===
  { homeTeam: "Portugal", awayTeam: "Congo", groupName: "K", round: 1, excelDay: 46190, time: "14:00" },
  { homeTeam: "Uzbequistão", awayTeam: "Colômbia", groupName: "K", round: 1, excelDay: 46190, time: "23:00" },
  { homeTeam: "Portugal", awayTeam: "Uzbequistão", groupName: "K", round: 2, excelDay: 46196, time: "14:00" },
  { homeTeam: "Colômbia", awayTeam: "Congo", groupName: "K", round: 2, excelDay: 46196, time: "23:00" },
  { homeTeam: "Congo", awayTeam: "Uzbequistão", groupName: "K", round: 3, excelDay: 46200, time: "20:30" },
  { homeTeam: "Colômbia", awayTeam: "Portugal", groupName: "K", round: 3, excelDay: 46200, time: "20:30" },
  // === GRUPO L ===
  { homeTeam: "Inglaterra", awayTeam: "Croácia", groupName: "L", round: 1, excelDay: 46190, time: "17:00" },
  { homeTeam: "Gana", awayTeam: "Panamá", groupName: "L", round: 1, excelDay: 46190, time: "20:00" },
  { homeTeam: "Inglaterra", awayTeam: "Gana", groupName: "L", round: 2, excelDay: 46196, time: "17:00" },
  { homeTeam: "Panamá", awayTeam: "Croácia", groupName: "L", round: 2, excelDay: 46196, time: "20:00" },
  { homeTeam: "Croácia", awayTeam: "Gana", groupName: "L", round: 3, excelDay: 46200, time: "18:00" },
  { homeTeam: "Panamá", awayTeam: "Inglaterra", groupName: "L", round: 3, excelDay: 46200, time: "18:00" },
];

// Knockout stage - teams TBD
const knockoutMatches = [
  // Round of 16 (16 avos)
  { homeTeam: "1º E", awayTeam: "3º ABCDF", phase: MatchPhase.ROUND_OF_16, excelDay: 46202, time: "17:30", sortOrder: 100 },
  { homeTeam: "1º I", awayTeam: "3º CDFGH", phase: MatchPhase.ROUND_OF_16, excelDay: 46203, time: "18:00", sortOrder: 101 },
  { homeTeam: "2º A", awayTeam: "2º B", phase: MatchPhase.ROUND_OF_16, excelDay: 46201, time: "16:00", sortOrder: 102 },
  { homeTeam: "1º F", awayTeam: "2º C", phase: MatchPhase.ROUND_OF_16, excelDay: 46202, time: "22:00", sortOrder: 103 },
  { homeTeam: "2º K", awayTeam: "2º L", phase: MatchPhase.ROUND_OF_16, excelDay: 46205, time: "20:00", sortOrder: 104 },
  { homeTeam: "1º H", awayTeam: "2º J", phase: MatchPhase.ROUND_OF_16, excelDay: 46205, time: "16:00", sortOrder: 105 },
  { homeTeam: "1º D", awayTeam: "3º BEFIJ", phase: MatchPhase.ROUND_OF_16, excelDay: 46204, time: "21:00", sortOrder: 106 },
  { homeTeam: "1º G", awayTeam: "3º AEHIJ", phase: MatchPhase.ROUND_OF_16, excelDay: 46204, time: "17:00", sortOrder: 107 },
  { homeTeam: "1º C", awayTeam: "2º F", phase: MatchPhase.ROUND_OF_16, excelDay: 46202, time: "14:00", sortOrder: 108 },
  { homeTeam: "2º E", awayTeam: "2º I", phase: MatchPhase.ROUND_OF_16, excelDay: 46203, time: "14:00", sortOrder: 109 },
  { homeTeam: "1º A", awayTeam: "3º CEFHI", phase: MatchPhase.ROUND_OF_16, excelDay: 46203, time: "22:00", sortOrder: 110 },
  { homeTeam: "1º L", awayTeam: "3º EHIJK", phase: MatchPhase.ROUND_OF_16, excelDay: 46204, time: "13:00", sortOrder: 111 },
  { homeTeam: "1º J", awayTeam: "2º H", phase: MatchPhase.ROUND_OF_16, excelDay: 46206, time: "19:00", sortOrder: 112 },
  { homeTeam: "2º D", awayTeam: "2º G", phase: MatchPhase.ROUND_OF_16, excelDay: 46206, time: "15:00", sortOrder: 113 },
  { homeTeam: "1º B", awayTeam: "3º EFGIJ", phase: MatchPhase.ROUND_OF_16, excelDay: 46206, time: "00:00", sortOrder: 114 },
  { homeTeam: "1º K", awayTeam: "3º DEIJL", phase: MatchPhase.ROUND_OF_16, excelDay: 46206, time: "22:30", sortOrder: 115 },
  // Quarter-finals
  { homeTeam: "Jogo 51", awayTeam: "Jogo 52", phase: MatchPhase.QUARTER_FINAL, excelDay: 46207, time: "18:00", sortOrder: 200 },
  { homeTeam: "Jogo 53", awayTeam: "Jogo 54", phase: MatchPhase.QUARTER_FINAL, excelDay: 46207, time: "14:00", sortOrder: 201 },
  { homeTeam: "Jogo 55", awayTeam: "Jogo 56", phase: MatchPhase.QUARTER_FINAL, excelDay: 46208, time: "17:00", sortOrder: 202 },
  { homeTeam: "Jogo 57", awayTeam: "Jogo 58", phase: MatchPhase.QUARTER_FINAL, excelDay: 46208, time: "21:00", sortOrder: 203 },
  { homeTeam: "Jogo 59", awayTeam: "Jogo 60", phase: MatchPhase.QUARTER_FINAL, excelDay: 46209, time: "16:00", sortOrder: 204 },
  { homeTeam: "Jogo 61", awayTeam: "Jogo 62", phase: MatchPhase.QUARTER_FINAL, excelDay: 46209, time: "21:00", sortOrder: 205 },
  { homeTeam: "Jogo 63", awayTeam: "Jogo 64", phase: MatchPhase.QUARTER_FINAL, excelDay: 46210, time: "13:00", sortOrder: 206 },
  { homeTeam: "Jogo 65", awayTeam: "Jogo 66", phase: MatchPhase.QUARTER_FINAL, excelDay: 46210, time: "17:00", sortOrder: 207 },
  // Semi-finals
  { homeTeam: "Vencedor QF1", awayTeam: "Vencedor QF2", phase: MatchPhase.SEMI_FINAL, excelDay: 46212, time: "17:00", sortOrder: 300 },
  { homeTeam: "Vencedor QF3", awayTeam: "Vencedor QF4", phase: MatchPhase.SEMI_FINAL, excelDay: 46213, time: "16:00", sortOrder: 301 },
  { homeTeam: "Vencedor QF5", awayTeam: "Vencedor QF6", phase: MatchPhase.SEMI_FINAL, excelDay: 46214, time: "18:00", sortOrder: 302 },
  { homeTeam: "Vencedor QF7", awayTeam: "Vencedor QF8", phase: MatchPhase.SEMI_FINAL, excelDay: 46214, time: "22:00", sortOrder: 303 },
  // Third place
  { homeTeam: "Perdedor SF1", awayTeam: "Perdedor SF2", phase: MatchPhase.THIRD_PLACE, excelDay: 46221, time: "18:00", sortOrder: 400 },
  { homeTeam: "Perdedor SF3", awayTeam: "Perdedor SF4", phase: MatchPhase.THIRD_PLACE, excelDay: 46221, time: "18:00", sortOrder: 401 },
  // Final
  { homeTeam: "Vencedor SF1", awayTeam: "Vencedor SF2", phase: MatchPhase.FINAL, excelDay: 46222, time: "16:00", sortOrder: 500 },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("bolinha", 12);
  await prisma.user.upsert({
    where: { username: "bolao" },
    update: {},
    create: {
      name: "Administrador",
      username: "bolao",
      email: "admin@bolao.local",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Usuário admin criado: bolao / bolinha");

  // Create matches
  let sortOrder = 0;
  for (const m of matches) {
    const matchDate = excelDate(m.excelDay, m.time);
    const matchId = `grp-${slugify(m.groupName)}-${slugify(m.homeTeam)}-vs-${slugify(m.awayTeam)}`;
    await prisma.match.upsert({
      where: { id: matchId },
      update: { matchDate },
      create: {
        id: matchId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchDate,
        phase: MatchPhase.GROUP,
        groupName: m.groupName,
        round: m.round,
        status: "UPCOMING",
        sortOrder: sortOrder++,
      },
    });
  }
  console.log(`✅ ${matches.length} jogos da fase de grupos criados`);

  for (const m of knockoutMatches) {
    const matchDate = excelDate(m.excelDay, m.time);
    const safeId = `ko-${slugify(m.phase)}-${slugify(m.homeTeam)}-vs-${slugify(m.awayTeam)}`;
    await prisma.match.upsert({
      where: { id: safeId },
      update: { matchDate },
      create: {
        id: safeId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchDate,
        phase: m.phase,
        status: "UPCOMING",
        sortOrder: m.sortOrder,
      },
    });
  }
  console.log(`✅ ${knockoutMatches.length} jogos do mata-mata criados`);

  // Default rules content
  await prisma.rule.upsert({
    where: { key: "main" },
    update: {},
    create: {
      key: "main",
      content: `# Regras do Bolão Copa do Mundo 2026

## Participação
- O bolão é privado. Apenas usuários convidados pelo administrador podem participar.
- Cada participante deve registrar seus palpites antes do horário de bloqueio.

## Palpites
- Palpites podem ser feitos para todos os jogos, campeão da Copa e artilheiro.
- Os palpites são bloqueados **1 hora antes** do horário oficial de cada partida.
- Palpites de **Campeão** e **Artilheiro** são bloqueados 1 hora antes do jogo de abertura.
- Após o bloqueio, nenhum palpite pode ser criado, editado ou excluído.

## Visibilidade dos Palpites
- Antes do bloqueio: cada participante vê apenas os próprios palpites.
- Após o bloqueio: os palpites ficam visíveis para todos os participantes.

## Pontuação Base
| Acerto | Pontos |
|--------|--------|
| Placar exato | 10 pts |
| Apenas vencedor ou empate | 5 pts |
| Campeão da Copa | 15 pts |
| Artilheiro da Copa | 15 pts |

## Sistema de Odds
- Quanto mais pessoas fizerem o mesmo palpite, menor a pontuação recebida.
- A pontuação **nunca** cai abaixo de **50%** do valor base.
- Pontuação mínima: placar exato ≥ 5 pts, vencedor ≥ 2,5 pts, campeão ≥ 7,5 pts, artilheiro ≥ 7,5 pts.
- Um placar exato **sempre** vale mais do que apenas acertar o vencedor.

## Critério de Desempate
Em caso de empate na pontuação total, vence quem tiver maior número de **placares exatos** acertados.

## Fase Mata-Mata
- Os confrontos do mata-mata são cadastrados manualmente pelo administrador.
- Todas as regras de palpites, bloqueio e pontuação se aplicam normalmente.`,
    },
  });
  console.log("✅ Regras padrão criadas");

  console.log("\n🏆 Seed concluído com sucesso!");
  console.log("📋 Credenciais admin: username=bolao | senha=bolinha");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
