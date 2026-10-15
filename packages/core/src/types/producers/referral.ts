import type z from 'zod';
import type {
	SchemaProducerReferral,
	SchemaProducerReferralResponse,
} from '../../schemas/producers';

type ProducerReferral = z.infer<typeof SchemaProducerReferral>;

type ProducerReferralResponse = z.infer<typeof SchemaProducerReferralResponse>;

export type { ProducerReferral, ProducerReferralResponse };
