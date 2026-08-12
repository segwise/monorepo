import { zValidator } from '@hono/zod-validator';
import {
	calculateInstallmentAmount,
	calculatePercentageOfValue,
	isCNPJ,
	isCPF,
	SchemaSafeRegister,
} from '@segwise/core';
import {
	addDays,
	addMonths,
	addYears,
	differenceInYears,
	isSameDay,
	isSaturday,
	isSunday,
	setHours,
	setMinutes,
	startOfDay,
	startOfMonth,
} from 'date-fns';
import type { Server } from '@/@types/server';
import { MethodPayment, StatusPayment } from '@/generated/prisma/enums';
import { Decimal } from '@/generated/prisma/internal/prismaNamespace';

function registerRoutersServicesSafesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaSafeRegister), async (ctx) => {
		const brokerId = ctx.session.brokerId;

		if (!brokerId) {
			return ctx.json(
				{
					message: 'Usuários sem corretora vinculada',
				},
				401,
			);
		}

		const {
			modality,
			renewal,
			status,
			requestedAt,
			insured,
			vehicle,
			driver,
			producer,
			insuranceCompany,
			receivables,
			commissions,
		} = ctx.req.valid('json');

		if (producer) {
			const response = await ctx.database.user.findUnique({
				where: {
					id: producer,
				},
				select: {
					role: true,
					members: {
						where: {
							brokerId,
						},
						select: {
							brokerId: true,
						},
					},
				},
			});

			if (!response) {
				throw new Error('Produtor não encontrado!');
			}
		}

		await ctx.database.$transaction(async (transaction) => {
			const isInsured = await transaction.insured.findFirst({
				where: {
					...(isCPF(insured.registration) && {
						cpf: insured.registration,
					}),
					...(isCNPJ(insured.registration) && {
						cnpj: insured.registration,
					}),
					brokerId,
				},
				select: {
					id: true,
				},
			});

			let insuredConfirmId: string | null = isInsured?.id || null;

			if (!isInsured) {
				insuredConfirmId = await transaction.insured
					.create({
						data: {
							broker: {
								connect: {
									id: brokerId,
								},
							},
							...(isCPF(insured.registration) && {
								cpf: insured.registration,
							}),
							...(isCNPJ(insured.registration) && {
								cnpj: insured.registration,
							}),
							name: insured.name,
							birth: insured.birth,
							age: differenceInYears(new Date(), insured.birth),
							phone: insured.phone,
							...(insured.profession && {
								profession: insured.profession,
							}),
						},
						select: {
							id: true,
						},
					})
					.then((response) => response.id);
			} else {
				await transaction.insured.update({
					where: {
						id: insuredConfirmId as string,
					},
					data: {
						name: insured.name,
						birth: insured.birth,
						age: differenceInYears(new Date(), insured.birth),
						phone: insured.phone,
						...(insured.profession && {
							profession: insured.profession,
						}),
					},
					select: {
						id: true,
					},
				});
			}

			const installments = receivables.installments;
			const award = receivables.award;
			const commissionPercentage = receivables.commission;
			const commissionAmount = calculatePercentageOfValue(
				award,
				commissionPercentage,
			);

			const installmentsProducer = commissions?.installments || 0;
			const commissionPercentageProducer = commissions?.percentage || 0;
			const commissionAmountProducer = calculatePercentageOfValue(
				commissions?.type === 'by_the_brokerage_commission'
					? commissionAmount
					: commissions?.type === 'by_the_net_premium'
						? award
						: 0,
				commissionPercentageProducer,
			);

			const commissionGross = commissionAmount;
			const commissionNet = commissionAmount - commissionAmountProducer;

			const requestedAtUpdate = isSameDay(new Date(), requestedAt)
				? setMinutes(
						setHours(startOfDay(requestedAt), new Date().getHours()),
						new Date().getMinutes(),
					)
				: startOfDay(requestedAt);

			const vehicleId = vehicle?.plate
				? await transaction.vehicle
						.findFirst({
							where: {
								OR: [
									{
										plate: vehicle.plate,
									},
									{
										plateAlternative: vehicle.plate,
									},
								],
							},
							select: {
								id: true,
							},
						})
						.then((response) => response?.id)
				: null;

			const { id: safeId, safeVehicle } = await transaction.safe.create({
				data: {
					broker: {
						connect: {
							id: brokerId,
						},
					},
					...(!!producer && {
						producer: {
							connect: {
								id: producer,
							},
						},
					}),
					modality,
					renewal,
					insuranceCompany: {
						connect: {
							id: insuranceCompany,
						},
					},
					status,
					expiration: addYears(requestedAtUpdate, 1),
					requestedAt: requestedAtUpdate,
					insured: {
						connect: {
							id: insuredConfirmId as string,
						},
					},
					...(!!vehicle && {
						safeVehicle: {
							create: {
								plate: vehicle.plate,
								...(vehicle.plate &&
									vehicleId && {
										vehicle: {
											connect: {
												id: vehicleId,
											},
										},
									}),
								...(vehicle.plate &&
									!vehicleId && {
										vehicleWithoutPlate: {
											create: {
												...(vehicle.manufacturer && {
													manufacturer: {
														connect: {
															id: vehicle.manufacturer,
														},
													},
												}),
												model: vehicle.model,
												modelYear: vehicle.modelYear,
												...(vehicle.exchange && {
													exchange: vehicle.exchange,
												}),
											},
										},
									}),
								...(!vehicle.plate && {
									vehicleWithoutPlate: {
										create: {
											...(vehicle.manufacturer && {
												manufacturer: {
													connect: {
														id: vehicle.manufacturer,
													},
												},
											}),
											model: vehicle.model,
											modelYear: vehicle.modelYear,
											...(vehicle.exchange && {
												exchange: vehicle.exchange,
											}),
										},
									},
								}),
								usage: vehicle.usage,
								overnightPostalCode: vehicle.overnightPostalCode,
								...(insured.registration !== driver.registration && {
									driverCPF: driver.registration,
									driverName: driver.name,
									driverBirth: driver.birth,
									driverAge: differenceInYears(new Date(), driver.birth),
								}),
							},
						},
					}),
					installments,
					award,
					franchise: receivables.franchise ?? null,
					commission: commissionPercentage,
					commissionAmount,
					commissionGross,
					commissionNet,
					...(commissions && {
						commissionAmountProducer,
						commissionOfType: commissions.type,
						commissionPercentage: commissionPercentageProducer,
						...(commissions.discountPercentage && {
							commissionDiscountPercentage: commissions.discountPercentage,
						}),
						...(commissions.discountFixed && {
							commissionDiscountFixed: commissions.discountFixed,
						}),
						commissionInstallments: installmentsProducer,
						commissionMonthlyInterest: commissions.monthlyInterest,
						commissionPayInterestStarting: commissions.payInterestStarting,
						commissionTypeOfInterest: commissions.typeOfInterest,
						commissionPaymentDate: commissions.paymentDate,
					}),
				},
				select: {
					id: true,
					safeVehicle: {
						select: {
							vehicleId: true,
							vehicleWithoutPlateId: true,
						},
					},
				},
				relationLoadStrategy: 'join',
			});

			if (safeVehicle?.vehicleId && vehicle?.exchange) {
				await transaction.vehicle.update({
					where: {
						id: safeVehicle.vehicleId,
					},
					data: {
						exchange: vehicle.exchange,
					},
				});
			}

			if (safeVehicle?.vehicleWithoutPlateId && vehicle?.exchange) {
				await transaction.vehicleWithoutPlate.update({
					where: {
						id: safeVehicle.vehicleWithoutPlateId,
					},
					data: {
						exchange: vehicle.exchange,
					},
				});
			}

			let dueDate = startOfDay(
				addDays(addMonths(startOfMonth(requestedAtUpdate), 1), 10),
			);

			if (isSaturday(dueDate) || isSunday(dueDate)) {
				dueDate = addDays(dueDate, isSaturday(dueDate) ? 2 : 1);
			}

			await transaction.payment.create({
				data: {
					payer: {
						connectOrCreate: {
							where: { id: insuranceCompany },
							create: {
								id: insuranceCompany,
								insuranceCompanyId: insuranceCompany,
							},
						},
					},
					receiver: {
						connectOrCreate: {
							where: { id: brokerId },
							create: { id: brokerId, brokerId },
						},
					},
					metadata: {
						safeId,
					},
					installment: 1,
					amount: commissionAmount,
					expiration: dueDate,
					status: StatusPayment.waiting,
					method: MethodPayment.pix,
					description: 'Comissão sobre venda de seguro',
				},
			});

			if (commissions && producer) {
				if (commissions?.type === 'fixed_value') {
					throw new Error('Tipo de comissão fixa não disponível no momento');
				}

				if (commissions.discountFixed || commissions.discountPercentage) {
					throw new Error('Desconto de pagamento não disponível no momento');
				}

				if (commissions.monthlyInterest) {
					throw new Error('Juros de pagamento não disponível no momento');
				}

				const amount = new Decimal(
					commissions.type === 'by_the_brokerage_commission'
						? calculatePercentageOfValue(
								calculatePercentageOfValue(
									receivables.award,
									receivables.commission,
								),
								commissions.percentage,
							)
						: commissions.type === 'by_the_net_premium'
							? calculatePercentageOfValue(
									receivables.award,
									commissions.percentage,
								)
							: 0,
				);

				const installments = installmentsProducer;

				const paymentPrimaryId = Bun.randomUUIDv7();

				for (let i = 0; i < installments; i++) {
					let dueDate = addMonths(commissions.paymentDate, i);

					dueDate = startOfDay(dueDate);

					if (isSaturday(dueDate) || isSunday(dueDate)) {
						dueDate = addDays(dueDate, isSaturday(dueDate) ? 2 : 1);
					}

					await transaction.payment.create({
						data: {
							...(i === 0 && {
								id: paymentPrimaryId,
							}),
							payer: {
								connectOrCreate: {
									where: { id: brokerId },
									create: { id: brokerId, brokerId },
								},
							},
							receiver: {
								connectOrCreate: {
									where: { id: producer },
									create: { id: producer, userId: producer },
								},
							},
							metadata: {
								safeId,
							},
							installment: i + 1,
							amount: calculateInstallmentAmount(amount, i, installments),
							expiration: dueDate,
							status: StatusPayment.waiting,
							...(paymentPrimaryId &&
								i > 0 && {
									relatedPayment: {
										connect: {
											id: paymentPrimaryId,
										},
									},
								}),
							method: MethodPayment.pix,
							description: 'Comissão de produção sobre venda de seguro',
						},
					});
				}
			}
		});

		return ctx.json(
			{
				message: 'Cadastrado com sucesso',
			},
			200,
		);
	});
}

export { registerRoutersServicesSafesRegister };
