import { zValidator } from '@hono/zod-validator';
import {
	isCPF,
	maskNumber,
	SchemaCNPJ,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaDateString,
	SchemaModality,
	SchemaName,
	SchemaPhone,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core';
import { format } from 'date-fns';
import { z } from 'zod';
import type { Server } from '@/@types/server';
import { documentByCNPJ } from '@/functions/document/by-cnpj';
import { documentByCPF } from '@/functions/document/by-cpf';
import {
	askJson,
	runPdfExtraction,
	SchemaPlateLenient,
	visionInstructions,
} from '@/libraries/ai/pdf-extraction';

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
				phone: z
					.string('Celular inválido')
					.transform(maskNumber)
					.transform((value) =>
						value.slice(0, 2) === '00' ? value.slice(2) : value,
					)
					.pipe(SchemaPhone),
				birth: SchemaDateString.nullish(),
				profession: z.string().nullish(),
			})
			.strict(),
		vehicle: z
			.object({
				plate: SchemaPlateLenient,
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

type InsuranceCompanyRow = { id: string; name: string; cnpj: string };

// O modelo não devolve id/nome/CNPJ da seguradora (UUID e texto longo custam
// muitos tokens de saída, e saída é o que mais pesa no tempo): devolve só o
// índice dela na lista enviada, e id, nome e CNPJ vêm do banco.
const SchemaModelOutput = SchemaDataExtract.omit({
	insuranceCompany: true,
}).extend({
	insuranceCompany: z.number('Seguradora inválida').int().min(1),
});

function mountPrompt(
	text: string,
	{
		database: { insuranceCompanies },
		imagesCount,
	}: {
		database: {
			insuranceCompanies: Array<{
				i: number;
				name: string;
			}>;
		};
		imagesCount: number;
	},
): string {
	return `Extraia os seguintes dados do documento abaixo (texto extraído de um PDF).${visionInstructions(imagesCount)}

		Responda APENAS com um objeto JSON no formato exato abaixo, sem texto adicional, sem markdown, sem \`\`\`:

		{
			"latestProposal": "string ou null, identificação da proposta anterior, é o código da proposta anterior caso seja renovação"
			"renewal": "boolean, informação se a proposta ou apólice é uma renovação ou um seguro novo. Baseado se tem uma apólice anterior ou não"
			"modality": "string, tipo de seguro, enum (vehicle, motorcycle, truck, health, residence, business, condominium, travel, professional, construction)",
			"insuranceCompany": "number, o índice (campo 'i') da seguradora do documento na lista de 'Dados do meu banco de dados / Seguradoras'. Responda somente o número",
			"insured": {
				"name": "string, nome do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"registration": "string, cpf ou cnpj do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"phone": "string, celular do (proponente / segurado), cuidado para não ser o telefone fixo",
				"birth": "string no formato DD/MM/AAAA ou null, data de nascimento do (proponente / segurado) cuidado para não ser o do condutor, pois podem ser diferentes",
				"profession": "string ou null"
			},
			"vehicle": {
				"plate": "string ou null, placa do veículo, pode ser um veículo zero, por tanto não ter placa",
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
		- O valor da frânquia nunca pode somar de outros serviços, o valor deve ser sempre somente da frânquia base do seguro, e nunca somar nada, caso tenha dificuldade de saber qual é, normalmente é usado o termo "básico" ou "básica" na cobertura contratada, e normalmente é o primeiro da lista de coberturas. Tome muito cuidado, pois alguns documentos tem o prêmio da cobertura e a frânquia um do lado da outra, verifique a ordem usando o header da cobertura ou a listagem para garantir o valor correto
		- Tenha muito cuidado com o valor da frânquia, nunca confunda com o valor do prêmio da frânquia, veja que em alguns casos que possa ficar confuso, a frânquia poderá está na mesma descrição do valor informando "X porcento da obrigatória", tenha cuidado, porquê normalmente a frânquia é maior que o prêmio líquido da frânquia, porquê não pode confundir o valor do prêmio da frânquia, com o valor da frânquia
		- A seguradora deve ser uma das listadas em 'Dados do meu banco de dados / Seguradoras'; responda o índice ('i') dela em "insuranceCompany"
		- Responda o JSON minificado, em uma única linha, sem indentação nem quebras de linha entre os campos

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

async function askModel(
	{
		model,
		text,
		images,
	}: { model: string; text: string; images: Array<string> },
	insuranceCompanies: Array<InsuranceCompanyRow>,
): Promise<DataExtract> {
	const prompt = mountPrompt(text, {
		database: {
			insuranceCompanies: insuranceCompanies.map((company, index) => ({
				i: index + 1,
				name: company.name,
			})),
		},
		imagesCount: images.length,
	});

	const parsed = await askJson({ model, prompt, images });

	console.log(parsed);

	const { insuranceCompany: index, ...rest } = SchemaModelOutput.parse(parsed);

	const company = insuranceCompanies[index - 1];

	if (!company) {
		throw new z.ZodError([
			{
				code: 'custom',
				path: ['insuranceCompany'],
				message: 'Seguradora não encontrada na lista',
				input: index,
			},
		]);
	}

	return SchemaDataExtract.parse({ ...rest, insuranceCompany: company });
}

// Quando o documento não traz a data de nascimento, busca pelo CPF/CNPJ. As
// consultas são independentes: rodam em paralelo e, se uma falhar, o campo fica
// nulo (o usuário preenche) em vez de derrubar a extração inteira.
async function completeBirths(valid: DataExtract): Promise<DataExtract> {
	const lookup = async (registration: string) => {
		try {
			const document = isCPF(registration)
				? await documentByCPF(registration)
				: await documentByCNPJ(registration);

			return format(document.birth, 'dd/MM/yyyy');
		} catch (error) {
			console.warn(
				'[extract-pdf] consulta de nascimento falhou:',
				error instanceof Error ? error.message : error,
			);

			return null;
		}
	};

	const driver = valid.vehicle.driver;
	const driverIsInsured = !!driver && valid.insured.registration === driver.cpf;
	const needsDriverLookup = !!driver && !driver.birth && !driverIsInsured;

	const [insuredBirth, driverBirth] = await Promise.all([
		valid.insured.birth
			? Promise.resolve(valid.insured.birth)
			: lookup(valid.insured.registration),
		needsDriverLookup && driver ? lookup(driver.cpf) : Promise.resolve(null),
	]);

	valid.insured.birth = insuredBirth ?? null;

	if (driver) {
		driver.birth = driverIsInsured
			? valid.insured.birth
			: (driver.birth ?? driverBirth ?? null);
	}

	return valid;
}

async function extractData(
	path: ArrayBuffer,
	insuranceCompanies: Array<InsuranceCompanyRow>,
) {
	const extracted = await runPdfExtraction({
		label: 'extract-pdf',
		buffer: path,
		ask: (input) => askModel(input, insuranceCompanies),
	});

	const lookupStarted = performance.now();
	const data = await completeBirths(extracted);

	console.log(
		`[extract-pdf] consultas de nascimento ${Math.round(performance.now() - lookupStarted)}ms`,
	);

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

				const cached = await ctx.cache.get(`pdf-extract:v3:${hash}`);

				if (cached) {
					return ctx.json(JSON.parse(cached), 200);
				}

				const data = await extractData(
					buffer,
					await ctx.database.insuranceCompany.findMany({
						select: {
							id: true,
							name: true,
							cnpj: true,
						},
						orderBy: { name: 'asc' },
					}),
				);

				await ctx.cache.set(
					`pdf-extract:v3:${hash}`,
					JSON.stringify(data),
					'EX',
					60 * 60 * 24 * 1,
				);

				return ctx.json(data, 200);
			} catch (error) {
				let message = 'Falha ao extrair dados do documento';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					409,
				);
			}
		},
	);
}

export { registerRoutersServicesSafesExtractPDF };
