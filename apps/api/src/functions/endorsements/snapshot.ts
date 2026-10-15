import type { Database } from '@/@types/database';
import type { EndorsementType } from '@segwise/database/enums';

// Reversão de endossos.
//
// Cada endosso grava, na MESMA transação que altera a proposta, o estado dos campos
// que ele toca antes e depois (`Endorsement.snapshot = { before, after }`). A
// reversão só devolve esses campos, e só se a proposta ainda estiver como o endosso
// a deixou (senão sobrescreveria uma edição feita depois).

type Db = Pick<Database, 'safe'>;

type SnapshotKey =
	| 'franchise'
	| 'status'
	| 'statusAt'
	| 'statusMessage'
	| 'canceledAt'
	| 'overnightPostalCode'
	| 'plate'
	| 'vehicleId'
	| 'vehicleWithoutPlateId'
	| 'driverCPF'
	| 'driverName'
	| 'driverBirth'
	| 'driverAge';

// Só valores simples (JSON puro): Decimal vira texto com 2 casas e datas, ISO.
type SafeState = Partial<Record<SnapshotKey, string | number | null>>;

type EndorsementSnapshot = { before: SafeState; after: SafeState };

// Campos que cada tipo de endosso altera (e, portanto, captura e reverte).
const TOUCHED: Record<EndorsementType, Array<SnapshotKey>> = {
	address: ['overnightPostalCode'],
	franchise: ['franchise'],
	cancellation: ['status', 'statusAt', 'statusMessage', 'canceledAt'],
	vehicle_driver: [
		'franchise',
		'plate',
		'vehicleId',
		'vehicleWithoutPlateId',
		'driverCPF',
		'driverName',
		'driverBirth',
		'driverAge',
	],
};

// Campos que fazem sentido mostrar ao usuário (o resto é id/detalhe interno).
const DISPLAY: Array<SnapshotKey> = [
	'franchise',
	'overnightPostalCode',
	'plate',
	'driverCPF',
	'driverName',
	'status',
	'canceledAt',
];

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000;

type RevertBlockedReason =
	| 'reverted'
	| 'expired'
	| 'not_latest'
	| 'no_snapshot';

async function captureEndorsementState(
	database: Db,
	safeId: string,
	type: EndorsementType,
): Promise<SafeState> {
	const safe = await database.safe.findUniqueOrThrow({
		where: { id: safeId },
		select: {
			franchise: true,
			status: true,
			statusAt: true,
			statusMessage: true,
			canceledAt: true,
			safeVehicle: {
				select: {
					overnightPostalCode: true,
					plate: true,
					vehicleId: true,
					vehicleWithoutPlateId: true,
					driverCPF: true,
					driverName: true,
					driverBirth: true,
					driverAge: true,
				},
			},
		},
	});

	const all: Record<SnapshotKey, string | number | null> = {
		franchise: safe.franchise?.toFixed(2) ?? null,
		status: safe.status,
		statusAt: safe.statusAt.toISOString(),
		statusMessage: safe.statusMessage,
		canceledAt: safe.canceledAt?.toISOString() ?? null,
		overnightPostalCode: safe.safeVehicle?.overnightPostalCode ?? null,
		plate: safe.safeVehicle?.plate ?? null,
		vehicleId: safe.safeVehicle?.vehicleId ?? null,
		vehicleWithoutPlateId: safe.safeVehicle?.vehicleWithoutPlateId ?? null,
		driverCPF: safe.safeVehicle?.driverCPF ?? null,
		driverName: safe.safeVehicle?.driverName ?? null,
		driverBirth: safe.safeVehicle?.driverBirth?.toISOString() ?? null,
		driverAge: safe.safeVehicle?.driverAge ?? null,
	};

	return Object.fromEntries(
		TOUCHED[type].map((key) => [key, all[key]]),
	) as SafeState;
}

function isSnapshot(value: unknown): value is EndorsementSnapshot {
	const snapshot = value as EndorsementSnapshot | null;

	return (
		!!snapshot &&
		typeof snapshot === 'object' &&
		!!snapshot.before &&
		!!snapshot.after
	);
}

// A proposta continua exatamente como o endosso a deixou?
function matchesState(current: SafeState, expected: SafeState): boolean {
	return Object.keys(expected).every(
		(key) =>
			(current[key as SnapshotKey] ?? null) ===
			(expected[key as SnapshotKey] ?? null),
	);
}

// O que a reversão altera, para mostrar ao usuário: de (hoje) → para (antes).
function describeChanges(
	snapshot: EndorsementSnapshot,
): Array<{ field: SnapshotKey; before: string | null; after: string | null }> {
	return DISPLAY.filter(
		(field) =>
			field in snapshot.after &&
			(snapshot.before[field] ?? null) !== (snapshot.after[field] ?? null),
	).map((field) => ({
		field,
		before: toText(snapshot.before[field]),
		after: toText(snapshot.after[field]),
	}));
}

const toText = (value: string | number | null | undefined) =>
	value == null ? null : String(value);

// Regras de reversão (iguais na listagem e no endpoint):
// - nunca um endosso já revertido;
// - só com os dados anteriores guardados;
// - até 24h depois de registrado;
// - só o MAIS RECENTE ainda não revertido da proposta (do mais novo para o mais
//   antigo), para não desfazer um endosso velho por cima de outros.
function getRevertStatus({
	endorsement,
	latestRevertibleId,
	now = new Date(),
}: {
	endorsement: {
		id: string;
		createdAt: Date;
		revertedAt: Date | null;
		snapshot: unknown;
	};
	latestRevertibleId: string | null;
	now?: Date;
}): { canRevert: boolean; reason: RevertBlockedReason | null; until: Date } {
	const until = new Date(endorsement.createdAt.getTime() + REVERT_WINDOW_MS);

	const reason: RevertBlockedReason | null = endorsement.revertedAt
		? 'reverted'
		: !isSnapshot(endorsement.snapshot)
			? 'no_snapshot'
			: now > until
				? 'expired'
				: endorsement.id !== latestRevertibleId
					? 'not_latest'
					: null;

	return { canRevert: reason === null, reason, until };
}

export {
	captureEndorsementState,
	describeChanges,
	type EndorsementSnapshot,
	getRevertStatus,
	isSnapshot,
	matchesState,
	REVERT_WINDOW_MS,
	type RevertBlockedReason,
	type SafeState,
	type SnapshotKey,
	TOUCHED,
};
