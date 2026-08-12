import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementVehicleConductor } from '@segwise/core/schemas';
import { differenceInYears } from 'date-fns';
import type { Server } from '@/@types/server';
import { documentByCPF } from '@/functions/document/by-cpf';
import { EndorsementType } from '@/generated/prisma/enums';

function registerRoutersServicesEndorsementsVehicleConductor(server: Server) {
	server.get('/vehicle-conductor', async (ctx) => {
		const id = ctx.req.param('id');

		if (!id) {
			return ctx.json(
				{
					message: 'ID do seguro não informado',
				},
				409,
			);
		}

		const safe = await ctx.database.safe.findUnique({
			where: {
				id,
			},
			select: {
				insured: {
					select: {
						cpf: true,
						name: true,
					},
				},
				safeVehicle: {
					select: {
						driverCPF: true,
						driverName: true,
						plate: true,
						vehicle: {
							select: {
								model: true,
								modelYear: true,
							},
						},
						vehicleWithoutPlate: {
							select: {
								model: true,
								modelYear: true,
							},
						},
					},
				},
			},
		});

		if (!safe) {
			return ctx.json(
				{
					message: 'Seguro não encontrado',
				},
				401,
			);
		}

		return ctx.json(
			{
				vehicle: {
					plate: safe.safeVehicle?.plate,
					model:
						safe.safeVehicle?.vehicle?.model ??
						safe.safeVehicle?.vehicleWithoutPlate?.model,
					modelYear:
						safe.safeVehicle?.vehicle?.modelYear ??
						safe.safeVehicle?.vehicleWithoutPlate?.modelYear,
				},
				driver: {
					cpf: safe.safeVehicle?.driverCPF ?? safe.insured?.cpf,
					name: safe.safeVehicle?.driverName ?? safe.insured?.name,
				},
			},
			200,
		);
	});

	server.post(
		'/vehicle-conductor',
		zValidator('json', SchemaEndorsementVehicleConductor),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.vehicle_driver;

			const { driver, plate, model, modelYear, franchise, amount, percentage } =
				ctx.req.valid('json');

			const commission = percentage ? amount * (percentage / 100) : null;

			if (!id) {
				return ctx.json(
					{
						message: 'ID do seguro não informado',
					},
					409,
				);
			}

			const driverResponse = await documentByCPF(driver);

			await ctx.database.$transaction(async (transaction) => {
				const plateDb = plate
					? await transaction.vehicle.findFirst({
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
							},
						})
					: null;

				if (plate) {
					await transaction.safe.update({
						where: {
							id,
						},
						data: {
							safeVehicle: {
								update: {
									vehicle: {
										disconnect: true,
									},
								},
							},
						},
					});
				}

				await transaction.safe.update({
					where: {
						id,
					},
					data: {
						franchise,
						safeVehicle: {
							update: {
								plate,
								driverCPF: driverResponse.cpfOrCnpj,
								driverName: driverResponse.name,
								driverBirth: driverResponse.birth,
								driverAge: differenceInYears(new Date(), driverResponse.birth),
								...(plate &&
									plateDb && {
										vehicle: {
											connect: {
												id: plateDb.id,
											},
										},
									}),
								...(plate &&
									!plateDb && {
										vehicleWithoutPlate: {
											upsert: {
												create: {
													model,
													modelYear,
												},
												update: {
													manufacturer: {
														disconnect: true,
													},
													model,
													modelYear,
												},
											},
										},
									}),
								...(!plate && {
									vehicleWithoutPlate: {
										update: {
											manufacturer: {
												disconnect: true,
											},
											model,
											modelYear,
										},
									},
								}),
							},
						},
						endorsements: {
							create: {
								type,
								franchise,
								amount,
								percentage,
								commission,
							},
						},
					},
				});
			});

			return ctx.json(
				{
					message: 'Endosso de veículo ou condutor registrado',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesEndorsementsVehicleConductor };
