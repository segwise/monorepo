import { isCompany } from '@/configs/consts/company';
import { api } from '@/libraries/api';
import { cn } from '@/libraries/classname';
import { storage } from '@/libraries/storage';
import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronDownIcon, EditIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const LIMIT = 10;

export default function MyVehiclesBuyAndSell() {
	const isFocus = useIsFocused();

	const {
		data,
		isPending,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteQuery({
		queryKey: ['marketplace', storage.getString('authenticated_marketing')],
		queryFn: async ({ signal, pageParam }) => {
			const { data } = await api.get<{
				data: Array<{
					id: string;
					photo: string;
					gallery: Array<string>;
					model: string;
					year: number;
					price: number;
					mileage: number;
					color: string;
					neighborhood: string | null;
					city: string;
					state: string;
					status: 'active' | 'sold' | 'paused';
					plate: string;
					createdAt: string;
					acceptExchange?: boolean | null;
					acceptExchangeAmount?: 'down' | 'up' | null;
					acceptExchangeChange1?: string | null;
					acceptExchangeChange2?: string | null;
					acceptExchangeChange3?: string | null;
				}>;
				total: number;
				next: string | null;
				previous: string | null;
			}>(
				`/marketplace/insured/${storage.getString('authenticated_marketing')}`,
				{
					params: {
						cursor: pageParam,
						limit: LIMIT,
					},
					signal,
				},
			);

			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			if (lastPage.data.length < LIMIT) {
				return undefined;
			}

			return lastPage.next;
		},
	});

	const results = data?.pages.flatMap((response) => response.data) ?? [];

	useEffect(() => {
		if (isFocus) {
			refetch();
		}
	}, [isFocus, refetch]);

	return (
		<View>
			{isPending ? (
				<View
					style={{
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						marginVertical: 50,
						gap: 10,
					}}
				>
					<ActivityIndicator size='large' />
					<Text
						allowFontScaling={false}
						style={{
							fontSize: 15,
							textTransform: 'uppercase',
						}}
					>
						carregando...
					</Text>
				</View>
			) : data?.pages.length === 0 ? (
				<View
					style={{
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						marginVertical: 50,
						gap: 10,
					}}
				>
					<Feather name='alert-circle' size={40} />
					<Text
						allowFontScaling={false}
						style={{
							fontSize: 15,
							textTransform: 'uppercase',
						}}
					>
						nenhum anúncio
					</Text>
				</View>
			) : (
				<FlatList
					className='px-3'
					showsVerticalScrollIndicator={false}
					contentContainerClassName='pb-32'
					data={results}
					onEndReached={() => {
						if (hasNextPage) {
							fetchNextPage();
						}
					}}
					onEndReachedThreshold={16}
					ListFooterComponent={() =>
						hasNextPage && (
							<TouchableOpacity
								className='flex-row items-center justify-center mt-10'
								onPress={() => {
									fetchNextPage();
								}}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage && (
									<ActivityIndicator size={10} className='mr-3' />
								)}
								<Text className='text-sm font-medium'>
									{isFetchingNextPage ? 'Carregando...' : 'Carregar Mais'}
								</Text>
								{!isFetchingNextPage && (
									<ChevronDownIcon
										size={16}
										style={{
											marginLeft: 4,
										}}
									/>
								)}
							</TouchableOpacity>
						)
					}
					renderItem={({ item }) => (
						<Link
							href={{
								pathname: '/(stacks)/(buying-and-selling)/register-update',
								params: {
									id: item.id,
								},
							}}
							asChild
						>
							<TouchableOpacity>
								<TouchableOpacity className='absolute top-4 right-4'>
									<EditIcon size={16} />
								</TouchableOpacity>
								<View
									className='rounded-md overflow-hidden'
									style={{
										padding: 0,
										flexDirection: 'row',
										alignItems: 'flex-start',
										justifyContent: 'flex-start',
										height: 130,
										marginTop: 10,
										marginBottom: 0,
									}}
								>
									<Image
										source={{
											uri: item.photo,
										}}
										priority='high'
										contentFit='cover'
										style={{
											width: 130,
											height: 130,
										}}
									/>
									<View
										style={{
											flex: 1,
											height: '100%',
										}}
									>
										<View
											style={{
												padding: 15,
												flex: 1,
												flexDirection: 'column',
												alignItems: 'flex-start',
												justifyContent: 'space-between',
												height: '100%',
											}}
										>
											<Text
												allowFontScaling={false}
												className='font-bold text-foreground'
												style={{
													fontSize: 18,
													lineHeight: 18,
													textTransform: 'uppercase',
												}}
											>
												{item.model}
											</Text>
											<View
												style={{
													width: '100%',
												}}
											>
												<View
													style={{
														flexDirection: 'row',
														alignItems: 'flex-end',
														justifyContent: 'space-between',
														gap: 10,
														width: '100%',
														marginBottom: 5,
													}}
												>
													<Text
														allowFontScaling={false}
														className='font-medium text-foreground'
														style={{
															marginBottom: 5,
															fontSize: 12,
														}}
													>
														ANO: {String(item.year)}
													</Text>
													<Text
														allowFontScaling={false}
														className='font-semibold text-foreground'
														style={{
															marginBottom: 5,
															fontSize: 15,
														}}
													>
														{new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(item.price)}
													</Text>
												</View>
												<View
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														justifyContent: 'space-between',
														width: '100%',
													}}
												>
													<Text
														allowFontScaling={false}
														className='text-xs text-muted-foreground truncate line-clamp-1 uppercase font-medium flex-1 max-w-[80%]'
													>
														{item.state}
													</Text>
													<Text
														allowFontScaling={false}
														className='text-xs text-muted-foreground font-medium'
													>
														{format(
															new Date(item.createdAt),
															"dd/MM 'às' HH:mm",
														)}
													</Text>
												</View>
											</View>
										</View>
										{item.acceptExchange ? (
											<View
												className={cn(
													'bg-primary',
													isCompany && 'bg-primary-xcar',
												)}
												style={{
													paddingHorizontal: 10,
													paddingVertical: 5,
													width: '100%',
												}}
											>
												<Text
													className='text-white font-bold text-xs'
													allowFontScaling={false}
													style={{
														textAlign: 'center',
														flexDirection: 'row',
														alignItems: 'center',
													}}
												>
													{item.acceptExchangeAmount
														? item.acceptExchangeAmount === 'up'
															? 'TROCA POR MAIOR VALOR'
															: 'TROCA POR MENOR VALOR'
														: 'ESTUDO TROCA POR'}
												</Text>
											</View>
										) : (
											<View
												className={cn(
													'bg-primary',
													isCompany && 'bg-primary-xcar',
												)}
												style={{
													paddingHorizontal: 10,
													paddingVertical: 5,
													width: '100%',
												}}
											>
												<Text
													className='text-white font-bold text-xs'
													allowFontScaling={false}
													style={{
														textAlign: 'center',
														flexDirection: 'row',
														alignItems: 'center',
													}}
												>
													SOMENTE VENDA
												</Text>
											</View>
										)}
									</View>
								</View>
							</TouchableOpacity>
						</Link>
					)}
				/>
			)}
			<View style={{ height: 100 }} />
		</View>
	);
}
