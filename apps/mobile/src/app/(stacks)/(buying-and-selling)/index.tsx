import { ToastPosition } from '@backpackapp-io/react-native-toast';
import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIsFocused, useTheme } from '@react-navigation/native';
import { maskCPF, maskDateString } from '@segwise/core/masks';
import { SchemaMarketplaceSignIn } from '@segwise/core/schemas';
import type { MarketplaceSignIn } from '@segwise/core/types';
import { isCNPJ, isCPF } from '@segwise/core/valids';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { ChevronDownIcon, SearchIcon, XCircleIcon } from 'lucide-react-native';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	BackHandler,
	FlatList,
	Keyboard,
	Platform,
	ScrollView,
	Text,
	type TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import {
	KeyboardAvoidingView,
	useKeyboardState,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XiorError } from 'xior';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, InputError } from '@/components/ui/input';
import {
	NativeSelectScrollView,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { isCompany } from '@/configs/consts/company';
import states from '@/data/states.json';
import { api } from '@/libraries/api';
import { cn } from '@/libraries/classname';
import { storage } from '@/libraries/storage';

const company = Constants.expoConfig?.extra?.company?.id;

type Filter = {
	state: {
		id: string;
		sigla: string;
		name: string;
		label: string;
	} | null;
	city: {
		id: string;
		label: string;
	} | null;
	neighborhood: string | null;
	search: string | null;
	vehicle: string | null;
	price: {
		min: number | null;
		max: number | null;
	};
	acceptExchange: boolean | null;
	orderBy: {
		id: number;
		label: 'date' | 'price';
	};
};

const LIMIT = 10;

function BuyAndSell() {
	const { push } = useRouter();

	const { colors } = useTheme();

	const { bottom } = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const [statesSearch, setStatesSearch] = useState<string>('');
	const [citySearch, setCitySearch] = useState<string>('');

	const { isVisible: keyboardIsVisible, height: keyboardHeight } =
		useKeyboardState();

	const [modalVisible, setModalVisible] = useState<{
		acceptExchangeAmount: 'down' | 'up';
		vehicles: Array<string>;
	} | null>(null);
	const [modalRegion, setModalRegion] = useState(false);

	const registerRed = useRef<TextInput>(null);
	const birthRef = useRef<TextInput>(null);

	const [portal, setPortal] = useState<boolean>(false);
	const [authenticated, setAuthenticated] = useState<boolean>(false);

	const { control: controlAuth, handleSubmit: handleSubmitAuth } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketplaceSignIn),
		defaultValues: {
			...(company && {
				company,
			}),
			cpf: '',
			birth: '',
		},
	});

	const [filter, setFilter] = useState<Filter>({
		search: null,
		state: {
			id: '0',
			sigla: '0',
			name: 'TODOS',
			label: 'TODOS',
		},
		city: null,
		neighborhood: null,
		vehicle: null,
		price: {
			min: null,
			max: null,
		},
		acceptExchange: null,
		orderBy: {
			id: 1,
			label: 'date',
		},
	});

	const isFocused = useIsFocused();

	const { mutate: handleSearch, isPending } = useMutation<
		{ id: string },
		Error,
		MarketplaceSignIn
	>({
		mutationKey: ['marketplace', 'auth'],
		mutationFn: async (props) => {
			try {
				const { data } = await api.get('/marketplace/auth', {
					params: {
						...(props.company && {
							company: props.company,
						}),
						cpf: props.cpf,
						birth: props.birth,
					},
				});

				return data;
			} catch (error) {
				let message = 'FALHA AO ACESSAR';

				if (error instanceof Error) {
					message = error.message.toUpperCase();
				}

				if (error instanceof XiorError) {
					message = error.response?.data.message;
				}

				throw new Error(message);
			}
		},
		onSuccess(data) {
			setAuthenticated(!!data.id);

			storage.set('authenticated_marketing', data.id);
		},
		onError(data) {
			toast.error(data.message, {
				position: ToastPosition.TOP,
			});
		},
	});

	function logOut() {
		setAuthenticated(false);

		storage.remove('authenticated_marketing');
	}

	const {
		data,
		isLoading: isLoadingHistory,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteQuery({
		queryKey: [
			'marketplace',
			filter.orderBy,
			filter.state?.label,
			filter.city?.label,
		],
		queryFn: async ({ signal, pageParam }) => {
			setModalRegion(false);

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
			}>('/marketplace', {
				params: {
					cursor: pageParam,
					limit: LIMIT,
					search: filter.search,
					orderBy: filter.orderBy.id === 0 ? 'price' : 'date',
					state:
						filter.state?.id === '0' ||
						!filter.state ||
						filter.state.label.toUpperCase() === 'TODOS'
							? undefined
							: filter.state.label,
					city:
						filter.state?.id === '0' ||
						!filter.state ||
						filter.state.label.toUpperCase() === 'TODOS'
							? undefined
							: filter.city?.label,
				},
				signal,
			});

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

	useEffect(() => {
		if (isFocused) {
			refetch();
		}
	}, [isFocused, refetch]);

	const results = data?.pages.flatMap((response) => response.data) ?? [];

	const loadingResults = isLoadingHistory;

	const handleBackButton = useCallback(() => {
		if (modalRegion) {
			setModalRegion(false);
			return true;
		} else {
			return false;
		}
	}, [modalRegion]);

	useEffect(() => {
		const handler = BackHandler.addEventListener(
			'hardwareBackPress',
			handleBackButton,
		);

		return () => {
			handler.remove();
		};
	}, [modalRegion, handleBackButton]);

	useEffect(() => {
		const token = storage.getString('authenticated_marketing');

		if (token) {
			setAuthenticated(!!token);
		}
	}, []);

	return (
		<Fragment>
			<Dialog open={portal} onOpenChange={setPortal}>
				<DialogContent
					showClose={false}
					style={{
						backgroundColor: 'white',
						marginHorizontal: 20,
						padding: 10,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderRadius: 5,
						gap: 20,
					}}
				>
					<TouchableOpacity
						className='absolute top-0 right-0 z-10 bg-white p-2 rounded-bl-sm'
						onPress={() => setPortal(false)}
					>
						<XCircleIcon color={colors.text} />
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							setPortal(false);

							push('/(stacks)/(buying-and-selling)/register-update');
						}}
						style={{
							backgroundColor: '#d1d1d1',
							borderRadius: 5,
							padding: 10,
							height: 100,
							flex: 1,
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
						}}
					>
						<Feather name='camera' size={30} />
						<Text
							allowFontScaling={false}
							style={{
								textAlign: 'center',
							}}
						>
							ANUNCIAR
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							setPortal(false);

							push('/(stacks)/(buying-and-selling)/vehicles');
						}}
						style={{
							backgroundColor: '#d1d1d1',
							borderRadius: 5,
							padding: 10,
							height: 100,
							flex: 1,
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
						}}
					>
						<Feather name='external-link' size={30} />
						<Text
							allowFontScaling={false}
							style={{
								textAlign: 'center',
							}}
						>
							ALTERAR/EXCLUIR MEUS ANÚNCIOS
						</Text>
					</TouchableOpacity>
				</DialogContent>
			</Dialog>
			{authenticated && (
				<Fragment>
					<View className='my-4 px-3'>
						<Input
							label='Buscar'
							returnKeyType='search'
							value={filter.search || ''}
							onChangeText={(value) => {
								setFilter((e) => ({
									...e,
									search: value,
								}));

								if (value.length === 0) {
									setTimeout(() => {
										refetch();
									}, 100);
								}
							}}
							onSubmitEditing={() => {
								refetch();
								Keyboard.dismiss();
							}}
						/>
					</View>
					<View
						style={{
							height: 50,
							borderBottomWidth: 2,
							borderTopWidth: 2,
							borderColor: colors.border,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<TouchableOpacity
							onPress={() => {
								setModalRegion((e) => !e);
							}}
							style={{
								flex: 1,
								width: '50%',
								height: '100%',
								borderRightWidth: 1,
								borderColor: colors.border,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text
								allowFontScaling={false}
								style={{
									fontFamily: 'inter',
									fontSize: 12,
									color: colors.text,
								}}
							>
								Estado:
							</Text>
							<Text
								allowFontScaling={false}
								style={{
									textAlign: 'center',
									fontFamily: 'inter_bold',
									color: colors.text,
									fontSize: 20,
								}}
							>
								{filter.state?.sigla === '0'
									? 'PESQUISAR'
									: `${!filter.city ? '' : `${filter?.city?.label} /`} ${
											states?.find(
												(e) =>
													e?.cities?.find(
														(x) =>
															x?.toUpperCase() ===
															filter?.city?.label?.toUpperCase(),
													) &&
													e?.sigla?.toUpperCase() ===
														filter?.state?.id?.toUpperCase(),
											)?.sigla || filter?.state?.label
										}`}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								setModalRegion(false);

								if (keyboardIsVisible) {
									Keyboard.dismiss();
								}

								setFilter((e) => ({
									...e,
									orderBy: {
										id: e.orderBy?.id === 1 ? 0 : 1,
										label: e.orderBy?.id === 1 ? 'price' : 'date',
									},
								}));

								setTimeout(() => {
									refetch();
								}, 300);
							}}
							style={{
								flex: 1,
								width: '50%',
								height: '100%',
								borderLeftWidth: 1,
								borderColor: colors.border,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text
								allowFontScaling={false}
								style={{
									fontFamily: 'inter',
									fontSize: 12,
									color: colors.text,
								}}
							>
								Ordem:
							</Text>
							<Text
								allowFontScaling={false}
								style={{
									textAlign: 'center',
									fontFamily: 'inter_bold',
									color: colors.text,
									fontSize: 20,
								}}
							>
								POR {filter?.orderBy?.id === 1 ? 'DATA' : 'PREÇO'}
							</Text>
							<Feather
								name='refresh-cw'
								size={20}
								color={colors.text}
								style={{
									position: 'absolute',
									right: 20,
								}}
							/>
						</TouchableOpacity>
					</View>
					{modalRegion && (
						<View
							style={{
								paddingHorizontal: 10,
								paddingVertical: 15,
								borderBottomWidth: 2,
								borderColor: colors.border,
							}}
						>
							<View style={{ height: 5 }} />
							<Select
								// @ts-expect-error
								value={filter.state}
								onOpenChange={(open) => {
									if (open) {
										Keyboard.dismiss();
									}
								}}
								onValueChange={(value) =>
									// @ts-expect-error
									setFilter((e) => ({
										...e,
										state: value,
										city: null,
									}))
								}
							>
								<SelectTrigger label='ESTADO'>
									<SelectValue placeholder='Selecionar' />
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											// top: keyboardHeight,
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<Input
										value={statesSearch}
										onChangeText={setStatesSearch}
										className='h-10'
										placeholder='Pesquisar'
									/>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{[
											{
												sigla: '0',
												name: 'todos',
											},
											...states,
										]
											.map((item) => ({
												id: item.sigla.toUpperCase(),
												label: item.name.toUpperCase(),
											}))
											?.filter((item) => {
												if (!statesSearch.trim()) {
													return true;
												}

												const normalizeText = (text: string): string => {
													return text
														.toLowerCase()
														.normalize('NFD')
														.replace(/[\u0300-\u036f]/g, '')
														.trim();
												};

												const searchTerms = normalizeText(statesSearch)
													.split(/\s+/)
													.filter((term) => term.length > 0);

												if (searchTerms.length === 0) {
													return true;
												}

												const companyName = normalizeText(item.label);

												return searchTerms.every((term) =>
													companyName.includes(term),
												);
											})
											?.map(({ id, label }) => (
												<SelectItem key={id} value={id} label={label} />
											))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
							{filter.state?.id !== '0' && filter.state?.label !== 'TODOS' && (
								<Fragment>
									<View style={{ height: 20 }} />
									<View className='flex flex-row items-center justify-between gap-x-2'>
										<Select
											// @ts-expect-error
											value={filter.city}
											onOpenChange={(open) => {
												if (open) {
													Keyboard.dismiss();
												}
											}}
											onValueChange={(value) =>
												// @ts-expect-error
												setFilter((e) => ({
													...e,
													city: value,
												}))
											}
											className='flex-1'
										>
											<SelectTrigger label='CIDADE'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
											<SelectContent
												style={{ width: width - 32 }}
												insets={{
													...(keyboardIsVisible && {
														// top: keyboardHeight,
														bottom: keyboardHeight + 24,
													}),
													left: 12,
													right: 12,
												}}
											>
												<Input
													value={citySearch}
													onChangeText={setCitySearch}
													className='h-10'
													placeholder='Pesquisar'
												/>
												<NativeSelectScrollView keyboardShouldPersistTaps='always'>
													{states
														?.find(
															(e) =>
																e.sigla?.toUpperCase() ===
																// @ts-expect-error
																filter?.state?.value?.toUpperCase(),
														)
														?.cities?.map((item) => ({
															id: item.toUpperCase(),
															label: item.toUpperCase(),
														}))
														.map(({ id, label }) => (
															<SelectItem key={id} value={id} label={label} />
														))}
												</NativeSelectScrollView>
											</SelectContent>
										</Select>
										{filter.city && (
											<Button
												className='size-12'
												onPress={() =>
													setFilter((e) => ({
														...e,
														city: null,
													}))
												}
											>
												<XCircleIcon color='white' />
											</Button>
										)}
									</View>
								</Fragment>
							)}
						</View>
					)}
				</Fragment>
			)}
			{authenticated && !modalRegion && !loadingResults && (
				<View
					style={{
						height: 50,
						backgroundColor: colors.text,
						marginHorizontal: 5,
						borderRadius: 5,
						marginBottom: 10,
						marginTop: 10,
					}}
				>
					<TouchableOpacity
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							height: '100%',
							paddingHorizontal: 15,
						}}
						onPress={() => setPortal(true)}
					>
						<View style={{ width: 20 }} />
						<Text
							className='text-white font-bold'
							allowFontScaling={false}
							style={{
								fontSize: 15,
								textTransform: 'uppercase',
								fontWeight: '700',
								textAlign: 'center',
							}}
						>
							anunciar / alterar / excluir
						</Text>
						<View style={{ width: 20 }}>
							<Feather name='arrow-right' size={20} color='white' />
						</View>
					</TouchableOpacity>
				</View>
			)}
			{!authenticated ? (
				<KeyboardAvoidingView
					behavior={
						Platform.OS === 'android' ? 'translate-with-padding' : 'padding'
					}
					className='p-6 items-center'
				>
					<ScrollView showsVerticalScrollIndicator={false} className='pt-6'>
						<Image
							source={require('@/assets/images/as-mulheres-que-enviam-contrato-e-documento-sobre-emprestimo-de-carro-sao-submetidas-ao-banco-e-rece.png')}
							style={{
								width: '100%',
								height: 180,
								borderRadius: 5,
							}}
						/>
						<Text
							allowFontScaling={false}
							className='text-lg text-center font-medium leading-tight text-muted-foreground mt-3'
						>
							Realize a compra ou venda do seu veículo com mais confiança
						</Text>
						<Text allowFontScaling={false} className='text-xl mt-6 font-bold'>
							Acesso apenas para segurados
						</Text>
						<View
							style={{
								marginTop: 30,
								width: '100%',
							}}
						>
							<Controller
								control={controlAuth}
								name='cpf'
								render={({ field, fieldState }) => (
									<View>
										<Input
											{...field}
											ref={registerRed}
											label='CPF'
											maxLength={14}
											keyboardType='number-pad'
											returnKeyType='done'
											onChangeText={(value = '') =>
												field.onChange(maskCPF(value))
											}
											onSubmitEditing={() => {
												if (isCPF(field.value) || isCNPJ(field.value)) {
													birthRef.current?.focus();
												}
											}}
										/>
										{fieldState.invalid && fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
							<View style={{ height: 30 }} />
							<Controller
								control={controlAuth}
								name='birth'
								render={({ field, fieldState }) => (
									<View>
										<Input
											{...field}
											ref={birthRef}
											label='DATA DE NASCIMENTO'
											maxLength={10}
											onChangeText={(value) =>
												field.onChange(maskDateString(value))
											}
											onSubmitEditing={Keyboard.dismiss}
											keyboardType='number-pad'
											returnKeyType='done'
										/>
										{fieldState.invalid && fieldState.error?.message && (
											<InputError>{fieldState.error.message}</InputError>
										)}
									</View>
								)}
							/>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 12,
									marginTop: 10,
									fontFamily: 'inter',
								}}
							>
								<Text className='font-bold'>IMPORTANTE:</Text>
								{`\n`}Não intermediamos as negociações, apenas o uso da
								plataforma
							</Text>
						</View>
						<View
							className={cn('bg-primary', isCompany && 'bg-primary-xcar')}
							style={{
								marginTop: 30,
								width: '100%',
								borderRadius: 5,
							}}
						>
							<TouchableOpacity
								className={cn(isPending && 'bg-muted-foreground')}
								style={{
									width: '100%',
									paddingVertical: 15,
									alignItems: 'center',
									justifyContent: 'center',
									flexDirection: 'row',
									gap: 10,
								}}
								onPress={handleSubmitAuth((value) => handleSearch(value))}
								disabled={isPending}
							>
								{isPending ? (
									<ActivityIndicator color='white' size={20} />
								) : (
									<Fragment>
										<SearchIcon color='white' size={20} />
										<Text
											className='font-bold text-white'
											allowFontScaling={false}
											style={{
												fontSize: 16,
											}}
										>
											PESQUISAR
										</Text>
									</Fragment>
								)}
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			) : loadingResults ? (
				<ActivityIndicator style={{ marginTop: 30 }} />
			) : results.length === 0 ? (
				<View
					style={{
						paddingHorizontal: 20,
						marginTop: 20,
						alignItems: 'center',
					}}
				>
					<Feather
						name='alert-circle'
						size={30}
						style={{
							marginBottom: 10,
						}}
					/>
					<Text
						allowFontScaling={false}
						style={{
							textTransform: 'uppercase',
							fontSize: 16,
							textAlign: 'center',
						}}
					>
						Nenhum registro encontrado para a essa busca
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
					onScroll={() => {
						if (keyboardIsVisible) {
							Keyboard.dismiss();
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
						<Link href={`/(stacks)/(buying-and-selling)/${item.id}`} asChild>
							<TouchableOpacity>
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
												className='font-bold'
												style={{
													fontSize: 18,
													color: colors.text,
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
														className='font-medium'
														style={{
															marginBottom: 5,
															fontSize: 12,
															color: colors.text,
														}}
													>
														ANO: {String(item.year)}
													</Text>
													<Text
														allowFontScaling={false}
														className='font-semibold'
														style={{
															marginBottom: 5,
															fontSize: 15,
															color: colors.text,
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
											<TouchableOpacity
												className={cn(
													'bg-primary',
													isCompany && 'bg-primary-xcar',
												)}
												disabled={!!item.acceptExchangeAmount}
												onPress={() => {
													setModalVisible({
														// biome-ignore lint/style/noNonNullAssertion: acceptExchangeAmount
														acceptExchangeAmount: item.acceptExchangeAmount!,
														// @ts-expect-error
														vehicles: [
															item.acceptExchangeChange1,
															item.acceptExchangeChange2,
															item.acceptExchangeChange3,
														].filter((e) => e),
													});
												}}
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
											</TouchableOpacity>
										) : (
											<View
												style={{
													backgroundColor: colors.primary,
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
									<Dialog
										open={!!modalVisible}
										onOpenChange={() => {
											setModalVisible(null);
										}}
									>
										<DialogContent>
											{modalVisible?.acceptExchangeAmount ? (
												modalVisible.acceptExchangeAmount && (
													<Text
														allowFontScaling={false}
														style={{
															fontSize: 15,
															fontWeight: 'bold',
															marginBottom: 10,
															textAlign: 'center',
														}}
													>
														{modalVisible.acceptExchangeAmount === 'up'
															? 'ACEITO POR VEÍCULO DE MAIOR VALOR'
															: 'ACEITO POR VEÍCULO DE MENOR VALOR'}
													</Text>
												)
											) : (
												<>
													<Text allowFontScaling={false}>ESTUDO TROCA POR</Text>
													{modalVisible?.vehicles?.map((item, index) => (
														<Text
															allowFontScaling={false}
															key={index.toString()}
															style={{
																textTransform: 'uppercase',
																fontSize: 17,
															}}
														>
															{item}
														</Text>
													))}
												</>
											)}
										</DialogContent>
									</Dialog>
								</View>
							</TouchableOpacity>
						</Link>
					)}
				/>
			)}
			{authenticated && (
				<TouchableOpacity
					onPress={logOut}
					className={cn('bg-primary', isCompany && 'bg-primary-xcar')}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						paddingBottom: bottom + (Platform.OS === 'android' ? 15 : 0),
						paddingTop: Platform.OS === 'android' ? 15 : 10,
						bottom: 0,
						paddingHorizontal: 20,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 10,
					}}
				>
					<Text
						allowFontScaling={false}
						style={{
							color: 'white',
							fontWeight: '700',
							textAlign: 'center',
						}}
					>
						DESLOGAR
					</Text>
					<Feather name='log-out' size={20} style={{ color: 'white' }} />
				</TouchableOpacity>
			)}
		</Fragment>
	);
}

export default BuyAndSell;
