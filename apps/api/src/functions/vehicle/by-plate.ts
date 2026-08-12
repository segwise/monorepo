import { SchemaPlate, type Vehicle } from '@segwise/core';
import xior, { XiorError } from 'xior';
import { environment } from '@/libraries/environment';
import { database } from '@/services/database';
import { storage } from '@/services/storage/images';

type VehicleResponse = {
	MARCA: string;
	MODELO: string;
	SUBMODELO: string;
	VERSAO: string;
	ano: string;
	anoModelo: string;
	chassi: string;
	codigoSituacao: string;
	cor: string;
	data: string;
	extra?: {
		ano_fabricacao: string;
		ano_modelo: string;
		caixa_cambio: string;
		cap_maxima_tracao: string;
		carroceria: string;
		chassi?: string | null;
		cilindradas: string;
		combustivel: string;
		di: string;
		eixo_traseiro_dif: string;
		eixos: string;
		especie: string;
		grupo: string;
		modelo: string;
		municipio: string;
		nacionalidade: string;
		peso_bruto_total: string;
		placa: string;
		placa_modelo_antigo: string;
		placa_modelo_novo: string;
		quantidade_passageiro: string;
		's.especie': string;
		segmento: string;
		situacao_chassi: string;
		situacao_veiculo: string;
		sub_segmento: string;
		terceiro_eixo: string;
		tipo_carroceria: string;
		tipo_doc_faturado: string;
		tipo_doc_importadora: string;
		tipo_doc_prop: string;
		tipo_montagem: string;
		tipo_veiculo: string;
		uf: string;
		uf_faturado: string;
		uf_placa: string;
	} | null;
	fipe: {
		dados: Array<{
			ano_modelo: string;
			codigo_fipe: string;
			codigo_marca: number;
			codigo_modelo: string;
			combustivel: string;
			id_valor: number;
			mes_referencia: string;
			referencia_fipe: number;
			score: number;
			sigla_combustivel: string;
			texto_marca: string;
			texto_modelo: string;
			texto_valor: string;
			tipo_modelo: number;
		}>;
	};
	listamodelo: Array<string>;
	logo: string;
	marca: string;
	marcaModelo: string;
	mensagemRetorno: string;
	modelo: string;
	municipio: string;
	origem: string;
	placa: string;
	placa_alternativa: string;
	situacao: string | null;
	token: string;
	uf: string;
};

async function vehicleByPlate(value: string): Promise<Vehicle> {
	try {
		return await database.$transaction(async (transaction) => {
			const plate = SchemaPlate.parse(value);

			const vehicle = await transaction.vehicle.findFirst({
				where: {
					OR: [
						{
							plate,
						},
						{
							plateAlternative: plate,
						},
					],
				},
				select: {
					id: true,
					plate: true,
					plateAlternative: true,
					model: true,
					modelYear: true,
					image: true,
					manufacturer: {
						select: {
							id: true,
							name: true,
							icon: true,
							image: true,
						},
					},
					exchange: true,
					chassi: true,
				},
			});

			if (vehicle) {
				return {
					id: vehicle.id,
					plate: vehicle.plate,
					plateAlternative: vehicle.plateAlternative,
					model: vehicle.model,
					modelYear: vehicle.modelYear,
					manufacturer: {
						id: vehicle.manufacturer.id,
						name: vehicle.manufacturer.name,
						icon: vehicle.manufacturer.icon,
						...(vehicle.manufacturer.image && {
							image: vehicle.manufacturer.image,
						}),
					},
					...(vehicle.exchange && {
						exchange: vehicle.exchange,
					}),
					...(vehicle.chassi && {
						chassi: vehicle.chassi,
					}),
					...(vehicle.image && {
						image: vehicle.image,
					}),
				};
			}

			const { data } = await xior.get<VehicleResponse>(
				`https://wdapi2.com.br/consulta/${plate}/${environment.APIPLACAS_TOKEN}`,
			);

			if (
				data?.situacao === null ||
				// @ts-expect-error
				data?.detail
					.toLowerCase()
					.includes('erro')
			) {
				throw new Error('Veículo não encontrado');
			}

			let manufacturer = await transaction.manufacturerVehicle.findFirst({
				where: {
					slugs: {
						has: data.marca.toLowerCase(),
					},
				},
				select: {
					id: true,
				},
			});

			if (!manufacturer) {
				const icon = await xior
					.get(data.logo, {
						responseType: 'blob',
					})
					.catch(() => null);

				const manufacturerId = Bun.randomUUIDv7();

				const pathIcon = `/manufacturers/${manufacturerId}`;

				if (icon) {
					await storage.write(pathIcon, icon.data);
				}

				manufacturer = await transaction.manufacturerVehicle.create({
					data: {
						id: manufacturerId,
						name: data.marca.toLowerCase(),
						...(pathIcon && {
							icon: pathIcon,
						}),
						slugs: [data.marca.toLowerCase()],
					},
					select: {
						id: true,
						name: true,
						icon: true,
						image: true,
					},
				});
			}

			if (!manufacturer) {
				throw new Error('Falha na consulta da fabricante do veículo');
			}

			const response = await transaction.vehicle.create({
				data: {
					plate: Number.isInteger(Number(data.placa[4]))
						? data.placa.toLowerCase().replace('-', '')
						: data.placa_alternativa.toLowerCase().replace('-', ''),
					plateAlternative: Number.isInteger(Number(data.placa[4]))
						? data.placa_alternativa.toLowerCase().replace('-', '')
						: data.placa.toLowerCase().replace('-', ''),
					model: data.modelo.toLowerCase(),
					modelYear: Number(data.anoModelo),
					manufacturer: {
						connect: {
							id: manufacturer.id,
						},
					},
					...((data.extra?.chassi || data.chassi) && {
						chassi:
							data.extra?.chassi?.padStart(17, '*') ||
							data.chassi.toLowerCase(),
					}),
				},
				select: {
					id: true,
					plate: true,
					plateAlternative: true,
					model: true,
					modelYear: true,
					manufacturer: {
						select: {
							id: true,
							name: true,
							icon: true,
							image: true,
						},
					},
					exchange: true,
					chassi: true,
					image: true,
				},
			});

			return {
				id: response.id,
				plate: response.plate,
				plateAlternative: response.plateAlternative,
				model: response.model,
				modelYear: response.modelYear,
				manufacturer: {
					id: response.manufacturer.id,
					name: response.manufacturer.name,
					icon: response.manufacturer.icon,
					...(response.manufacturer.image && {
						image: response.manufacturer.image,
					}),
				},
				...(response.exchange && {
					exchange: response.exchange,
				}),
				...(response.chassi && {
					chassi: response.chassi,
				}),
				...(response.image && {
					image: response.image,
				}),
			};
		});
	} catch (error) {
		let message = 'Falha ao consultar a placa';

		if (error instanceof XiorError) {
			if (error.response?.data.message) {
				message = error.response?.data.message;
			}
		}

		if (error instanceof Error) {
			if (error.message) {
				message = error.message;
			}
		}

		throw new Error(message);
	}
}

export { vehicleByPlate };
