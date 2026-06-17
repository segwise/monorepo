type VehicleType = 'cars' | 'motorcycles' | 'trucks';

interface FipeReference {
	code: string;
	month: string;
}

interface VehicleBrand {
	code: string;
	name: string;
}

interface VehicleModel {
	code: string;
	name: string;
}

interface VehicleYear {
	code: string;
	name: string;
}

interface PriceHistory {
	month: string;
	price: string;
	reference: string;
}

interface VehicleDetail {
	brand: string;
	codeFipe: string;
	fuel: string;
	fuelAcronym: string;
	model: string;
	modelYear: number;
	price: string;
	priceHistory: PriceHistory[];
	referenceMonth: string;
	vehicleType: number;
}

interface PlateVehicle {
	model: string;
	modelYear: number;
	manufacturer: string;
}

interface FipeResult {
	details: VehicleDetail[];
	brandCode: string;
	modelCode: string;
}

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

function normalize(str: string): string {
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function tokenize(str: string): string[] {
	return normalize(str)
		.replace(/([a-z])(\d)/g, '$1 $2')
		.replace(/(\d)([a-z])/g, '$1 $2')
		.split(/\s+/)
		.filter(Boolean);
}

function scoreParts(candidate: string, target: string) {
	const targetTokens = tokenize(target);
	const candidateTokens = tokenize(candidate);

	const noSpaceCandidate = normalize(candidate).replace(/\s/g, '');
	const noSpaceTarget = normalize(target).replace(/\s/g, '');
	const noSpaceMatch =
		noSpaceCandidate.includes(noSpaceTarget) ||
		noSpaceTarget.includes(noSpaceCandidate);

	const matched = noSpaceMatch
		? targetTokens.length
		: targetTokens.reduce(
				(acc, token) =>
					acc + (candidateTokens.some((ct) => ct.startsWith(token)) ? 1 : 0),
				0,
			);

	return {
		recall: matched / Math.max(targetTokens.length, 1),
		precision: matched / Math.max(candidateTokens.length, 1),
	};
}

function matchScore(candidate: string, target: string): number {
	const { precision, recall } = scoreParts(candidate, target);
	if (precision + recall === 0) return 0;
	return (2 * precision * recall) / (precision + recall);
}

const MATCH_THRESHOLD = 0.5;
const RECALL_THRESHOLD = 0.5;

export function bestMatch<T extends VehicleBrand | VehicleModel>(
	items: T[],
	query: string,
): T | null {
	const best = items
		.map((item) => ({ item, score: matchScore(item.name, query) }))
		.sort((a, b) => b.score - a.score)[0];

	if (!best || best.score < MATCH_THRESHOLD) return null;
	return best.item;
}

function rankMatches<T extends VehicleBrand | VehicleModel>(
	items: T[],
	query: string,
): T[] {
	return items
		.map((item) => {
			const { precision, recall } = scoreParts(item.name, query);
			const score =
				precision + recall === 0
					? 0
					: (2 * precision * recall) / (precision + recall);
			return { item, recall, score };
		})
		.filter((entry) => entry.recall >= RECALL_THRESHOLD)
		.sort((a, b) => b.score - a.score)
		.map((entry) => entry.item);
}

class FipeClient {
	private headers: Record<string, string>;

	constructor(subscriptionToken?: string) {
		this.headers = {
			'Content-Type': 'application/json',
			...(subscriptionToken
				? { 'X-Subscription-Token': subscriptionToken }
				: {}),
		};
	}

	private async get<T>(path: string): Promise<T> {
		const res = await fetch(`${BASE_URL}${path}`, { headers: this.headers });

		if (!res.ok) {
			const body = await res.text().catch(() => '');
			throw new Error(`FIPE API [${res.status}] ${path} — ${body}`);
		}

		return res.json() as Promise<T>;
	}

	getReferences(): Promise<FipeReference[]> {
		return this.get('/references');
	}

	getBrands(vehicleType: VehicleType = 'cars'): Promise<VehicleBrand[]> {
		return this.get(`/${vehicleType}/brands`);
	}

	getModelsByBrand(
		vehicleType: VehicleType,
		brandId: string,
	): Promise<VehicleModel[]> {
		return this.get(`/${vehicleType}/brands/${brandId}/models`);
	}

	getYearsByModel(
		vehicleType: VehicleType,
		brandId: string,
		modelId: string,
	): Promise<VehicleYear[]> {
		return this.get(
			`/${vehicleType}/brands/${brandId}/models/${modelId}/years`,
		);
	}

	getVehicleDetail(
		vehicleType: VehicleType,
		brandId: string,
		modelId: string,
		yearId: string,
	): Promise<VehicleDetail> {
		return this.get(
			`/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`,
		);
	}

	getYearsByFipeCode(
		vehicleType: VehicleType,
		fipeCode: string,
	): Promise<VehicleYear[]> {
		return this.get(`/${vehicleType}/${fipeCode}/years`);
	}

	getDetailByFipeCode(
		vehicleType: VehicleType,
		fipeCode: string,
		yearId: string,
	): Promise<VehicleDetail> {
		return this.get(`/${vehicleType}/${fipeCode}/years/${yearId}`);
	}

	getPriceHistory(
		vehicleType: VehicleType,
		fipeCode: string,
		yearId: string,
	): Promise<VehicleDetail> {
		return this.get(`/${vehicleType}/${fipeCode}/years/${yearId}/history`);
	}
}

const MAX_MODEL_CANDIDATES = 15;

class FipeService {
	private client: FipeClient;

	constructor(subscriptionToken?: string) {
		this.client = new FipeClient(subscriptionToken);
	}

	async findByPlateData(
		vehicle: PlateVehicle,
		vehicleType: VehicleType = 'cars',
	): Promise<FipeResult> {
		const brands = await this.client.getBrands(vehicleType);
		const brand = bestMatch(brands, vehicle.manufacturer);

		if (!brand) {
			throw new Error(
				`Marca não encontrada na FIPE: "${vehicle.manufacturer}". ` +
					`Tente ajustar o nome ou verificar o tipo de veículo.`,
			);
		}

		const models = await this.client.getModelsByBrand(vehicleType, brand.code);
		const modelCandidates = rankMatches(models, vehicle.model).slice(
			0,
			MAX_MODEL_CANDIDATES,
		);

		if (modelCandidates.length === 0) {
			throw new Error(
				`Modelo não encontrado na FIPE: "${vehicle.model}" para a marca "${brand.name}". ` +
					`Tente ajustar o nome do modelo.`,
			);
		}

		let firstCandidateYears: VehicleYear[] | null = null;

		for (const model of modelCandidates) {
			const years = await this.client.getYearsByModel(
				vehicleType,
				brand.code,
				model.code,
			);

			if (firstCandidateYears === null) {
				firstCandidateYears = years;
			}

			const matchingYears = years.filter((y) =>
				y.code.startsWith(String(vehicle.modelYear)),
			);

			if (matchingYears.length > 0) {
				const details = await Promise.all(
					matchingYears.map((year) =>
						this.client.getVehicleDetail(
							vehicleType,
							brand.code,
							model.code,
							year.code,
						),
					),
				);

				return {
					details,
					brandCode: brand.code,
					modelCode: model.code,
				};
			}
		}

		const available = (firstCandidateYears ?? []).map((y) => y.name).join(', ');

		throw new Error(
			`Ano ${vehicle.modelYear} não encontrado para ${brand.name} ${modelCandidates[0]?.name}. ` +
				`Anos disponíveis: ${available} ` +
				`(nenhuma das ${modelCandidates.length} variações de modelo encontradas tinha esse ano).`,
		);
	}

	async findByFipeCode(
		fipeCode: string,
		modelYear: number,
		vehicleType: VehicleType = 'cars',
	): Promise<FipeResult> {
		const years = await this.client.getYearsByFipeCode(vehicleType, fipeCode);
		const matchingYears = years.filter((y) =>
			y.code.startsWith(String(modelYear)),
		);

		if (matchingYears.length === 0) {
			throw new Error(
				`Ano ${modelYear} não encontrado para o código FIPE ${fipeCode}`,
			);
		}

		const details = await Promise.all(
			matchingYears.map((year) =>
				this.client.getDetailByFipeCode(vehicleType, fipeCode, year.code),
			),
		);

		return {
			details,
			brandCode: '',
			modelCode: '',
		};
	}
}

export { FipeClient, FipeService };
