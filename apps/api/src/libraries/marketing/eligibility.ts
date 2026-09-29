import { subDays } from 'date-fns';
import { database } from '@/services/database';

// Mesmo e-mail não é reenviado à mesma pessoa dentro dessa janela, seja no
// agendamento, em "enviar agora" ou no envio individual.
const RESEND_WINDOW_DAYS = 7;

function eligibleContactsWhere(campaignId: string, contactIds?: string[]) {
	return {
		campaignId,
		...(contactIds && { id: { in: contactIds } }),
		deliveries: {
			none: {
				status: { not: 'failed' as const },
				sentAt: { gte: subDays(new Date(), RESEND_WINDOW_DAYS) },
			},
		},
	};
}

async function findEligibleContacts(campaignId: string, contactIds?: string[]) {
	return await database.marketingContact.findMany({
		where: eligibleContactsWhere(campaignId, contactIds),
		orderBy: { name: 'asc' },
	});
}

async function countEligibleContacts(
	campaignId: string,
	contactIds?: string[],
) {
	return await database.marketingContact.count({
		where: eligibleContactsWhere(campaignId, contactIds),
	});
}

export { RESEND_WINDOW_DAYS, findEligibleContacts, countEligibleContacts };
