import type z from 'zod';
import type {
	SchemaProducerStartOfProductionPayment,
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
} from '../../schemas/producers';

type ProducerType = z.infer<typeof SchemaProducerType>;

type ProducerTypeOfPayment = z.infer<typeof SchemaProducerTypeOfPayment>;

type ProducerStartOfProductionPayment = z.infer<
	typeof SchemaProducerStartOfProductionPayment
>;

export type {
	ProducerType,
	ProducerTypeOfPayment,
	ProducerStartOfProductionPayment,
};
