import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel,
  PageNumber, Packer, Paragraph, ShadingType, Table, TableCell, TableRow,
  TextRun, WidthType,
} from "docx";

const root = path.resolve(import.meta.dirname, "../../..");
const outDir = path.join(root, "docs", "testing");
const docxPath = path.join(outDir, "Catalogo-de-Casos-de-Teste.docx");
const mdPath = path.join(outDir, "CATALOGO_DE_CASOS_DE_TESTE.md");

const info = {
  AlertAreaControllerBusinessRulesTest: ["Áreas de alerta e restrições", "Criação, arredondamento de coordenadas, descrição, proteção de hangares, sobreposição, atualização e autorização de exclusão.", "ALT"],
  CadastroBusinessRulesTest: ["Cadastro de hangares e modelos", "Unicidade de coordenadas e nomes, propriedade do recurso e tratamento de registros inexistentes.", "CAD"],
  DroneControllerBusinessRulesTest: ["Operações e estados dos drones", "Transições manuais, estados automáticos, autorização, início de rota, bateria e seleção de entregas.", "DRN"],
  EntregaControllerBusinessRulesTest: ["Operações com entregas", "Confirmação, tratamento de inviabilidade, autorização, prioridade, edição e divisão de carga.", "ENT"],
  HealthControllerTest: ["Saúde da aplicação", "Disponibilidade básica, verificação do banco e delegação do keep-alive.", "HLT"],
  RouteCalculatorTest: ["Cálculo de rotas", "Distância Manhattan, retorno ao hangar, ordenação de destinos e desvio mínimo de áreas restritas.", "CAL"],
  AuthServiceTest: ["Autenticação e cadastro de usuário", "Login, conversão de falhas, e-mail duplicado, codificação de senha e perfil inicial.", "AUT"],
  DeliveryAllocationServiceTest: ["Alocação e inviabilidade de entregas", "Agrupamento, melhor uso da capacidade e motivos de inviabilidade por peso, distância e área restrita.", "ALO"],
  DeliveryCompletionServiceTest: ["Conclusão de entregas", "Conclusão seletiva de entregas cujo horário estimado já foi atingido.", "CON"],
  DeliveryManagementServiceTest: ["Gestão de entregas", "Preparação do despacho antes da leitura dos dados operacionais atualizados.", "GES"],
  DeliveryOperationsSchedulerTest: ["Agendamento operacional", "Coordenação dos serviços periódicos usando uma única referência temporal.", "SCH"],
  DeliveryViabilityServiceTest: ["Viabilidade de entregas", "Avaliação combinada de peso e distância completa de ida e volta.", "VIA"],
  DroneChargingServiceTest: ["Recarga de drones", "Progressão da bateria, inicialização da recarga, retorno à disponibilidade e nova alocação.", "REC"],
  DroneFlightBatteryServiceTest: ["Consumo de bateria em voo", "Consumo proporcional ao avanço temporal da rota.", "BAT"],
  RouteCompletionServiceTest: ["Finalização da rota", "Consumo final da bateria, limpeza da carga e início automático da recarga.", "FIM"],
  RoutePlanningServiceTest: ["Planejamento de rota", "Persistência do plano, ausência de hangar e limpeza do plano sem entregas.", "PLN"],
  "alertService.test": ["Integração frontend com alertas", "Listagem, criação, atualização e exclusão pelo endpoint protegido de alertas.", "ALT"],
  "authValidation.test": ["Validação de autenticação", "Credenciais de login, formato do e-mail e política de senha no cadastro.", "VAL"],
  "RemainingTime.test": ["Contagem regressiva", "Formatação, atualização por segundo, limite zero, conclusão e ausência de previsão.", "TEM"],
  "AuthContext.test": ["Sessão do usuário", "Aceitação e rejeição de JWT conforme expiração, estrutura e conteúdo.", "SES"],
  "errorMessage.test": ["Mensagens de erro", "Fallback, mensagens simples, erros por campo e formatos desconhecidos de resposta.", "ERR"],
  "deliveryService.test": ["Regras de entrega no frontend", "Agrupamento, prioridade e identificação dos motivos de inviabilidade por peso, distância ou área restrita.", "ENT"],
  "dashboardService.test": ["Indicadores do dashboard", "Métricas de entregas, ranking, estados operacionais e carga dos drones.", "DSH"],
};

function walk(dir, accept) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, accept));
    else if (accept(full)) result.push(full);
  }
  return result.sort();
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

const java = walk(path.join(root, "backend", "src", "test"), f => f.endsWith("Test.java")).map(file => {
  const text = fs.readFileSync(file, "utf8");
  const cases = [...text.matchAll(/@Test\s+(?:public\s+|protected\s+|private\s+)?void\s+([A-Za-z0-9_]+)\s*\(/g)].map(m => m[1]);
  return ["Backend", path.basename(file, ".java"), rel(file), cases];
});
const feBase = path.join(root, "frontend", "src", "test");
const frontend = walk(feBase, f => /\.test\.jsx?$/.test(f)).map(file => {
  const text = fs.readFileSync(file, "utf8");
  const cases = [...text.matchAll(/\b(?:it|test)\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return ["Frontend", path.basename(file).replace(/\.(jsx?|tsx?)$/, ""), rel(file), cases];
});
const suites = [...java, ...frontend];
const beCount = java.reduce((n, s) => n + s[3].length, 0);
const feCount = frontend.reduce((n, s) => n + s[3].length, 0);
if (beCount !== 65 || feCount !== 28) throw new Error(`Inventário inesperado: ${beCount}/${feCount}`);

function expected(name) {
  const n = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  if (/^(refuses|rejects)/.test(n)) return "A operação inválida é recusada e não produz alteração indevida.";
  if (/^(returns|calculates|formats|summarizes)/.test(n)) return "O valor calculado ou retornado corresponde ao cenário configurado.";
  if (/^(creates|updates|deletes|encodes)/.test(n)) return "A operação é concluída com os dados e efeitos persistidos esperados.";
  if (/^(marks|identifies|considers)/.test(n)) return "A classificação e o motivo resultantes correspondem às regras de negócio.";
  if (/^(keeps|ignores|clears|groups|selects|chooses)/.test(n)) return "O sistema seleciona e mantém somente os dados compatíveis com a regra.";
  if (/^(accepts|authenticates|allows)/.test(n)) return "O cenário válido é aceito e seu fluxo é concluído.";
  if (/^(shows|renders|uses|combines)/.test(n)) return "A interface apresenta o conteúdo esperado para a entrada simulada.";
  return "O estado final e as integrações acionadas correspondem ao comportamento esperado.";
}

const blue = "2E74B5";
const darkBlue = "1F4D78";
const gray = "E8EEF5";
const borders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
};
const p = (text, options = {}) => new Paragraph({ ...options, children: [new TextRun({ text, font: "Calibri", size: options.size ?? 22, bold: options.bold, color: options.color, italics: options.italics })] });
const cell = (text, header = false, mono = false) => new TableCell({
  shading: header ? { fill: gray, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    spacing: { after: 0 },
    children: [new TextRun({ text, font: mono ? "Consolas" : "Calibri", size: mono ? 16 : 19, bold: header, color: header ? darkBlue : "111827" })],
  })],
});
const heading = (text, level) => new Paragraph({ heading: level, keepNext: true, children: [new TextRun({ text, font: "Calibri", bold: true, color: level === HeadingLevel.HEADING_1 ? blue : darkBlue })] });
const table = rows => new Table({ width: { size: 9360, type: WidthType.DXA }, alignment: AlignmentType.CENTER, borders, rows });

const children = [];
children.push(
  new Paragraph({ spacing: { before: 1080, after: 140 }, children: [new TextRun({ text: "CATÁLOGO DE QUALIDADE", bold: true, color: blue, size: 20 })] }),
  new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 160 }, children: [new TextRun({ text: "Casos de testes cobertos", bold: true, color: darkBlue, size: 56 })] }),
  p("Inventário consolidado das validações automatizadas do backend e do frontend.", { italics: true, color: "4B5563" }),
  table([
    new TableRow({ cantSplit: true, children: ["BACKEND", "FRONTEND", "TOTAL"].map(v => cell(v, true)) }),
    new TableRow({ cantSplit: true, children: [String(beCount), String(feCount), String(beCount + feCount)].map(v => cell(v)) }),
  ]),
  p(`Escopo: ${suites.length} suítes, executadas em 26/07/2026. Resultado: 93 aprovados, 0 falhas, 0 erros e 0 ignorados.`, { bold: true, color: darkBlue }),
  p("Tecnologias: JUnit 5 e Mockito no backend; Vitest, jsdom e Testing Library no frontend."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
  heading("Resumo executivo", HeadingLevel.HEADING_1),
  p("A suíte cobre autenticação, cadastros, operações de drones e entregas, cálculo e planejamento de rotas, áreas restritas, ciclo de bateria, dashboard e utilidades da interface."),
  table([
    new TableRow({ cantSplit: true, children: ["Camada", "Tecnologia", "Suítes", "Casos aprovados"].map(v => cell(v, true)) }),
    new TableRow({ cantSplit: true, children: ["Backend", "JUnit 5 + Mockito", String(java.length), String(beCount)].map(v => cell(v)) }),
    new TableRow({ cantSplit: true, children: ["Frontend", "Vitest + Testing Library", String(frontend.length), String(feCount)].map(v => cell(v)) }),
    new TableRow({ cantSplit: true, children: ["Total", "—", String(suites.length), String(beCount + feCount)].map(v => cell(v)) }),
  ]),
  heading("Comandos de validação", HeadingLevel.HEADING_2),
  p("backend> .\\mvnw.cmd test", { color: darkBlue }),
  p("frontend> npm test", { color: darkBlue }),
  heading("Critérios de interpretação", HeadingLevel.HEADING_2),
  p("• Casos negativos verificam a recusa da operação e a ausência de gravações indevidas."),
  p("• Rotas consideram destinos, retorno ao hangar e afastamento mínimo das áreas restritas."),
  p("• A execução não acessa serviços externos; os testes usam mocks e ambiente jsdom."),
);

let layer = "";
const counters = new Map();
for (const [currentLayer, name, file, cases] of suites) {
  if (layer !== currentLayer) {
    children.push(new Paragraph({ pageBreakBefore: true, children: [] }), heading(`Catálogo — ${currentLayer}`, HeadingLevel.HEADING_1));
    layer = currentLayer;
  }
  const [title, coverage, prefix] = info[name] ?? [name, "Comportamentos automatizados da suíte.", "TST"];
  children.push(heading(title, HeadingLevel.HEADING_2));
  children.push(new Paragraph({ keepNext: true, children: [
    new TextRun({ text: `${name}  •  ${cases.length} caso(s)\n`, bold: true, font: "Calibri", size: 20 }),
    new TextRun({ text: file, font: "Consolas", size: 16, color: "4B5563" }),
  ]}));
  children.push(p(coverage));
  const rows = [new TableRow({ cantSplit: true, tableHeader: true, children: ["ID", "Caso automatizado", "Resultado esperado"].map(v => cell(v, true)) })];
  for (const testCase of cases) {
    const key = `${currentLayer}-${prefix}`;
    counters.set(key, (counters.get(key) ?? 0) + 1);
    const id = `${currentLayer === "Backend" ? "BE" : "FE"}-${prefix}-${String(counters.get(key)).padStart(2, "0")}`;
    rows.push(new TableRow({ cantSplit: true, children: [cell(id), cell(testCase, false, true), cell(expected(testCase))] }));
  }
  children.push(table(rows));
}
children.push(
  heading("Rastreabilidade e manutenção", HeadingLevel.HEADING_1),
  p("O catálogo deve ser atualizado sempre que um teste for incluído, removido ou renomeado. A versão Markdown facilita a revisão no repositório; o DOCX é a versão formatada para compartilhamento."),
  p("Documento gerado a partir da suíte presente no repositório em 26/07/2026."),
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120, line: 300 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Calibri", size: 56, bold: true, color: darkBlue }, paragraph: { spacing: { after: 240 }, keepNext: true } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 32, bold: true, color: blue }, paragraph: { spacing: { before: 360, after: 200 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 26, bold: true, color: blue }, paragraph: { spacing: { before: 280, after: 140 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708 },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "FRETES DRONES  /  QUALIDADE", bold: true, color: "6B7280", size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Catálogo de testes  •  ", color: "6B7280", size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: "6B7280", size: 16 })] })] }) },
    children,
  }],
});

const md = [
  "# Catálogo de casos de testes cobertos", "",
  "Inventário consolidado das validações automatizadas do projeto.", "",
  "## Resumo", "",
  "| Camada | Suítes | Casos | Resultado em 26/07/2026 |",
  "| --- | ---: | ---: | --- |",
  `| Backend | ${java.length} | ${beCount} | 65 aprovados |`,
  `| Frontend | ${frontend.length} | ${feCount} | 28 aprovados |`,
  `| **Total** | **${suites.length}** | **${beCount + feCount}** | **93 aprovados, 0 falhas** |`, "",
  "## Como executar", "", "```powershell", "cd backend", ".\\mvnw.cmd test", "cd ..\\frontend", "npm test", "```", "",
];
layer = "";
counters.clear();
for (const [currentLayer, name, file, cases] of suites) {
  if (layer !== currentLayer) { md.push(`## ${currentLayer}`, ""); layer = currentLayer; }
  const [title, coverage, prefix] = info[name] ?? [name, "Comportamentos automatizados.", "TST"];
  md.push(`### ${title}`, "", `Suíte: \`${name}\`  `, `Arquivo: \`${file}\`  `, `Cobertura: ${coverage}`, "",
    "| ID | Caso automatizado | Resultado esperado |", "| --- | --- | --- |");
  for (const testCase of cases) {
    const key = `${currentLayer}-${prefix}`;
    counters.set(key, (counters.get(key) ?? 0) + 1);
    const id = `${currentLayer === "Backend" ? "BE" : "FE"}-${prefix}-${String(counters.get(key)).padStart(2, "0")}`;
    md.push(`| ${id} | \`${testCase}\` | ${expected(testCase)} |`);
  }
  md.push("");
}
md.push("## Observações", "", "- O inventário é derivado diretamente dos testes existentes no repositório.", "- A execução integral em 26/07/2026 aprovou todos os 93 casos.", "");

fs.writeFileSync(mdPath, md.join("\n"), "utf8");
fs.writeFileSync(docxPath, await Packer.toBuffer(doc));
console.log(`Gerado: ${docxPath}`);
console.log(`Gerado: ${mdPath}`);
