'use client';

import { maskCNPJ } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { placeholder } from '@/config/placeholder';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useSearchParams } from '@/libraries/search-params/insurance-companies';

function TableInsuranceCompaniesSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending } = useInsuranceCompaniesSimple(searchParams);

	return (
		<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4'>
			{!!isPending &&
				Array.from({ length: 32 }).map((_, index) => (
					<Skeleton key={index.toString()} className='xl:h-53 2xl:h-58' />
				))}
			{data?.map(({ name, icon, cnpj }, index) => (
				<Card key={index.toString()} className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<Image
							src={icon || placeholder.company}
							width={512}
							height={512}
							alt='Image do usuário'
							priority
							className='object-fill object-center xl:h-40 2xl:h-45'
						/>
						<div className='px-3 py-2 border-t'>
							<span className='block text-sm/tight font-medium capitalize line-clamp-2 truncate'>
								{capitalizeFirstLetters(name)}
							</span>
							<span className='block text-xs text-muted-foreground capitalize'>
								{maskCNPJ(cnpj)}
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export { TableInsuranceCompaniesSimple };
