import { zValidator } from '@hono/zod-validator';
import {
	isCPF,
	SchemaCNPJ,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaDateString,
	SchemaModality,
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core';
import { format } from 'date-fns';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import type { Server } from '@/@types/server';
import { documentByCNPJ } from '@/functions/document/by-cnpj';
import { documentByCPF } from '@/functions/document/by-cpf';

const AI_BASE_URL = process.env.AI_BASE_URL as string;
const AI_MODEL = process.env.AI_MODEL as string;
const AI_API_KEY = process.env.AI_API_KEY as string;

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

const clientOpenAI = new OpenAI({
	baseURL: AI_BASE_URL,
	apiKey: AI_API_KEY,
	timeout: REQUEST_TIMEOUT_MS,
});

const SchemaDataExtract = z
	.object({
		latestProposal: z
			.string('Código da proposta anterior inválido')
			.min(1, 'Código da proposta anterior inválido')
			.toLowerCase()
			.nullish(),
		renewal: z.boolean('Status de renovação inválido'),
		modality: SchemaModality,
		insuranceCompany: z
			.object({
				id: z.uuidv7('ID da seguradora inválida'),
				name: SchemaName,
				cnpj: SchemaCNPJ,
			})
			.strict(),
		insured: z
			.object({
				name: SchemaName,
				registration: SchemaCPFOrCNPJ,
				phone: SchemaPhone,
				birth: SchemaDateString.nullish(),
				profession: z.string().nullish(),
			})
			.strict(),
		vehicle: z
			.object({
				plate: SchemaPlate,
				model: z.string(),
				year: z.number(),
				usage: SchemaVehicleUsage,
				overnightStayPostalCode: SchemaPostalCode,
				driver: z
					.object({
						name: SchemaName,
						cpf: SchemaCPF,
						birth: SchemaDateString.nullish(),
					})
					.strict()
					.nullish(),
			})
			.strict(),
		effectivedAt: SchemaDateString.nullish(),
		requestedAt: SchemaDateString,
		expirationAt: SchemaDateString,
		award: z.number(),
		installments: z.number(),
		franchise: z.number(),
	})
	.strict();

type DataExtract = z.infer<typeof SchemaDataExtract>;

async function extractTextToPDF(buffer: ArrayBuffer): Promise<string> {
	const parser = new PDFParse({ data: Buffer.from(buffer) });

	const result = await parser.getText();

	const text = result.text;

	if (text.length === 0) {
		throw new Error(
			'PDF não retornou texto extraível — pode ser um scan/imagem. Necessário OCR.',
		);
	}

	return text;
}

function sanitizeText(text: string): string {
	return (
		text
			// biome-ignore lint/suspicious/noControlCharactersInRegex: regex
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
	);
}

function chunkText(text: string, maxChars = 24_000): string {
	const clean = sanitizeText(text);

	if (clean.length <= maxChars) {
		return clean;
	}

	return clean.slice(0, maxChars);
}

function mountPrompt(
	text: string,
	{
		database: { insuranceCompanies },
	}: {
		database: {
			insuranceCompanies: Array<{
				id: string;
				name: string;
			}>;
		};
	},
): string {
	return `Extraia os seguintes dados do texto abaixo, extraído de um PDF.

		Responda APENAS com um objeto JSON no formato exato abaixo, sem texto adicional, sem markdown, sem \`\`\`:

		{
			"latestProposal": "string ou null, identificação da proposta anterior, é o código da proposta anterior caso seja renovação"
			"renewal": "boolean, informação se a proposta ou apólice é uma renovação ou um seguro novo. Baseado se tem uma apólice anterior ou não"
			"modality": "string, tipo de seguro, enum (vehicle, motorcycle, truck, health, residence, business, condominium, travel, professional, construction)",
			"insuranceCompany": {
				"id": "string, uuid da seguradora no banco de dados informado em 'Dados do meu banco de dados / Seguradoras'"
				"name": "string, nome da seguradora no banco de dados informado em 'Dados do meu banco de dados / Seguradoras'",
				"cnpj": "string, cnpj da seguradora"
			},
			"insured": {
				"name": "string, nome do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"registration": "string, cpf ou cnpj do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"phone": "string, celular do (proponente / segurado), cuidado para não ser o telefone fixo",
				"birth": "string no formato DD/MM/AAAA ou null, data de nascimento do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"profession": "string ou null"
			},
			"vehicle": {
				"plate": "string, placa do veículo",
				"model": "string, modelo do veículo",
				"year": "number, ano do modelo do veículo",
				"usage": "string, uso do veículo, enum (leisure_and_work, leisure, client_supplier_visits, app_based_transport, taxi, public_transportation, delivieries, tourism)",
				"overnightStayPostalCode": "string, cep de pernoite do veículo",
				"driver": {
					"name": "string, nome do principal condutor",
					"cpf": "string, cpf do principal condutor",
					"birth": "string no formato DD/MM/AAAA ou null, data de nascimento do principal condutor",
				} | null
			} | null | somente se for seguro veícular ou seguto automóvel de carro, moto ou caminhão,
			"effectivedAt": "string no formato DD/MM/AAAA, data da efetivação da apólice, esse campo pode retornar null quando é proposta, somente retornar a data quando for apólice",
			"requestedAt": "string no formato DD/MM/AAAA, data de início da vigência da proposta ou apólice",
			"expirationAt": "string no formato DD/MM/AAAA, data do final da vigência da proposta ou apólice",
			"award": "number, valor da proposta ou apólice, pode estar como (prêmio líquido, valor líquido ou líquido) mas sempre "líquido", veja que em alguns casos existe o prêmio total ou prêmio líquido total, mas não é esse, é exatamente o prêmio líquido, não o total. Normalmente é o valor do prêmio sem impostos ou juro",
			"installments": "number, número de parcelas que será paga a apólice ou proposta",
			"franchise": "number, valor da frânquia da apólice ou proposta"
		}

		Regras:
		- Se algum campo não for encontrado, use null.
		- Todo resultado que é especificado como tipo "number" deve ser um número puro (ex: 1500.50), nunca string.
		- Não invente dados que não estão no texto.
		- Nenhum campo pode ter mais de um dado, é sempre um único dado, nunca dois dados no mesmo campo separado por "ou", ",", ou algum outro tipo de separador
		- Na utilização do veículo que for particular, considerar como lazer e ida e volta ao trabalho
		- O valor da frânquia nunca pode somar de outros serviços, o valor deve ser sempre somente da frânquia base do seguro, e nunca somar nada
		- O ID e o Nome da seguradora você vai ver os dados em 'Dados do meu banco de dados / Seguradoras' pra popular esses parâmetros do "insuranceCompany" baseado no meu banco de dados 

		Informações adicionais:
		- Em alguns caso o CEP de Pernoite pode está cortado no conteúdo, pode estar com 5 digitos e o restante cortado, aí para situações assim deve verificar o cep do segurado e esse cep de pernoite para ver se são semelhantes ou não, caso seja semelhante com os mesmo 5 dígitos iniciais iguais, considerar que é o mesmo do seguro. Caso não considere o CEP de Pernoite com os 5 dígitos, e adicione no final dele "000"
		- Existe algumas seguradoras que são do mesmo grupo, a onde é referenciado o CNPJ do grupo, mas a proposta pode ser de outras segurada, então veja realmente qual é a segurada quando for nesses casos não pelo rodapé, mas sim pelo cabeçalho ou conteúdo interno como site ou nome do tipo de seguro, pode conseguir achar como em algum lugar "NOME DA SEGURADO seguro (auto, residencial, residencia, etc...)"
		- Quando identificar como seguradora yellum, verifica se tem em algum lugar como aliro seguro, pois pode ser que seja da aliro e não da yellum pois são do mesmo grupo, mas marcas diferentes que respondem pelo mesmo grupo, então informe seguradora como aliro
		- Quando identificar como seguradora porto, verifica se tem em algum lugar como azul seguro, pois pode ser que seja da azul e não da porto pois são do mesmo grupo, mas marcas diferentes que respondem pelo mesmo grupo, então informe seguradora como azul

		Dados do meu banco de dados:
		- Seguradoras:
			${JSON.stringify(insuranceCompanies)}

		Texto do documento:
		"""
		${text}
		"""
	`;
}

async function extractToAI(
	text: string,
	insuranceCompanies: Array<{
		id: string;
		name: string;
	}>,
): Promise<DataExtract> {
	const textChunk = chunkText(text);

	let lastError: unknown;

	for (let retry = 1; retry <= MAX_RETRIES; retry++) {
		try {
			const content = mountPrompt(textChunk, {
				database: { insuranceCompanies },
			});

			const response = await clientOpenAI.chat.completions.create({
				model: AI_MODEL,
				max_completion_tokens: 4096,
				messages: [
					{
						role: 'system',
						content:
							'Você é um extrator de dados cirúrgico e preciso. Responda APENAS com um objeto JSON válido que segue exatamente o schema pedido, sem markdown, sem texto fora do JSON.',
					},
					{
						role: 'user',
						content,
					},
				],
			});

			const textResult = response.choices[0]?.message.content;

			if (!textResult) {
				throw new Error('Modelo retornou resposta vazia.');
			}

			const jsonClear = textResult
				.trim()
				.replace(/^```json\s*/i, '')
				.replace(/^```\s*/i, '')
				.replace(/```\s*$/i, '');

			const parsed = JSON.parse(jsonClear);

			const valid = SchemaDataExtract.parse(parsed);

			const [isBirthInsured, isBirthDriver, insuredIsTheDriver] = [
				!!valid.insured.birth,
				!!valid.vehicle.driver?.birth,
				valid.insured.registration === valid.vehicle.driver?.cpf,
			];

			const responseValid = valid;

			if (!isBirthInsured || !isBirthDriver) {
				if (!isBirthInsured) {
					let document = null;

					if (isCPF(valid.insured.registration)) {
						document = await documentByCPF(valid.insured.registration);
					} else {
						document = await documentByCNPJ(valid.insured.registration);
					}

					const birth = document.birth;

					responseValid.insured.birth = format(birth, 'dd/MM/yyyy');
				}

				if (!isBirthInsured && !insuredIsTheDriver) {
					let document = null;

					if (isCPF(valid.vehicle.driver?.cpf ?? '')) {
						document = await documentByCPF(valid.vehicle.driver?.cpf ?? '');
					} else {
						document = await documentByCNPJ(valid.vehicle.driver?.cpf ?? '');
					}

					const birth = document.birth;

					if (responseValid.vehicle.driver) {
						responseValid.vehicle.driver.birth = format(birth, 'dd/MM/yyyy');
					}
				} else {
					if (responseValid.vehicle.driver) {
						responseValid.vehicle.driver.birth = responseValid.insured.birth;
					}
				}
			}

			return responseValid;
		} catch (error) {
			console.error(error);
			lastError = error;

			const _reason =
				error instanceof z.ZodError
					? JSON.stringify(error.issues)
					: String(error);

			if (retry < MAX_RETRIES) {
				await new Promise((r) => setTimeout(r, 1000 * retry));
			}
		}
	}

	throw new Error(
		`Falha ao extrair dados válidos após ${MAX_RETRIES} tentativas. Último erro: ${lastError}`,
	);
}

async function extractData(
	path: ArrayBuffer,
	insuranceCompanies: Array<{
		id: string;
		name: string;
	}>,
) {
	const textToPDF = await extractTextToPDF(path);

	const data = await extractToAI(textToPDF, insuranceCompanies);

	return data;
}

function registerRoutersServicesSafesExtractPDF(server: Server) {
	server.post(
		'/extract-pdf',
		zValidator(
			'form',
			z.object({
				file: z.file('Arquivo inválido'),
			}),
		),
		async (ctx) => {
			try {
				const { file } = ctx.req.valid('form');

				const buffer = await file.arrayBuffer();

				const hash = Bun.hash(buffer).toString(16);

				const cached = await ctx.cache.get(`pdf-extract:${hash}`);

				if (cached) {
					return ctx.json(JSON.parse(cached), 200);
				}

				const data = await extractData(
					buffer,
					await ctx.database.insuranceCompany.findMany({
						select: {
							id: true,
							name: true,
						},
					}),
				);

				await ctx.cache.set(
					`pdf-extract:${hash}`,
					JSON.stringify(data),
					'EX',
					60 * 60 * 24 * 1,
				);

				return ctx.json(data, 200);
			} catch {
				return ctx.json(
					{
						message: 'Falha ao extrair dados do documento',
					},
					409,
				);
			}
		},
	);
}

export { registerRoutersServicesSafesExtractPDF };
