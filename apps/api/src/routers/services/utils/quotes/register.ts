import { zValidator } from '@hono/zod-validator';
import { SchemaQuoteSimpleRegister } from '@segwise/core';
import { endOfDay, endOfMonth, subYears } from 'date-fns';
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

			const referralResponse = referral
				? await ctx.database.member.findUnique({
						where: {
							referral,
						},
					})
				: null;

			try {
				let quote = null;
				let safe = null;

				await ctx.database.$transaction(async (transaction) => {
					const temporaryInsured = await transaction.temporaryInsured.create({
						data: {
							broker: {
								connect: {
									id: referralResponse?.brokerId,
								},
							},
							name: insured.name,
							phone: insured.phone,
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
							producer: {
								connect: {
									id: referralResponse?.userId,
								},
							},
							broker: {
								connect: {
									id: referralResponse?.brokerId,
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
								producer: {
									connect: {
										id: referralResponse?.userId,
									},
								},
								broker: {
									connect: {
										id: referralResponse?.brokerId,
									},
								},
								isExternal: true,
								temporaryInsured: {
									connect: {
										id: temporaryInsured.id,
									},
								},
								modality: ModalityInsurance.car,
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
								...(expiration
									? {
											expiration: endOfDay(expiration),
											requestedAt: subYears(endOfDay(expiration), 1),
										}
									: {
											expiration: endOfMonth(new Date()),
											requestedAt: subYears(endOfMonth(new Date()), 1),
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
}

export { registerRoutersServicesUtilsQuotesRegister };
