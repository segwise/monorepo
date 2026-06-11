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

function matchScore(candidate: string, target: string): number {
	const words = normalize(target).split(' ').filter(Boolean);

	const norm = normalize(candidate);

	return words.reduce((acc, word) => acc + (norm.includes(word) ? 1 : 0), 0);
}

function bestMatch<T extends VehicleBrand | VehicleModel>(
	items: T[],
	query: string,
): T {
	// @ts-expect-error
	return items
		.map((item) => ({ item, score: matchScore(item.name, query) }))
		.sort((a, b) => b.score - a.score)[0]?.item;
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

		if (!brand || matchScore(brand.name, vehicle.manufacturer) === 0) {
			throw new Error(
				`Marca não encontrada na FIPE: "${vehicle.manufacturer}". ` +
					`Tente ajustar o nome ou verificar o tipo de veículo.`,
			);
		}

		const models = await this.client.getModelsByBrand(vehicleType, brand.code);
		const model = bestMatch(models, vehicle.model);

		if (!model || matchScore(model.name, vehicle.model) === 0) {
			throw new Error(
				`Modelo não encontrado na FIPE: "${vehicle.model}" para a marca "${brand.name}". ` +
					`Tente ajustar o nome do modelo.`,
			);
		}

		const years = await this.client.getYearsByModel(
			vehicleType,
			brand.code,
			model.code,
		);

		const matchingYears = years.filter((y) =>
			y.code.startsWith(String(vehicle.modelYear)),
		);

		if (matchingYears.length === 0) {
			const available = years.map((y) => y.name).join(', ');
			throw new Error(
				`Ano ${vehicle.modelYear} não encontrado para ${brand.name} ${model.name}. ` +
					`Anos disponíveis: ${available}`,
			);
		}

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
