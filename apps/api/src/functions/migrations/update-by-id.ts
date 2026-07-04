import { endOfDay, isSameDay, parse, subHours } from 'date-fns';
import xior from 'xior';
import { cache } from '@/services/cache';
import { database } from '@/services/database';

type OldContact = {
	type: 'phone' | 'email' | string;
	value: string;
	accept_message?: boolean;
	whatsapp?: boolean | null;
};

type OldInsured = {
	id: string;
	name: string;
	registration: string;
	contacts: OldContact[];
	address?: {
		zip_code: string;
		street: string;
		number: string | null;
		neighborhood: string;
		city: string;
		state: string;
	};
	additional_information?: {
		birth?: string;
		[key: string]: unknown;
	};
};

type OldVehicle = {
	id: string;
	plate: string | null;
	plate_alternative: string | null;
	model: string;
	year_of_manufacture?: number;
	model_year: number;
	exchange: 'manual' | 'automatic' | null;
	conductor?: {
		id: string;
		name: string;
		registration: string;
	} | null;
	additional_information?: {
		vehicle_use?: string;
		overnight_zip_code?: string;
	};
};

type OldSafe = {
	id: string;
	index: number;
	type: 'renovation' | 'new';
	category: 'car' | 'motorcycle' | string;
	producer: string | null;
	insured: OldInsured;
	insurer: string;
	company: string;
	accepted_at: string | null;
	active: boolean;
	validity_start: string;
	validity_end: string;
	endorsements?: unknown[];
	details: {
		vehicle?: OldVehicle;
		plate?: string | null;
		received_by?: { id: string; name: string; registration: string };
		policy?: string | null;
		policy_url?: string | null;
	};
	receivables: {
		installments_number: number;
		installments_received?: number;
		date_receipt_expected?: string;
		amount_award: number;
		franchise: number;
		percentage: number;
		commission?: number;
		comission?: number;
		producer?: {
			type_commission: string | null;
			percentage: number | null;
			installments: number | null;
			commission: number | null;
			discont: number | null;
			amount: number | null;
			fees: number | null;
			fees_initial: number | null;
			fees_type: string | null;
		};
	};
	created_at: string;
	updated_at: string;
};

const BROKER_ID = '019e71c7-bd45-7f19-9715-d7a92e94cfcd';

const PRODUCER_MAP: Record<string, string> = {};

const VEHICLE_USE_MAP: Record<string, string> = {
	day_by_day: 'leisure_and_work',
	leisure: 'leisure',
	work: 'leisure_and_work',
	app: 'app_based_transport',
	app_based_transport: 'app_based_transport',
	taxi: 'taxi',
	public_transportation: 'public_transportation',
	delivery: 'delivieries',
	deliveries: 'delivieries',
	tourism: 'tourism',
	visits: 'client_supplier_visits',
	client_supplier_visits: 'client_supplier_visits',
	passenger: 'leisure_and_work',
	commercial: 'client_supplier_visits',
	capacity: 'public_transportation',
};

const MODALITY_MAP: Record<string, string> = {
	car: 'vehicle',
	motorcycle: 'vehicle',
	truck: 'vehicle',
	health: 'health',
	residence: 'residence',
	home: 'residence',
	business: 'business',
	condominium: 'condominium',
	travel: 'travel',
};

const OLD_API_BASE = 'https://xcarcorretora.com.br/api';
const OLD_COMPANY_ID = '4f629317-e7a5-466f-8716-a2a0521cb459';
const OLD_LIST_URL =
	`${OLD_API_BASE}/safes?is_external=false&is_to_win=false&page=1` +
	`&company=${OLD_COMPANY_ID}&order_by=desc`;
const OLD_LIST_URL_RECENT =
	`${OLD_API_BASE}/safes?is_external=false&is_to_win=false&page=1` +
	`&limit=50` +
	`&company=${OLD_COMPANY_ID}&order_by=desc`;

const INSURER_MAP: Record<string, string> = {
	'9df4e00c-2c12-448a-94a7-50949f6854eb':
		'019ee062-22ce-7000-ab39-35b651700307',
	'e1c48eab-be8e-4c9a-8034-15a56486d542':
		'019ee062-1890-7000-be0c-0b9102f35e1d',
	'a1df4caf-0bc6-4494-b3ce-1e06619e0b7f':
		'019ee062-2434-7000-83c4-5f3f62fc220a',
	'6b588296-0484-49b3-b1a3-56300e54495a':
		'019ee062-11ba-7000-82de-7fef2a1babf3',
	'b0e841bb-7355-4f37-aed6-88fc60e5d25c':
		'019ee062-2f6e-7000-805b-72c7054291ed',
	'e296ba94-0eb6-49ac-a4e2-2469b4b4a16b':
		'019ee062-2d01-7000-8dd0-528defa86d92',
	'46897db3-6955-49d4-8d26-d4ce4ece20c0':
		'019ee062-2bc3-7000-8573-1ffc79e45dd8',
	'8a8be33d-5e2b-4957-a4b3-bab732bdb751':
		'019ee062-207c-7000-9683-88684e16b8d9',
	'464ed884-ef62-4697-82bd-487b520272a3':
		'019ee062-14a1-7000-9681-4231ed9f8f7c',
	'79c00f92-05e3-4569-8ad8-f3f31b24fbe8':
		'019ee062-26d2-7000-9256-4a7b064cab40',
	'85c0bec0-5e29-4e92-918e-38391acac4e2':
		'019ee062-3210-7000-b350-2a3a234327b1',
	'77bfb521-a940-4ebb-98e4-0d2ef86ce09e':
		'019ee062-1df4-7000-ab69-d9361707fb90',
	'996bdaec-5717-441c-9a16-e59ab417ebb1':
		'019ee062-1c8c-7000-b69d-be52edb0307b',
	'c9d45441-d4be-4338-ac6a-d2787d8555ad':
		'019ee062-2581-7000-8567-2633383c08be',
	'3bf7a588-36b1-4a2c-bd80-0a4541fb58a6':
		'019ee062-0cc6-7000-a66b-f724d0358a2b',
	'c5fbb8f5-2d0b-4ea6-96f6-bf482d5a5102':
		'019ee062-3575-7000-aae9-4490e5e821d3',
	'120338c4-4da2-4b0d-991c-4b4a70cd46e4':
		'019f22ff-3450-7000-bee0-2d20c28c173a',
};

function getPhone(contacts: OldContact[]): string {
	const contact = contacts.find((c) => c.type === 'phone');
	const digits = (contact?.value ?? '').replace(/\D/g, '');

	return digits.slice(0, 13) || '00000000000';
}

function mapVehicleUse(oldUse?: string): string {
	if (!oldUse) {
		return 'leisure_and_work';
	}

	return VEHICLE_USE_MAP[oldUse] ?? 'leisure_and_work';
}

function mapModality(category: string): string {
	return MODALITY_MAP[category] ?? 'vehicle';
}

function normalizePostalCode(code?: string | null): string {
	if (!code) {
		return '00000000';
	}

	return code.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
}

function mapExchange(
	exchange?: string | null,
): 'manual' | 'automatic' | undefined {
	if (exchange === 'manual') {
		return 'manual';
	}

	if (exchange === 'automatic') {
		return 'automatic';
	}

	return undefined;
}

function getCommission(receivables: OldSafe['receivables']): number {
	return receivables.commission ?? receivables.comission ?? 0;
}

async function migration() {
	if (!BROKER_ID) {
		throw new Error('BROKER_ID não configurado no arquivo de migração.');
	}

	const unmappedInsurerIds = Object.entries(INSURER_MAP)
		.filter(([, v]) => !v)
		.map(([k]) => k);

	if (unmappedInsurerIds.length > 0) {
		throw Error('Existem seguradoras sem mapeamento. Preencha INSURER_MAP.');
	}

	const { data: listData } = await xior.get<{
		results: Pick<OldSafe, 'id'>[];
	}>(OLD_LIST_URL);
	const ids = listData.results.map((s) => s.id).reverse();

	const report = {
		total: ids.length,
		success: 0,
		skipped: 0,
		failed: 0,
		id_map: {} as Record<string, string>,
		errors: [] as Array<{ old_id: string; reason: string }>,
	};

	for (const [_, id] of ids.entries()) {
		const existing = await database.safe.findUnique({
			where: { externalId: id },
			select: { id: true },
		});

		if (existing) {
			report.id_map[id] = existing.id;
			report.skipped++;
			continue;
		}

		let oldSafe: OldSafe;
		try {
			const { data } = await xior.get<OldSafe>(`${OLD_API_BASE}/safes/${id}`);
			oldSafe = data;
		} catch (err) {
			report.errors.push({
				old_id: id,
				reason: `Falha ao buscar: ${String(err)}`,
			});
			report.failed++;
			continue;
		}

		try {
			const insuranceCompanyId = INSURER_MAP[oldSafe.insurer];
			if (!insuranceCompanyId) {
				report.errors.push({
					old_id: id,
					reason: `Seguradora não mapeada: ${oldSafe.insurer}. Rode /migration/inspect.`,
				});
				report.skipped++;
				continue;
			}

			const producerId = oldSafe.producer
				? (PRODUCER_MAP[oldSafe.producer] ?? null)
				: null;

			const cpf = oldSafe.insured.registration;
			if (!cpf) throw new Error('Segurado sem CPF (registration).');

			const phone = getPhone(oldSafe.insured.contacts);

			const insured = await database.insured.upsert({
				// @ts-expect-error
				where: {
					...(cpf.length === 11 && {
						brokerId_cpf: { brokerId: BROKER_ID, cpf },
					}),
					...(cpf.length === 14 && {
						brokerId_cnpj: { brokerId: BROKER_ID, cnpj: cpf },
					}),
				},
				update: {
					name: oldSafe.insured.name,
					phone,
				},
				create: {
					name: oldSafe.insured.name,
					phone,
					...(cpf.length === 11 && { cpf }),
					...(cpf.length === 14 && { cnpj: cpf }),
					birth: oldSafe.insured.additional_information?.birth
						? parse(
								oldSafe.insured.additional_information.birth.split(
									'T',
								)[0] as string,
								'yyyy-MM-dd',
								new Date(),
							)
						: null,
					brokerId: BROKER_ID,
				},
			});

			const vehicle = oldSafe.details.vehicle ?? null;
			const modality = mapModality(oldSafe.category);

			const overnightPostalCode = normalizePostalCode(
				vehicle?.additional_information?.overnight_zip_code ??
					oldSafe.insured.address?.zip_code,
			);
			const vehicleUse = mapVehicleUse(
				vehicle?.additional_information?.vehicle_use,
			);

			const commissionGross = getCommission(oldSafe.receivables);
			const producerAmount = oldSafe.receivables.producer?.amount ?? null;
			const commissionNet = commissionGross - (producerAmount ?? 0);

			const newSafe = await database.safe.upsert({
				where: { externalId: oldSafe.id },
				update: {},
				create: {
					externalId: oldSafe.id,
					isExternal: false,
					// biome-ignore lint/suspicious/noExplicitAny: modality
					modality: modality as any,
					renewal: oldSafe.type === 'renovation',
					brokerId: BROKER_ID,
					insuranceCompanyId,
					insuredId: insured.id,
					producerId,
					expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
					requestedAt: oldSafe.created_at,
					effectivedAt: oldSafe.validity_start,
					installments: oldSafe.receivables.installments_number,
					award: oldSafe.receivables.amount_award,
					franchise: oldSafe.receivables.franchise,
					commissionPercentage: oldSafe.receivables.percentage,
					commissionAmount: commissionGross,
					commissionGross,
					commissionNet,
					commissionAmountProducer: producerAmount,
					commissionInstallments:
						oldSafe.receivables.producer?.installments ?? null,
					status: oldSafe.active ? 'active' : 'canceled',
					statusAt: oldSafe.updated_at,
					createdAt: oldSafe.created_at,
					...(vehicle && modality === 'vehicle'
						? {
								safeVehicle: {
									create: {
										plate: vehicle.plate?.toUpperCase() ?? null,
										// biome-ignore lint/suspicious/noExplicitAny: usage
										usage: vehicleUse as any,
										overnightPostalCode,
										driverCPF: vehicle.conductor?.registration ?? null,
										driverName: vehicle.conductor?.name ?? null,
										driverPhone: null,
										vehicleWithoutPlate: {
											create: {
												model: vehicle.model,
												modelYear: vehicle.model_year,
												exchange: mapExchange(vehicle.exchange),
											},
										},
									},
								},
							}
						: {}),
				},
				select: { id: true },
			});

			report.id_map[oldSafe.id] = newSafe.id;
			report.success++;
		} catch (err) {
			report.errors.push({
				old_id: id,
				reason: err instanceof Error ? err.message : String(err),
			});
			report.failed++;
		}

		await cache.set('reportSafeMigration', JSON.stringify(report));
	}
}

async function migrationUpdater() {
	if (!BROKER_ID) {
		throw new Error('BROKER_ID não configurado no arquivo de migração.');
	}

	const unmappedInsurerIds = Object.entries(INSURER_MAP)
		.filter(([, v]) => !v)
		.map(([k]) => k);

	if (unmappedInsurerIds.length > 0) {
		throw Error('Existem seguradoras sem mapeamento. Preencha INSURER_MAP.');
	}

	const { data: listData } = await xior.get<{
		results: Pick<OldSafe, 'id' | 'updated_at'>[];
	}>(OLD_LIST_URL);
	const ids = listData.results
		.filter(
			// (e) => differenceInMinutes(new Date(), new Date(e.updated_at)) <= 15,
			(e) => isSameDay(new Date(), new Date(e.updated_at)),
		)
		.map((s) => s.id)
		.reverse();

	for (const [_, id] of ids.entries()) {
		let oldSafe: OldSafe;

		try {
			const { data } = await xior.get<OldSafe>(`${OLD_API_BASE}/safes/${id}`);
			oldSafe = data;
		} catch {
			continue;
		}

		const insuranceCompanyId = INSURER_MAP[oldSafe.insurer];
		if (!insuranceCompanyId) {
			continue;
		}

		const producerId = oldSafe.producer
			? (PRODUCER_MAP[oldSafe.producer] ?? null)
			: null;

		const cpf = oldSafe.insured.registration;
		if (!cpf) throw new Error('Segurado sem CPF (registration).');

		const phone = getPhone(oldSafe.insured.contacts);

		const insured = await database.insured.upsert({
			// @ts-expect-error
			where: {
				...(cpf.length === 11 && {
					brokerId_cpf: { brokerId: BROKER_ID, cpf },
				}),
				...(cpf.length === 14 && {
					brokerId_cnpj: { brokerId: BROKER_ID, cnpj: cpf },
				}),
			},
			update: {
				name: oldSafe.insured.name,
				phone,
			},
			create: {
				name: oldSafe.insured.name,
				phone,
				...(cpf.length === 11 && { cpf }),
				...(cpf.length === 14 && { cnpj: cpf }),
				birth: oldSafe.insured.additional_information?.birth
					? parse(
							oldSafe.insured.additional_information.birth.split(
								'T',
							)[0] as string,
							'yyyy-MM-dd',
							new Date(),
						)
					: null,
				brokerId: BROKER_ID,
			},
		});

		const vehicle = oldSafe.details.vehicle ?? null;
		const modality = mapModality(oldSafe.category);

		const overnightPostalCode = normalizePostalCode(
			vehicle?.additional_information?.overnight_zip_code ??
				oldSafe.insured.address?.zip_code,
		);
		const vehicleUse = mapVehicleUse(
			vehicle?.additional_information?.vehicle_use,
		);

		const commissionGross = getCommission(oldSafe.receivables);
		const producerAmount = oldSafe.receivables.producer?.amount ?? null;
		const commissionNet = commissionGross - (producerAmount ?? 0);

		await database.safe.upsert({
			where: { externalId: oldSafe.id },
			update: {
				// biome-ignore lint/suspicious/noExplicitAny: modality
				modality: modality as any,
				renewal: oldSafe.type === 'renovation',
				brokerId: BROKER_ID,
				insuranceCompanyId,
				insuredId: insured.id,
				producerId,
				expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
				requestedAt: oldSafe.created_at,
				effectivedAt: oldSafe.validity_start,
				installments: oldSafe.receivables.installments_number,
				award: oldSafe.receivables.amount_award,
				franchise: oldSafe.receivables.franchise,
				commissionPercentage: oldSafe.receivables.percentage,
				commissionAmount: commissionGross,
				commissionGross,
				commissionNet,
				commissionAmountProducer: producerAmount,
				commissionInstallments:
					oldSafe.receivables.producer?.installments ?? null,
				status: oldSafe.active ? 'active' : 'canceled',
				statusAt: oldSafe.updated_at,
				createdAt: oldSafe.created_at,
				...(vehicle && modality === 'vehicle'
					? {
							safeVehicle: {
								update: {
									plate: vehicle.plate?.toUpperCase() ?? null,
									// biome-ignore lint/suspicious/noExplicitAny: usage
									usage: vehicleUse as any,
									overnightPostalCode,
									driverCPF: vehicle.conductor?.registration ?? null,
									driverName: vehicle.conductor?.name ?? null,
									driverPhone: null,
									vehicleWithoutPlate: {
										create: {
											model: vehicle.model,
											modelYear: vehicle.model_year,
											exchange: mapExchange(vehicle.exchange),
										},
									},
								},
							},
						}
					: {}),
			},
			create: {
				externalId: oldSafe.id,
				isExternal: false,
				// biome-ignore lint/suspicious/noExplicitAny: modality
				modality: modality as any,
				renewal: oldSafe.type === 'renovation',
				brokerId: BROKER_ID,
				insuranceCompanyId,
				insuredId: insured.id,
				producerId,
				expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
				requestedAt: oldSafe.created_at,
				effectivedAt: oldSafe.validity_start,
				installments: oldSafe.receivables.installments_number,
				award: oldSafe.receivables.amount_award,
				franchise: oldSafe.receivables.franchise,
				commissionPercentage: oldSafe.receivables.percentage,
				commissionAmount: commissionGross,
				commissionGross,
				commissionNet,
				commissionAmountProducer: producerAmount,
				commissionInstallments:
					oldSafe.receivables.producer?.installments ?? null,
				status: oldSafe.active ? 'active' : 'canceled',
				statusAt: oldSafe.updated_at,
				createdAt: oldSafe.created_at,
				...(vehicle && modality === 'vehicle'
					? {
							safeVehicle: {
								create: {
									plate: vehicle.plate?.toUpperCase() ?? null,
									// biome-ignore lint/suspicious/noExplicitAny: usage
									usage: vehicleUse as any,
									overnightPostalCode,
									driverCPF: vehicle.conductor?.registration ?? null,
									driverName: vehicle.conductor?.name ?? null,
									driverPhone: null,
									vehicleWithoutPlate: {
										create: {
											model: vehicle.model,
											modelYear: vehicle.model_year,
											exchange: mapExchange(vehicle.exchange),
										},
									},
								},
							},
						}
					: {}),
			},
			select: { id: true },
		});
	}
}

async function migrationRecent() {
	if (!BROKER_ID) {
		throw new Error('BROKER_ID não configurado no arquivo de migração.');
	}

	const unmappedInsurerIds = Object.entries(INSURER_MAP)
		.filter(([, v]) => !v)
		.map(([k]) => k);

	if (unmappedInsurerIds.length > 0) {
		throw Error('Existem seguradoras sem mapeamento. Preencha INSURER_MAP.');
	}

	const { data: listData } = await xior.get<{
		results: Pick<OldSafe, 'id' | 'updated_at'>[];
	}>(OLD_LIST_URL_RECENT);

	const ids = listData.results.map((s) => s.id).reverse();

	for (const [_, id] of ids.entries()) {
		let oldSafe: OldSafe;

		try {
			const { data } = await xior.get<OldSafe>(`${OLD_API_BASE}/safes/${id}`);
			oldSafe = data;
		} catch {
			continue;
		}

		const insuranceCompanyId = INSURER_MAP[oldSafe.insurer];
		if (!insuranceCompanyId) {
			continue;
		}

		const producerId = oldSafe.producer
			? (PRODUCER_MAP[oldSafe.producer] ?? null)
			: null;

		const cpf = oldSafe.insured.registration;
		if (!cpf) throw new Error('Segurado sem CPF (registration).');

		const phone = getPhone(oldSafe.insured.contacts);

		const insured = await database.insured.upsert({
			// @ts-expect-error
			where: {
				...(cpf.length === 11 && {
					brokerId_cpf: { brokerId: BROKER_ID, cpf },
				}),
				...(cpf.length === 14 && {
					brokerId_cnpj: { brokerId: BROKER_ID, cnpj: cpf },
				}),
			},
			update: {
				name: oldSafe.insured.name,
				phone,
			},
			create: {
				name: oldSafe.insured.name,
				phone,
				...(cpf.length === 11 && { cpf }),
				...(cpf.length === 14 && { cnpj: cpf }),
				birth: oldSafe.insured.additional_information?.birth
					? parse(
							oldSafe.insured.additional_information.birth.split(
								'T',
							)[0] as string,
							'yyyy-MM-dd',
							new Date(),
						)
					: null,
				brokerId: BROKER_ID,
			},
		});

		const vehicle = oldSafe.details.vehicle ?? null;
		const modality = mapModality(oldSafe.category);

		const overnightPostalCode = normalizePostalCode(
			vehicle?.additional_information?.overnight_zip_code ??
				oldSafe.insured.address?.zip_code,
		);
		const vehicleUse = mapVehicleUse(
			vehicle?.additional_information?.vehicle_use,
		);

		const commissionGross = getCommission(oldSafe.receivables);
		const producerAmount = oldSafe.receivables.producer?.amount ?? null;
		const commissionNet = commissionGross - (producerAmount ?? 0);

		await database.safe.upsert({
			where: { externalId: oldSafe.id },
			update: {
				// biome-ignore lint/suspicious/noExplicitAny: modality
				modality: modality as any,
				renewal: oldSafe.type === 'renovation',
				brokerId: BROKER_ID,
				insuranceCompanyId,
				insuredId: insured.id,
				producerId,
				expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
				requestedAt: oldSafe.created_at,
				effectivedAt: oldSafe.validity_start,
				installments: oldSafe.receivables.installments_number,
				award: oldSafe.receivables.amount_award,
				franchise: oldSafe.receivables.franchise,
				commissionPercentage: oldSafe.receivables.percentage,
				commissionAmount: commissionGross,
				commissionGross,
				commissionNet,
				commissionAmountProducer: producerAmount,
				commissionInstallments:
					oldSafe.receivables.producer?.installments ?? null,
				status: oldSafe.active ? 'active' : 'canceled',
				statusAt: oldSafe.updated_at,
				createdAt: oldSafe.created_at,
				...(vehicle && modality === 'vehicle'
					? {
							safeVehicle: {
								update: {
									plate: vehicle.plate?.toUpperCase() ?? null,
									// biome-ignore lint/suspicious/noExplicitAny: usage
									usage: vehicleUse as any,
									overnightPostalCode,
									driverCPF: vehicle.conductor?.registration ?? null,
									driverName: vehicle.conductor?.name ?? null,
									driverPhone: null,
									vehicleWithoutPlate: {
										create: {
											model: vehicle.model,
											modelYear: vehicle.model_year,
											exchange: mapExchange(vehicle.exchange),
										},
									},
								},
							},
						}
					: {}),
			},
			create: {
				externalId: oldSafe.id,
				isExternal: false,
				// biome-ignore lint/suspicious/noExplicitAny: modality
				modality: modality as any,
				renewal: oldSafe.type === 'renovation',
				brokerId: BROKER_ID,
				insuranceCompanyId,
				insuredId: insured.id,
				producerId,
				expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
				requestedAt: oldSafe.created_at,
				effectivedAt: oldSafe.validity_start,
				installments: oldSafe.receivables.installments_number,
				award: oldSafe.receivables.amount_award,
				franchise: oldSafe.receivables.franchise,
				commissionPercentage: oldSafe.receivables.percentage,
				commissionAmount: commissionGross,
				commissionGross,
				commissionNet,
				commissionAmountProducer: producerAmount,
				commissionInstallments:
					oldSafe.receivables.producer?.installments ?? null,
				status: oldSafe.active ? 'active' : 'canceled',
				statusAt: oldSafe.updated_at,
				createdAt: oldSafe.created_at,
				...(vehicle && modality === 'vehicle'
					? {
							safeVehicle: {
								create: {
									plate: vehicle.plate?.toUpperCase() ?? null,
									// biome-ignore lint/suspicious/noExplicitAny: usage
									usage: vehicleUse as any,
									overnightPostalCode,
									driverCPF: vehicle.conductor?.registration ?? null,
									driverName: vehicle.conductor?.name ?? null,
									driverPhone: null,
									vehicleWithoutPlate: {
										create: {
											model: vehicle.model,
											modelYear: vehicle.model_year,
											exchange: mapExchange(vehicle.exchange),
										},
									},
								},
							},
						}
					: {}),
			},
			select: { id: true },
		});
	}
}

async function migrationById(id: string) {
	if (!BROKER_ID) {
		throw new Error('BROKER_ID não configurado no arquivo de migração.');
	}

	const unmappedInsurerIds = Object.entries(INSURER_MAP)
		.filter(([, v]) => !v)
		.map(([k]) => k);

	if (unmappedInsurerIds.length > 0) {
		throw Error('Existem seguradoras sem mapeamento. Preencha INSURER_MAP.');
	}

	const { data: oldSafe } = await xior.get<OldSafe>(
		`${OLD_API_BASE}/safes/${id}`,
	);

	const insuranceCompanyId = INSURER_MAP[oldSafe.insurer];
	if (!insuranceCompanyId) {
	}

	const producerId = oldSafe.producer
		? (PRODUCER_MAP[oldSafe.producer] ?? null)
		: null;

	const cpf = oldSafe.insured.registration;
	if (!cpf) throw new Error('Segurado sem CPF (registration).');

	const phone = getPhone(oldSafe.insured.contacts);

	const insured = await database.insured.upsert({
		// @ts-expect-error
		where: {
			...(cpf.length === 11 && {
				brokerId_cpf: { brokerId: BROKER_ID, cpf },
			}),
			...(cpf.length === 14 && {
				brokerId_cnpj: { brokerId: BROKER_ID, cnpj: cpf },
			}),
		},
		update: {
			name: oldSafe.insured.name,
			phone,
		},
		create: {
			name: oldSafe.insured.name,
			phone,
			...(cpf.length === 11 && { cpf }),
			...(cpf.length === 14 && { cnpj: cpf }),
			birth: oldSafe.insured.additional_information?.birth
				? parse(
						oldSafe.insured.additional_information.birth.split(
							'T',
						)[0] as string,
						'yyyy-MM-dd',
						new Date(),
					)
				: null,
			brokerId: BROKER_ID,
		},
	});

	const vehicle = oldSafe.details.vehicle ?? null;
	const modality = mapModality(oldSafe.category);

	const overnightPostalCode = normalizePostalCode(
		vehicle?.additional_information?.overnight_zip_code ??
			oldSafe.insured.address?.zip_code,
	);
	const vehicleUse = mapVehicleUse(
		vehicle?.additional_information?.vehicle_use,
	);

	const commissionGross = getCommission(oldSafe.receivables);
	const producerAmount = oldSafe.receivables.producer?.amount ?? null;
	const commissionNet = commissionGross - (producerAmount ?? 0);

	await database.safe.upsert({
		where: { externalId: oldSafe.id },
		update: {
			// biome-ignore lint/suspicious/noExplicitAny: modality
			modality: modality as any,
			renewal: oldSafe.type === 'renovation',
			brokerId: BROKER_ID,
			insuranceCompanyId,
			insuredId: insured.id,
			producerId,
			expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
			requestedAt: oldSafe.created_at,
			effectivedAt: oldSafe.validity_start,
			installments: oldSafe.receivables.installments_number,
			award: oldSafe.receivables.amount_award,
			franchise: oldSafe.receivables.franchise,
			commissionPercentage: oldSafe.receivables.percentage,
			commissionAmount: commissionGross,
			commissionGross,
			commissionNet,
			commissionAmountProducer: producerAmount,
			commissionInstallments:
				oldSafe.receivables.producer?.installments ?? null,
			status: oldSafe.active ? 'active' : 'canceled',
			statusAt: oldSafe.updated_at,
			createdAt: oldSafe.created_at,
			...(vehicle && modality === 'vehicle'
				? {
						safeVehicle: {
							update: {
								plate: vehicle.plate?.toUpperCase() ?? null,
								// biome-ignore lint/suspicious/noExplicitAny: usage
								usage: vehicleUse as any,
								overnightPostalCode,
								driverCPF: vehicle.conductor?.registration ?? null,
								driverName: vehicle.conductor?.name ?? null,
								driverPhone: null,
								vehicleWithoutPlate: {
									create: {
										model: vehicle.model,
										modelYear: vehicle.model_year,
										exchange: mapExchange(vehicle.exchange),
									},
								},
							},
						},
					}
				: {}),
		},
		create: {
			externalId: oldSafe.id,
			isExternal: false,
			// biome-ignore lint/suspicious/noExplicitAny: modality
			modality: modality as any,
			renewal: oldSafe.type === 'renovation',
			brokerId: BROKER_ID,
			insuranceCompanyId,
			insuredId: insured.id,
			producerId,
			expiration: endOfDay(subHours(oldSafe.validity_end, 1)),
			requestedAt: oldSafe.created_at,
			effectivedAt: oldSafe.validity_start,
			installments: oldSafe.receivables.installments_number,
			award: oldSafe.receivables.amount_award,
			franchise: oldSafe.receivables.franchise,
			commissionPercentage: oldSafe.receivables.percentage,
			commissionAmount: commissionGross,
			commissionGross,
			commissionNet,
			commissionAmountProducer: producerAmount,
			commissionInstallments:
				oldSafe.receivables.producer?.installments ?? null,
			status: oldSafe.active ? 'active' : 'canceled',
			statusAt: oldSafe.updated_at,
			createdAt: oldSafe.created_at,
			...(vehicle && modality === 'vehicle'
				? {
						safeVehicle: {
							create: {
								plate: vehicle.plate?.toUpperCase() ?? null,
								// biome-ignore lint/suspicious/noExplicitAny: usage
								usage: vehicleUse as any,
								overnightPostalCode,
								driverCPF: vehicle.conductor?.registration ?? null,
								driverName: vehicle.conductor?.name ?? null,
								driverPhone: null,
								vehicleWithoutPlate: {
									create: {
										model: vehicle.model,
										modelYear: vehicle.model_year,
										exchange: mapExchange(vehicle.exchange),
									},
								},
							},
						},
					}
				: {}),
		},
		select: { id: true },
	});
}

export { migration, migrationUpdater, migrationRecent, migrationById };
