import type { BrokerPublic } from '@segwise/core/types';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { brand } from '@/config/brand';
import { FormProducerPublicRegister } from '@/containers/forms/auth/producer-public-register';
import { getCurrentYear } from '@/functions/date/get-current-year-cache';
import { api } from '@/libraries/api';

export const metadata: Metadata = {
	title: 'Cadastro de Parceiro - Segwise',
};

async function getBrokerPublic(slug: string) {
	try {
		const { data } = await api.get<BrokerPublic>(`/producers/public/${slug}`);

		return data;
	} catch {
		return null;
	}
}

async function ProducerPublicRegisterContent({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const broker = await getBrokerPublic(slug);

	if (!broker) {
		notFound();
	}

	return (
		<>
			<h1 className='text-2xl font-bold leading-none mb-1'>
				Seja um parceiro {(broker.fantasy || broker.name).toUpperCase()}
			</h1>
			<p className='text-muted-foreground font-medium text-sm leading-none mb-1'>
				Preencha seus dados para começar a indicar clientes
			</p>
			<p className='text-muted-foreground text-xs leading-snug mb-4'>
				Este cadastro é exclusivo para parceiros (academias, escritórios,
				influenciadores etc). Produtores internos são cadastrados diretamente
				pela equipe.
			</p>
			<FormProducerPublicRegister slug={slug} />
		</>
	);
}

function ProducerPublicRegisterContentSkeleton() {
	return (
		<>
			<Skeleton className='w-64 h-7 mb-2' />
			<Skeleton className='w-48 h-4 mb-8' />
			<div className='space-y-4'>
				<Skeleton className='w-full h-10' />
				<Skeleton className='w-full h-10' />
				<Skeleton className='w-full h-10' />
				<Skeleton className='w-full h-10' />
			</div>
		</>
	);
}

function ProducerPublicRegisterPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	return (
		<div className='min-h-screen grid lg:grid-cols-2'>
			<div className='flex items-center justify-center p-8 lg:p-12'>
				<div className='w-full max-w-md'>
					<div className='mb-4'>
						<div className='flex flex-row items-center justify-start gap-x-2 mb-10'>
							<Image
								src={brand.icon}
								alt={brand.name}
								priority
								quality={100}
								className='aspect-square size-14 object-contain object-center rounded-sm bg-primary'
							/>
							<div className='leading-none'>
								<span className='block text-lg font-bold leading-none mb-1'>
									{brand.name}
								</span>
								<span className='block text-sm font-medium text-muted-foreground leading-none'>
									{brand.slogan}
								</span>
							</div>
						</div>
						<Suspense fallback={<ProducerPublicRegisterContentSkeleton />}>
							<ProducerPublicRegisterContent params={params} />
						</Suspense>
					</div>
					<div className='mt-12 text-center text-sm text-muted-foreground'>
						<p>
							© <Suspense>{getCurrentYear()}</Suspense> {brand.name}. Todos os
							direitos reservados.
						</p>
					</div>
				</div>
			</div>
			<div className='hidden lg:block relative bg-primary' />
		</div>
	);
}

export default ProducerPublicRegisterPage;
