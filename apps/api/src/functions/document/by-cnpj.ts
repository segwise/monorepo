import { type Document, maskNumber, SchemaCNPJ } from '@segwise/core';
import { parse, startOfDay, startOfToday } from 'date-fns';
import xior, { XiorError } from 'xior';
import { cache } from '@/services/cache';
import { database } from '@/services/database';

type CNPJResponse = {
	taxId: string;
	founded: string;
	company: {
		name: string;
	};
};

async function documentByCNPJ(value: string): Promise<Document> {
	try {
		return await database.$transaction(async (transaction) => {
			const cnpj = SchemaCNPJ.parse(value);

			const existsCache = await cache.get(`document:cnpj:${cnpj}`);

			if (existsCache) {
				const response = JSON.parse(existsCache);

				return response;
			}

			const [existsTemporaryInsured, existsInsured] =
				await transaction.$transaction([
					transaction.temporaryInsured.findFirst({
						where: {
							cnpj,
						},
						select: {
							name: true,
							cnpj: true,
							birth: true,
						},
					}),
					transaction.insured.findFirst({
						where: {
							cnpj,
						},
						select: {
							name: true,
							cnpj: true,
							birth: true,
						},
					}),
				]);

			const exists = existsTemporaryInsured || existsInsured;

			if (exists) {
				const response = exists;

				const data = {
					name: response.name.toLowerCase(),
					cpfOrCnpj: maskNumber(response.cnpj as string),
					birth: startOfDay(response.birth as Date),
				};

				await cache.set(`document:cnpj:${cnpj}`, JSON.stringify(data));

				return data;
			}

			const { data } = await xior.get<CNPJResponse>(
				`https://open.cnpja.com/office/${cnpj}`,
			);

			const dataResponse = {
				name: data.company.name.toLowerCase(),
				cpfOrCnpj: maskNumber(data.taxId),
				birth: startOfDay(parse(data.founded, 'yyyy-MM-dd', startOfToday())),
			};

			await cache.set(`document:cnpj:${cnpj}`, JSON.stringify(dataResponse));

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

export { documentByCNPJ };
