import type { Prisma } from '@segwise/database/client';
import { format } from 'date-fns';
import type { selectPrisma } from '@/db-adapters/safe/print';

type SafePrintRow = {
	id: string;
	insuredName: string;
	insuranceCompanyName: string;
	producerName: string | null;
	expirationLabel: string;
	firstInsuranceYear: number | null;
	commissionPercentage: string;
};

function firstWords(name: string, maxWords: number) {
	return name.trim().split(/\s+/).slice(0, maxWords).join(' ');
}

function serializer(
	props: Prisma.SafeGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ firstInsuranceYear }: { firstInsuranceYear: number | null },
): SafePrintRow {
	return {
		id: props.id,
		insuredName: (
			props.insured?.name ||
			props.temporaryInsured?.name ||
			''
		).toUpperCase(),
		insuranceCompanyName: props.insuranceCompany?.name
			? firstWords(props.insuranceCompany.name, 1).toUpperCase()
			: 'NÃO DEFINIDA',
		producerName: props.producer?.name
			? firstWords(props.producer.name, 2)
			: null,
		expirationLabel: props.expiration
			? format(props.expiration, 'dd/MM/yyyy')
			: 'Sem vigência',
		firstInsuranceYear,
		commissionPercentage: props.commission
			? `${props.commission.toNumber()}%`
			: '—',
	} satisfies SafePrintRow;
}

export { serializer };
export type { SafePrintRow };
