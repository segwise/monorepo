import type { Server } from '@/@types/server.d';
import type { InsuranceCompanyWhereUniqueInput } from '@/generated/prisma/models';
import { selectPrisma as selectPrismaDetails } from '@/libraries/database/adapters/insurance-company/details';
import { serializer as serializerDetails } from '@/libraries/database/serializers/insurance-company/details';

function registerRoutersServicesInsuranceCompaniesByIdListining(
	server: Server,
) {
	server.get(`/`, async (ctx) => {
		const id = ctx.req.param('id');

		const where: InsuranceCompanyWhereUniqueInput = {
			id,
		};

		const insuranceCompany = await ctx.database.insuranceCompany.findUnique({
			where,
			select: selectPrismaDetails,
		});

		if (!insuranceCompany) {
			return ctx.json(
				{
					message: 'Seguradora não encontrada',
				},
				404,
			);
		}

		const data = serializerDetails(insuranceCompany, {
			storage: ctx.storage.images,
		});

		return ctx.json(data, 200);
	});
}

export { registerRoutersServicesInsuranceCompaniesByIdListining };
