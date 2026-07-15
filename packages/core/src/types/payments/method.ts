import type z from 'zod';
import type { SchemaPaymentMethod } from '../../schemas/payments/method';

type PaymentMethod = z.infer<typeof SchemaPaymentMethod>;

export type { PaymentMethod };
