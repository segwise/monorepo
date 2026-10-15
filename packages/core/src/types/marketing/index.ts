import type z from 'zod';
import type {
	SchemaMarketingCampaign,
	SchemaMarketingContact,
} from '../../schemas';

type MarketingCampaignInput = z.infer<typeof SchemaMarketingCampaign>;
type MarketingContactInput = z.infer<typeof SchemaMarketingContact>;

type MarketingTemplateOption = {
	value: MarketingCampaignInput['template'];
	label: string;
	defaultSubject: string;
};

type MarketingCampaign = MarketingCampaignInput & {
	id: string;
	lastRunAt: string | null;
	contactsCount: number;
	createdAt: string;
};

type MarketingContact = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	city: string | null;
	state: string | null;
	createdAt: string;
	sentCount: number;
	lastSentAt: string | null;
	deliveredAt: string | null;
	openedAt: string | null;
	clickedAt: string | null;
	openCount: number;
	clickCount: number;
	status: 'never' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
};

export type {
	MarketingCampaignInput,
	MarketingContactInput,
	MarketingTemplateOption,
	MarketingCampaign,
	MarketingContact,
};
