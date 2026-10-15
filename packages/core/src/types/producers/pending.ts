type ProducerPendingKind = 'partner' | 'producer';

type ProducerPending = {
	id: string;
	kind: ProducerPendingKind;
	name: string | null;
	email: string;
	phone: string | null;
	referral: string | null;
	typeOfProduction: string | null;
	percentageOfProduction: number | null;
	typeOfProductionPayment: string | null;
	startOfProductionPayment: number[];
	invitedAt: string;
	expiresAt: string;
};

export type { ProducerPending, ProducerPendingKind };
