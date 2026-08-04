import { type Document, maskNumber, SchemaCPF } from '@segwise/core';
import { parse, startOfDay, startOfToday } from 'date-fns';
import xior, { XiorError } from 'xior';
import { environment } from '@/libraries/environment';
import { cache } from '@/services/cache';
import { database } from '@/services/database';

type CPFResponse = {
	status: 0 | 1;
	cpf: string;
	nome: string;
	nascimento: string;
	pacoteUsado: number;
	saldo: number;
	consultaID: string;
	delay: number;
};

async function documentByCPF(value: string): Promise<Document> {
	try {
		return await database.$transaction(async (transaction) => {
			const cpf = SchemaCPF.parse(value);

			const existsCache = await cache.get(`document:cpf:${cpf}`);

			if (existsCache) {
				const response = JSON.parse(existsCache);

				return response;
			}

			const [existsTemporaryInsured, existsInsured] =
				await transaction.$transaction([
					transaction.temporaryInsured.findFirst({
						where: {
							cpf,
						},
						select: {
							name: true,
							cpf: true,
							birth: true,
						},
						orderBy: {
							createdAt: 'asc',
						},
					}),
					transaction.insured.findFirst({
						where: {
							cpf,
						},
						select: {
							name: true,
							cpf: true,
							birth: true,
						},
						orderBy: {
							createdAt: 'asc',
						},
					}),
				]);

			const exists = existsInsured ?? existsTemporaryInsured;

			if (exists) {
				const response = exists;

				const data = {
					name: response.name.toLowerCase(),
					cpfOrCnpj: maskNumber(response.cpf as string),
					birth: startOfDay(response.birth as Date),
				};

				await cache.set(`document:cpf:${cpf}`, JSON.stringify(data));

				return data;
			}

			const { data } = await xior.get<CPFResponse>(
				`https://api.cpfcnpj.com.br/${environment.CPFCNPJ_TOKEN}/7/${cpf}`,
			);

			if (data.status === 0) {
				throw new Error('CPF não encontrado');
			}

			const dataResponse = {
				name: data.nome.toLowerCase(),
				cpfOrCnpj: maskNumber(data.cpf),
				birth: startOfDay(parse(data.nascimento, 'dd/MM/yyyy', startOfToday())),
			};

			await cache.set(`document:cpf:${cpf}`, JSON.stringify(dataResponse));

			return dataResponse;
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

export { documentByCPF };
