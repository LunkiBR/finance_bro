import { db } from "../db";
import { users, transactions } from "../db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
    console.log("--- Criando Usuária Teste: Nina ---");

    const username = "nina";
    const email = "nina@teste.com";
    const name = "Nina Teste";
    const password = "NinaPassword2026!"; // Senha segura para o teste

    try {
        let ninaUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
        let ninaId;

        if (ninaUser.length > 0) {
            console.log("Usuária Nina já existe. Limpando transações antigas...");
            ninaId = ninaUser[0].id;
            // Clear old transactions
            await db.delete(transactions).where(eq(transactions.userId, ninaId));
            // Update password just in case
            const passwordHash = await bcrypt.hash(password, 12);
            await db.update(users).set({ passwordHash }).where(eq(users.id, ninaId));
        } else {
            console.log("Criando nova usuária Nina...");
            const passwordHash = await bcrypt.hash(password, 12);
            const [newUser] = await db.insert(users).values({
                username,
                email,
                name,
                passwordHash,
                role: "user",
            }).returning();
            ninaId = newUser.id;
        }

        console.log(`Nina ID: ${ninaId}. Gerando transações...`);

        const data: any[] = [];
        
        const getRandomDate = (start: Date, end: Date) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };
        const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const getRandomAmount = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2);

        const periods = [
            { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-31T23:59:59Z'), month_str: 'jan/26' },
            { start: new Date('2026-02-01T00:00:00Z'), end: new Date('2026-02-28T23:59:59Z'), month_str: 'fev/26' },
            { start: new Date('2026-03-01T00:00:00Z'), end: new Date('2026-03-13T23:59:59Z'), month_str: 'mar/26' }
        ];

        // Bases da persona
        const moda = [
            { b: "Zara", cat: "Vestuário", min: 300, max: 800 },
            { b: "Farm Rio", cat: "Vestuário", min: 400, max: 1000 },
            { b: "Schutz", cat: "Vestuário", min: 300, max: 700 },
            { b: "NV by Nati Vozza", cat: "Vestuário", min: 500, max: 1200 },
            { b: "Amaro", cat: "Vestuário", min: 150, max: 400 },
            { b: "Renner", cat: "Vestuário", min: 100, max: 300 },
            { b: "Shein", cat: "Vestuário", min: 100, max: 300 },
            { b: "Arezzo", cat: "Vestuário", min: 200, max: 500 }
        ];

        const beleza = [
            { b: "Sephora", cat: "Saúde e Beleza", min: 200, max: 600 },
            { b: "MAC Cosmetics", cat: "Saúde e Beleza", min: 150, max: 450 },
            { b: "Espaçolaser", cat: "Saúde e Beleza", min: 100, max: 300 },
            { b: "Studio W", cat: "Saúde e Beleza", min: 300, max: 900 },
            { b: "Creamy Skincare", cat: "Saúde e Beleza", min: 100, max: 250 },
            { b: "Droga Raia", cat: "Saúde e Beleza", min: 50, max: 180 },
            { b: "Época Cosméticos", cat: "Saúde e Beleza", min: 150, max: 400 }
        ];

        const supermercado = [
            { b: "Pão de Açúcar", cat: "Mercado", min: 100, max: 450 },
            { b: "St. Marche", cat: "Mercado", min: 150, max: 550 },
            { b: "Oba Hortifruti", cat: "Mercado", min: 80, max: 250 },
            { b: "Carrefour", cat: "Mercado", min: 60, max: 350 },
            { b: "Oxxo", cat: "Mercado", min: 20, max: 80 },
            { b: "Eataly", cat: "Mercado", min: 120, max: 450 }
        ];

        const restaurantes = [
            { b: "iFood", cat: "Restaurante", min: 50, max: 180 },
            { b: "Rappi", cat: "Restaurante", min: 50, max: 180 },
            { b: "Bacio di Latte", cat: "Restaurante", min: 30, max: 80 },
            { b: "Starbucks", cat: "Restaurante", min: 30, max: 70 },
            { b: "Paris 6", cat: "Restaurante", min: 180, max: 400 },
            { b: "Outback", cat: "Restaurante", min: 150, max: 280 },
            { b: "Nattu Restaurante", cat: "Restaurante", min: 90, max: 220 },
            { b: "Z Deli", cat: "Restaurante", min: 90, max: 190 }
        ];

        const lazer = [
            { b: "Ingresse", cat: "Lazer", min: 150, max: 500 },
            { b: "Sympla", cat: "Lazer", min: 100, max: 350 },
            { b: "Eventim", cat: "Lazer", min: 200, max: 600 },
            { b: "Tatu Bola", cat: "Lazer", min: 100, max: 300 },
            { b: "Vila JK", cat: "Lazer", min: 200, max: 500 }
        ];

        const assinaturas = [
            { b: "Spotify", cat: "Assinaturas e Serviços", amount: 21.90 },
            { b: "Netflix", cat: "Assinaturas e Serviços", amount: 39.90 },
            { b: "Bodytech", cat: "Lazer", amount: 350.00 } // Academia em Lazer ou Saúde, melhor Lazer p/ manter simples
        ];

        const transporte = [
            { b: "Uber", cat: "Transporte", min: 15, max: 80 },
            { b: "99", cat: "Transporte", min: 15, max: 60 },
            { b: "Sem Parar", cat: "Transporte", min: 40, max: 120 },
            { b: "Veloe", cat: "Transporte", min: 40, max: 100 }
        ];

        const pixSaidas = [
            { b: "Thiago Martins", desc: "Pix Thiago Martins (Racha do churras/combo na balada)", cat: "Lazer", min: 100, max: 300 },
            { b: "Luiza Fernandes", desc: "Pix Luiza Fernandes (Vaquinha pro presente da amiga)", cat: "Presentes", min: 100, max: 250 },
            { b: "Gabriel Costa", desc: "Pix Gabriel Costa (Racha do Uber pós-festa)", cat: "Transporte", min: 20, max: 60 }
        ];

        const pixEntradas = [
            { b: "Carlos Eduardo", desc: "Pix Recebido - Carlos Eduardo (Mesada pai)", cat: "Mesada", amount: 10000 }, // R$ 10k mesada fits the profile
            { b: "Camila Rodrigues", desc: "Pix Recebido - Camila Rodrigues (Devolvendo iFood)", cat: "Restaurante", min: 50, max: 120 },
            { b: "Mariana Silva", desc: "Pix Recebido - Mariana Silva (Ingresso)", cat: "Lazer", min: 150, max: 400 }
        ];

        for (const period of periods) {
            // Entradas Fixas do mês (Mesada)
            const mesadaDate = getRandomDate(period.start, new Date(period.start.getTime() + 5 * 24 * 60 * 60 * 1000)); // Recebe nos primeiros 5 dias do mes
            data.push({
                userId: ninaId,
                date: mesadaDate.toISOString().split('T')[0],
                description: pixEntradas[0].desc,
                beneficiary: pixEntradas[0].b,
                category: pixEntradas[0].cat,
                type: "receita",
                amount: pixEntradas[0].amount!.toString(),
                source: "extrato_bancario",
                month: period.month_str,
                rawLine: `PIX RECEBIDO - MESADA PAI`
            });

            // Assinaturas mensais
            for (const sub of assinaturas) {
                const subDate = getRandomDate(period.start, period.end);
                data.push({
                    userId: ninaId,
                    date: subDate.toISOString().split('T')[0],
                    description: `Assinatura ${sub.b}`,
                    beneficiary: sub.b,
                    category: sub.cat,
                    type: "despesa",
                    amount: sub.amount!.toString(),
                    source: "nubank_cc",
                    month: period.month_str,
                    rawLine: `ASSINATURA DIGITAL COMPRA CC`
                });
            }

            // Despesas Váriaveis Mensais (40-60 compras por mês)
            const numTrans = Math.floor(Math.random() * 20) + 40; 
            for (let i = 0; i < numTrans; i++) {
                const tDate = getRandomDate(period.start, period.end);
                const r = Math.random();
                let item;
                let isReceita = false;

                if (r < 0.20) item = getRandomItem(moda); // 20%
                else if (r < 0.35) item = getRandomItem(beleza); // 15%
                else if (r < 0.45) item = getRandomItem(supermercado); // 10%
                else if (r < 0.70) item = getRandomItem(restaurantes); // 25%
                else if (r < 0.85) item = getRandomItem(lazer); // 15%
                else if (r < 0.95) item = getRandomItem(transporte); // 10%
                else if (r < 0.98) item = getRandomItem(pixSaidas); // 3%
                else {
                    item = getRandomItem(pixEntradas.slice(1)); // 2% 
                    isReceita = true;
                }

                const amt = (item as any).amount ? (item as any).amount.toString() : getRandomAmount((item as any).min!, (item as any).max!);
                const desc = (item as any).desc || `Compra ${item.b}`;

                data.push({
                    userId: ninaId,
                    date: tDate.toISOString().split('T')[0],
                    description: desc,
                    beneficiary: item.b,
                    category: item.cat,
                    type: isReceita ? "receita" : "despesa",
                    amount: amt,
                    source: "nubank_cc",
                    month: period.month_str,
                    rawLine: `PAGAMENTO ${desc.toUpperCase()}`
                });
            }
        }

        // Dividir em chunks (lotes) de 50 para o Drizzle insert
        const chunkSize = 50;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await db.insert(transactions).values(chunk);
        }

        console.log(`\n✅ Sucesso! Inseridas ${data.length} transações no banco de dados para Nina.`);
        console.log(`\n==============================================`);
        console.log(`  🎉 USUÁRIO DE APRESENTAÇÃO PRONTO 🎉  `);
        console.log(`----------------------------------------------`);
        console.log(`Login: ${email}`);
        console.log(`Senha: ${password}`);
        console.log(`URL  : https://finance.elytraai.com.br/`);
        console.log(`==============================================\n`);

    } catch (e) {
        console.error("Erro fatal na execução do seeder:", e);
    }
    process.exit(0);
}

main();
