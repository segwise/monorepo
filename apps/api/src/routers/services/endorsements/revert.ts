import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import {
	captureEndorsementState,
	getRevertStatus,
	isSnapshot,
	matchesState,
	type SafeState,
} from '@/functions/endorsements/snapshot';
import type { Prisma } from '@segwise/database/client';
import { Role, type StatusSafe } from '@segwise/database/enums';

class RevertError extends Error {
	constructor(
		message: string,
		readonly status: 401 | 403 | 404 | 409,
	) {
		super(message);
	}
}

const MESSAGES = {
	reverted: 'Este endosso já foi revertido',
	no_snapshot:
		'Este endosso é anterior ao recurso de reversão e não tem os dados anteriores guardados',
	expired: 'O prazo de 24 horas para reverter este endosso terminou',
	not_latest:
		'Só o endosso mais recente da proposta pode ser revertido. Reverta primeiro os mais novos',
} as const;

// Reverte um endosso: devolve os campos da proposta ao estado anterior e marca o
// endosso como revertido (ele continua na lista). Regras em `getRevertStatus`.
function registerRoutersServicesEndorsementsRevert(server: Server) {
	server.post('/:endorsementId{[0-9a-f-]{36}}/revert', async (ctx) => {
		const safeId = ctx.req.param('id') as string;
		const endorsementId = ctx.req.param('endorsementId') as string;

		const { brokerId, brokerRole, userId } = ctx.session ?? {};

		if (!brokerId || !userId) {
			return ctx.json({ message: 'Não autorizado' }, 401);
		}

		if (brokerRole === Role.producer) {
			return ctx.json({ message: 'Sem permissão para reverter endossos' }, 403);
		}

		try {
			await ctx.database.$transaction(async (transaction) => {
				// Serializa reversões/endossos da mesma proposta.
				await transaction.$queryRaw`SELECT id FROM safes WHERE id = ${safeId}::uuid FOR UPDATE`;

				const endorsement = await transaction.endorsement.findFirst({
					where: { id: endorsementId, safeId, safe: { brokerId } },
					select: {
						id: true,
						type: true,
						createdAt: true,
						revertedAt: true,
						snapshot: true,
					},
				});

				if (!endorsement) {
					throw new RevertError('Endosso não encontrado', 404);
				}

				const latest = await transaction.endorsement.findFirst({
					where: { safeId, revertedAt: null },
					orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
					select: { id: true },
				});

				const { canRevert, reason } = getRevertStatus({
					endorsement,
					latestRevertibleId: latest?.id ?? null,
				});

				if (!canRevert || !isSnapshot(endorsement.snapshot)) {
					throw new RevertError(
						reason ? MESSAGES[reason] : 'Endosso não pode ser revertido',
						409,
					);
				}

				const { before, after } = endorsement.snapshot;

				// A proposta foi mexida depois do endosso? Então reverter por cima
				// apagaria essa alteração: recusa.
				const current = await captureEndorsementState(
					transaction,
					safeId,
					endorsement.type,
				);

				if (!matchesState(current, after)) {
					throw new RevertError(
						'A proposta foi alterada depois deste endosso e não pode ser revertida automaticamente. Ajuste os dados manualmente',
						409,
					);
				}

				// Reivindica a reversão: se outra requisição chegou antes, count = 0.
				const { count } = await transaction.endorsement.updateMany({
					where: { id: endorsement.id, revertedAt: null },
					data: { revertedAt: new Date(), revertedById: userId },
				});

				if (count === 0) {
					throw new RevertError(MESSAGES.reverted, 409);
				}

				await restore(transaction, safeId, before, after);
			});

			return ctx.json({ message: 'Endosso revertido com sucesso' }, 200);
		} catch (error) {
			if (error instanceof RevertError) {
				return ctx.json({ message: error.message }, error.status);
			}

			throw error;
		}
	});
}

async function restore(
	transaction: Pick<Database, 'safe' | 'vehicleWithoutPlate'>,
	safeId: string,
	before: SafeState,
	after: SafeState,
) {
	const has = (key: keyof SafeState) => key in before;

	const date = (value: string | number | null | undefined) =>
		value == null ? null : new Date(String(value));

	const safeData: Prisma.SafeUpdateInput = {};

	if (has('franchise')) {
		safeData.franchise =
			before.franchise == null ? null : String(before.franchise);
	}

	if (has('status')) {
		safeData.status = before.status as StatusSafe;
	}

	if (has('statusAt')) {
		safeData.statusAt = date(before.statusAt) as Date;
	}

	if (has('statusMessage')) {
		safeData.statusMessage = (before.statusMessage ?? null) as string | null;
	}

	if (has('canceledAt')) {
		safeData.canceledAt = date(before.canceledAt);
	}

	const vehicle: Prisma.SafeVehicleUpdateWithoutSafeInput = {};

	if (has('overnightPostalCode')) {
		vehicle.overnightPostalCode = before.overnightPostalCode as string;
	}

	if (has('plate')) {
		vehicle.plate = (before.plate ?? null) as string | null;
	}

	if (has('driverCPF')) {
		vehicle.driverCPF = (before.driverCPF ?? null) as string | null;
	}

	if (has('driverName')) {
		vehicle.driverName = (before.driverName ?? null) as string | null;
	}

	if (has('driverBirth')) {
		vehicle.driverBirth = date(before.driverBirth);
	}

	if (has('driverAge')) {
		vehicle.driverAge = (before.driverAge ?? null) as number | null;
	}

	if (has('vehicleId')) {
		vehicle.vehicle = before.vehicleId
			? { connect: { id: String(before.vehicleId) } }
			: { disconnect: true };
	}

	if (has('vehicleWithoutPlateId')) {
		vehicle.vehicleWithoutPlate = before.vehicleWithoutPlateId
			? { connect: { id: String(before.vehicleWithoutPlateId) } }
			: { disconnect: true };
	}

	if (Object.keys(vehicle).length > 0) {
		safeData.safeVehicle = { update: vehicle };
	}

	await transaction.safe.update({ where: { id: safeId }, data: safeData });

	// O veículo sem placa criado pelo endosso fica sem uso: apaga, se nada mais o usa.
	const created = after.vehicleWithoutPlateId;

	if (created && created !== before.vehicleWithoutPlateId) {
		await transaction.vehicleWithoutPlate.deleteMany({
			where: {
				id: String(created),
				safeVehicles: { none: {} },
				quoteVehicles: { none: {} },
				endorsements: { none: {} },
			},
		});
	}
}

export { registerRoutersServicesEndorsementsRevert };
