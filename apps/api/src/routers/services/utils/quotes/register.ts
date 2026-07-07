import { zValidator } from '@hono/zod-validator';
import {
	isCNPJ,
	isCPF,
	SchemaQuoteSimpleCustomRegister,
	SchemaQuoteSimpleRegister,
} from '@segwise/core';
import { endOfDay, endOfMonth } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { vehicleByPlate } from '@/functions/vehicle/by-plate';
import { ModalityInsurance } from '@/generated/prisma/enums';

function registerRoutersServicesUtilsQuotesRegister(server: Server) {
	server.post(
		'/simple',
		zValidator('json', SchemaQuoteSimpleRegister),
		zValidator(
			'query',
			z.object({
				asResponse: z
					.boolean()
					.or(
						z.literal(['true', 'false']).transform((value) => value === 'true'),
					)
					.nullish(),
			}),
		),
		async (ctx) => {
			const { asResponse } = ctx.req.valid('query');

			const {
				modality,
				renewal,
				association,
				insured,
				plate,
				usage,
				postalCode,
				insuranceCompany,
				expiration,
				franchise,
				referral,
			} = ctx.req.valid('json');

			let brokerId = null;

			const referralResponse = referral
				? await ctx.database.member.findUnique({
						where: {
							referral,
						},
						select: {
							userId: true,
							brokerId: true,
						},
					})
				: null;

			if (referralResponse?.brokerId) {
				brokerId = referralResponse?.brokerId;
			}

			if (!brokerId) {
				const broker = await ctx.database.broker.findFirst({
					orderBy: {
						createdAt: 'asc',
					},
					select: {
						id: true,
					},
				});

				if (!broker?.id) {
					throw new Error('Nenhuma corretora vinculada');
				}

				brokerId = broker?.id;
			}

			try {
				let quote = null;
				let safe = null;

				await ctx.database.$transaction(async (transaction) => {
					const temporaryInsured = await transaction.temporaryInsured.upsert({
						// @ts-expect-error
						where: {
							...(isCPF(insured.registration) && {
								brokerId_cpf: {
									brokerId,
									cpf: insured.registration,
								},
							}),
							...(isCNPJ(insured.registration) && {
								brokerId_cnpj: {
									brokerId,
									cnpj: insured.registration,
								},
							}),
						},
						data: {
							broker: {
								connect: {
									id: brokerId,
								},
							},
							name: insured?.name as string,
							...(isCPF(insured.registration) && {
								cpf: insured.registration,
							}),
							...(isCNPJ(insured.registration) && {
								cnpj: insured.registration,
							}),
							phone: insured?.phone as string,
							...(insured?.maritalStatus && {
								maritalStatus: insured?.maritalStatus,
							}),
						},
						select: {
							id: true,
						},
					});

					const vehicle = plate ? await vehicleByPlate(plate) : null;

					if (plate && !vehicle) {
						throw new Error('Falha ao consultar dados do veículo');
					}

					const response = await transaction.quote.create({
						data: {
							...(referralResponse && {
								producer: {
									connect: {
										id: referralResponse.userId,
									},
								},
							}),
							broker: {
								connect: {
									id: brokerId,
								},
							},
							modality,
							...(!!renewal && {
								renewal,
							}),
							...(!!association && {
								association,
							}),
							temporaryInsured: {
								connect: {
									id: temporaryInsured.id,
								},
							},
							quoteVehicle: {
								create: {
									plate,
									...(!!vehicle && {
										vehicle: {
											connectOrCreate: {
												where: {
													id: vehicle.id,
												},
												create: {
													plate: vehicle.plate,
													plateAlternative: vehicle.plate,
													manufacturer: {
														connect: {
															id: vehicle.manufacturer.id,
														},
													},
													model: vehicle.model,
													modelYear: vehicle.modelYear,
													...(vehicle.exchange && {
														exchange: vehicle.exchange,
													}),
													...(vehicle.chassi && {
														chassi: vehicle.chassi,
													}),
												},
											},
										},
									}),
									...(!vehicle && {
										vehicleWithoutPlate: {
											create: {},
										},
									}),
									usage,
									overnightPostalCode: postalCode,
								},
							},
							...(insuranceCompany && {
								insuranceCompany: {
									connect: {
										id: insuranceCompany,
									},
								},
							}),
							...(expiration && {
								expiration,
							}),
							franchise,
						},
						select: {
							id: true,
						},
						relationLoadStrategy: 'join',
					});

					quote = response.id;

					if (renewal) {
						const response = await transaction.safe.create({
							data: {
								...(referralResponse && {
									producer: {
										connect: {
											id: referralResponse.userId,
										},
									},
								}),
								broker: {
									connect: {
										id: brokerId,
									},
								},
								isExternal: true,
								temporaryInsured: {
									connect: {
										id: temporaryInsured.id,
									},
								},
								modality: ModalityInsurance.vehicle,
								...(!!insuranceCompany && {
									insuranceCompany: {
										connect: {
											id: insuranceCompany,
										},
									},
								}),
								safeVehicle: {
									create: {
										plate,
										...(!!vehicle && {
											vehicle: {
												connectOrCreate: {
													where: {
														id: vehicle.id,
													},
													create: {
														plate: vehicle.plate,
														plateAlternative: vehicle.plate,
														manufacturer: {
															connect: {
																id: vehicle.manufacturer.id,
															},
														},
														model: vehicle.model,
														modelYear: vehicle.modelYear,
														...(vehicle.exchange && {
															exchange: vehicle.exchange,
														}),
														...(vehicle.chassi && {
															chassi: vehicle.chassi,
														}),
													},
												},
											},
										}),
										...(!vehicle && {
											vehicleWithoutPlate: {
												create: {},
											},
										}),
										usage,
										overnightPostalCode: postalCode,
									},
								},
								requestedAt: new Date(),
								...(expiration
									? {
											expiration: endOfDay(expiration),
										}
									: {
											expiration: endOfMonth(new Date()),
										}),
								franchise,
							},
							select: {
								id: true,
							},
							relationLoadStrategy: 'join',
						});

						safe = response.id;
					}
				});

				return ctx.json(
					!asResponse
						? {
								message: 'Cadastrado com sucesso',
							}
						: !safe
							? {
									quote,
								}
							: {
									quote,
									safe,
								},
					200,
				);
			} catch (error) {
				let message = 'Falha ao registrar';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					500,
				);
			}
		},
	);

	server.post(
		'/simple/custom',
		zValidator('json', SchemaQuoteSimpleCustomRegister),
		async (ctx) => {
			const { type, insured, referral } = ctx.req.valid('json');

			let brokerId = null;

			const referralResponse = referral
				? await ctx.database.member.findUnique({
						where: {
							referral,
						},
						select: {
							userId: true,
							brokerId: true,
						},
					})
				: null;

			if (referralResponse?.brokerId) {
				brokerId = referralResponse?.brokerId;
			}

			if (!brokerId) {
				const broker = await ctx.database.broker.findFirst({
					orderBy: {
						createdAt: 'asc',
					},
					select: {
						id: true,
					},
				});

				if (!broker?.id) {
					throw new Error('Nenhuma corretora vinculada');
				}

				brokerId = broker?.id;
			}

			try {
				await ctx.database.$transaction(async (transaction) => {
					const temporaryInsured = await transaction.temporaryInsured.create({
						data: {
							broker: {
								connect: {
									id: brokerId,
								},
							},
							name: insured?.name as string,
							phone: insured?.phone as string,
						},
						select: {
							id: true,
						},
					});

					await transaction.quote.create({
						data: {
							modality: type,
							...(referralResponse && {
								producer: {
									connect: {
										id: referralResponse.userId,
									},
								},
							}),
							broker: {
								connect: {
									id: brokerId,
								},
							},
							temporaryInsured: {
								connect: {
									id: temporaryInsured.id,
								},
							},
						},
						select: {
							id: true,
						},
						relationLoadStrategy: 'join',
					});
				});

				return ctx.json(
					{
						message: 'Cadastrado com sucesso',
					},
					200,
				);
			} catch (error) {
				let message = 'Falha ao registrar';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					500,
				);
			}
		},
	);
}

export { registerRoutersServicesUtilsQuotesRegister };
