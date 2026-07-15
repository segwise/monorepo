import type z from 'zod';
import type { SchemaPaymentType } from '../../schemas/payments/type';

type PaymentType = z.infer<typeof SchemaPaymentType>;

export type { PaymentType };
