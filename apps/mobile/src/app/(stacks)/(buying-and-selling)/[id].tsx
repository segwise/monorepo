import { Separator } from '@/components/ui/separator';
import { api } from '@/libraries/api';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { maskPostalCode } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Fragment, useRef, useState } from 'react';
import {
	FlatList,
	Linking,
	Modal,
	ScrollView,
	Text,
	TouchableNativeFeedback,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const featuresArray = [
	{ id: 'air_barg', name: 'air Bag' },
	{ id: 'alarm', name: 'alarme' },
	{ id: 'air_conditioning', name: 'ar Condicionado' },
	{ id: 'electric_locks', name: 'travas Elétricas' },
	{ id: 'electric_windows', name: 'vidros Elétricos' },
	{ id: 'sound', name: 'som' },
	{ id: 'reverse_sensor', name: 'sensor de Ré' },
	{ id: 'reversing_camera', name: 'câmera de Ré' },
];

export default function VehicleBuy() {
	const { id } = useLocalSearchParams<{
		id: string;
	}>();

	const { back } = useRouter();

	const { top, bottom } = useSafeAreaInsets();
	const { width } = useWindowDimensions();
	const { colors } = useTheme();

	const scrollImageRef = useRef<FlatList>(null);
	const scrollImageModalRef = useRef<FlatList>(null);

	const [indexPageImage, setIndexPageImage] = useState(0);
	const [modalImage, setModalImage] = useState<number | null>(null);

	const { data } = useQuery({
		queryKey: ['marketplace', id],
		queryFn: async ({ signal }) => {
			return (
				await api.get(`/marketplace/${id}`, {
					signal,
				})
			).data;
		},
	});

	const gallery = data?.photos || [];

	if (!data) {
		return;
	}

	return (
		<Fragment>
			<Modal
				visible={modalImage !== null && modalImage >= 0}
				animationType='fade'
				onRequestClose={() => setModalImage(null)}
			>
				<View
					className='bg-black'
					style={{
						flex: 1,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							position: 'absolute',
							top: top + 20,
							left: 0,
							right: 0,
							zIndex: 100,
							paddingHorizontal: 10,
							paddingVertical: 20,
						}}
					>
						<TouchableOpacity
							className='bg-primary'
							style={{
								padding: 10,
								borderRadius: 5,
							}}
							onPress={() => setModalImage(null)}
						>
							<Feather name='x' size={20} style={{ color: 'white' }} />
						</TouchableOpacity>
					</View>
					<FlatList
						// @ts-expect-error
						data={gallery.map((item) => ({
							url: item,
						}))}
						horizontal
						scrollEnabled
						ref={scrollImageModalRef}
						pagingEnabled
						bounces={false}
						showsHorizontalScrollIndicator={false}
						onScroll={(e) => {
							const contentOffset = e.nativeEvent.contentOffset;
							const viewSize = e.nativeEvent.layoutMeasurement;

							const pageNum = Math.floor(contentOffset.x / viewSize.width);
							setIndexPageImage(pageNum);

							scrollImageRef?.current?.scrollToIndex({
								animated: false,
								index: pageNum,
							});
						}}
						keyExtractor={(item) => item}
						renderItem={({ item }) => (
							<Image
								source={{ uri: item.url }}
								placeholder={item.placeholder}
								contentFit='contain'
								style={{
									width,
								}}
							/>
						)}
					/>
					<View
						style={{
							position: 'absolute',
							alignSelf: 'center',
							bottom: bottom + 10,
							backgroundColor: colors.text,
							borderRadius: 5,
						}}
					>
						<Text
							className='text-white'
							style={{
								textAlign: 'center',
								paddingHorizontal: 10,
								paddingVertical: 5,
							}}
						>
							{indexPageImage + 1} / {gallery.length}
						</Text>
					</View>
				</View>
			</Modal>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>
			<View className='pt-safe bg-primary' />
			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{
					flex: 1,
					backgroundColor: colors.background,
				}}
			>
				<View
					style={{
						position: 'relative',
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							position: 'absolute',
							left: 0,
							right: 0,
							zIndex: 1,
							paddingHorizontal: 10,
							paddingVertical: 20,
						}}
					>
						<TouchableOpacity
							className='bg-primary'
							style={{
								padding: 10,
								borderRadius: 5,
							}}
							onPress={back}
						>
							<ArrowLeftIcon color='white' />
						</TouchableOpacity>
					</View>
					<View
						style={{
							width: '100%',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<FlatList
							// @ts-expect-error
							data={gallery.map((item) => ({
								url: item,
							}))}
							horizontal
							scrollEnabled
							pagingEnabled
							bounces={false}
							ref={scrollImageRef}
							showsHorizontalScrollIndicator={false}
							onScroll={(e) => {
								const contentOffset = e.nativeEvent.contentOffset;
								const viewSize = e.nativeEvent.layoutMeasurement;

								const pageNum = Math.floor(contentOffset.x / viewSize.width);
								setIndexPageImage(pageNum);

								scrollImageModalRef?.current?.scrollToIndex({
									animated: false,
									index: pageNum,
								});
							}}
							keyExtractor={(item) => item}
							renderItem={({ item, index }) => (
								<TouchableNativeFeedback
									onPress={() => {
										setModalImage(Number(index === 0 ? 0 : index));
									}}
								>
									<Image
										source={{ uri: item.url }}
										placeholder={item.placeholder}
										contentFit='cover'
										style={{
											width,
											height: 300,
										}}
									/>
								</TouchableNativeFeedback>
							)}
						/>
						<View
							style={{
								position: 'absolute',
								alignSelf: 'center',
								bottom: 10,
								backgroundColor: colors.text,
								borderRadius: 5,
							}}
						>
							<Text
								className='text-white'
								style={{
									textAlign: 'center',
									paddingHorizontal: 10,
									paddingVertical: 5,
								}}
							>
								{indexPageImage + 1} / {gallery.length}
							</Text>
						</View>
					</View>
				</View>
				<View
					style={{
						paddingTop: 20,
						paddingHorizontal: 10,
						backgroundColor: colors.background,
					}}
				>
					<Text
						className='text-muted-foreground'
						style={{
							position: 'absolute',
							top: 10,
							right: 10,
							fontFamily: 'inter',
							fontSize: 10,
						}}
					>
						Publicado em{' '}
						{data?.createdAt
							? format(new Date(data.createdAt), "dd/MM 'às' HH:mm")
							: ''}
					</Text>
					<Text
						className='font-bold'
						allowFontScaling={false}
						style={{
							color: colors.text,
							fontSize: 30,
						}}
					>
						{new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						}).format(data?.price ?? 0)}
					</Text>
					<Text
						className='font-medium'
						allowFontScaling={false}
						style={{
							marginTop: 5,
							fontSize: 16,
							color: colors.text,
							textTransform: 'uppercase',
						}}
					>
						{data?.model}
					</Text>
					<Separator style={{ marginVertical: 10 }} />
					<View>
						<Text
							className='font-medium'
							allowFontScaling={false}
							style={{
								marginTop: 15,
								fontSize: 16,
								color: colors.text,
								textTransform: 'uppercase',
							}}
						>
							descrição
						</Text>
						<Text
							className='text-muted-foreground'
							allowFontScaling={false}
							style={{
								fontSize: 14,
								marginTop: 10,
							}}
						>
							{data?.description}
						</Text>
					</View>
					<Separator style={{ marginVertical: 10 }} />
					<View>
						{data?.acceptExchangeAmount &&
						![
							data?.acceptExchangeChange1,
							data?.acceptExchangeChange2,
							data?.acceptExchangeChange3,
						].filter((e) => e).length ? (
							<Text
								className='font-medium'
								allowFontScaling={false}
								style={{
									marginTop: 20,
									fontSize: 16,
									color: 'red',
									textTransform: 'uppercase',
								}}
							>
								*
								{data?.acceptExchangeAmount === 'up'
									? 'ACEITO POR VEÍCULO DE MAIOR VALOR'
									: 'ACEITO POR VEÍCULO DE MENOR VALOR'}
							</Text>
						) : (
							<>
								<Text
									className='font-medium'
									allowFontScaling={false}
									style={{
										marginTop: 15,
										fontSize: 16,
										color: colors.text,
										textTransform: 'uppercase',
									}}
								>
									estudo troca por:
								</Text>
								{[
									data?.acceptExchangeChange1,
									data?.acceptExchangeChange2,
									data?.acceptExchangeChange3,
								]
									.filter((e) => e)
									.map((item, index) => (
										<View
											key={index.toString()}
											style={{
												marginTop: index === 0 ? 10 : 5,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 100,
											}}
										>
											<Text
												key={index.toString()}
												allowFontScaling={false}
												className='uppercase'
												style={{
													fontSize: 14,
													color: colors.text,
												}}
											>
												• {item}
											</Text>
										</View>
									))}
							</>
						)}
					</View>
					<Separator style={{ marginTop: 30, marginBottom: 20 }} />
					<View>
						<Text
							className='font-medium'
							allowFontScaling={false}
							style={{
								marginTop: 15,
								fontSize: 16,
								color: colors.text,
								textTransform: 'uppercase',
								marginBottom: 10,
							}}
						>
							detalhes
						</Text>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Câmbio:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{
									[
										{
											id: 'manual',
											label: 'MANUAL',
										},
										{
											id: 'automatic',
											label: 'AUTOMÁTICO',
										},
										{
											id: 'semi_automatic',
											label: 'SEMI-AUTOMÁTICO',
										},
									].find((e) => e.id === data?.transmission)?.label
								}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Combustível:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{
									[
										{
											id: 'gasoline',
											label: 'gasolina'.toUpperCase(),
										},
										{
											id: 'alcohol',
											label: 'álcool'.toUpperCase(),
										},
										{
											id: 'flex',
											label: 'flex'.toUpperCase(),
										},
										{
											id: 'diesel',
											label: 'disiel'.toUpperCase(),
										},
										{
											id: 'hybrid',
											label: 'híbrido'.toUpperCase(),
										},
										{
											id: 'electric',
											label: 'elétrico'.toUpperCase(),
										},
									].find((e) => e.id === data?.fuel)?.label
								}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Direção:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{
									[
										{
											id: 'hydraulics',
											label: 'hidráulica',
										},
										{
											id: 'electric',
											label: 'elétrica',
										},
										{
											id: 'mechanics',
											label: 'mecânica',
										},
										{
											id: 'assisted',
											label: 'assistida',
										},
									].find((e) => e.id === data?.direction)?.label
								}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Cor:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{
									[
										{ id: 'black', name: 'preto' },
										{ id: 'blue', name: 'azul' },
										{ id: 'brown', name: 'marrom' },
										{ id: 'gray', name: 'cinza' },
										{ id: 'green', name: 'verde' },
										{ id: 'orange', name: 'laranja' },
										{ id: 'pink', name: 'rosa' },
										{ id: 'purple', name: 'roxo' },
										{ id: 'red', name: 'vermelho' },
										{ id: 'white', name: 'branco' },
										{ id: 'yellow', name: 'amarelo' },
									].find((e) => e?.id === data?.color)?.name
								}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Estado financeiro
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{data?.financialState === 'settled' ? 'quitado' : 'financiado'}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								KM:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{data?.mileage
									? new Intl.NumberFormat().format(data.mileage)
									: ''}{' '}
								KM
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Opcionais:
							</Text>
							<View
								style={{
									flexDirection: 'column',
									alignItems: 'flex-end',
									justifyContent: 'flex-start',
									marginVertical: 10,
								}}
							>
								{featuresArray.map((item) => (
									<View
										key={item.id}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'flex-start',
											gap: 10,
										}}
									>
										<Text
											allowFontScaling={false}
											style={{
												fontSize: 15,
												textTransform: 'capitalize',
											}}
										>
											{item.name}
										</Text>
										<View
											style={{
												borderWidth: 1,
												width: 15,
												height: 15,
												borderRadius: 2,
												backgroundColor: data?.optionals.includes(item.id)
													? colors.primary
													: undefined,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{data?.optionals.includes(item.id) && (
												<Feather name='check' color='white' />
											)}
										</View>
									</View>
								))}
							</View>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Conservação:
							</Text>
							<View
								style={{
									flexDirection: 'column',
									alignItems: 'flex-end',
									justifyContent: 'flex-start',
									marginVertical: 10,
								}}
							>
								{[
									{
										id: 'only_owner',
										name: 'único dono',
									},
									{
										id: 'with_manual',
										name: 'com manual',
									},
									{
										id: 'extra_key',
										name: 'chave extra',
									},
									{
										id: 'reviewed',
										name: 'revisado na concessionária',
									},
									{
										id: 'with_guarantee',
										name: 'com garantia',
									},
								].map((item) => (
									<View
										key={item.id}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'flex-start',
											gap: 10,
										}}
									>
										<Text
											allowFontScaling={false}
											style={{
												fontSize: 15,
												textTransform: 'capitalize',
											}}
										>
											{item.name}
										</Text>
										<View
											style={{
												borderWidth: 1,
												width: 15,
												height: 15,
												borderRadius: 2,
												backgroundColor: data?.conservations.includes(item.id)
													? colors.primary
													: undefined,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{data?.conservations.includes(item.id) && (
												<Feather name='check' color='white' />
											)}
										</View>
									</View>
								))}
							</View>
						</View>
					</View>
					<Separator style={{ marginTop: 15 }} />
					<View>
						<Text
							className='font-medium'
							allowFontScaling={false}
							style={{
								marginTop: 20,
								fontSize: 16,
								color: colors.text,
								textTransform: 'uppercase',
								marginBottom: 10,
							}}
						>
							localidade
						</Text>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								CEP:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{data?.postalCode ? maskPostalCode(data.postalCode) : ''}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Estado:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{data?.state}
							</Text>
						</View>
						<View
							style={{
								marginTop: 10,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<Text
								className='text-muted-foreground'
								allowFontScaling={false}
								style={{
									fontSize: 14,
								}}
							>
								Cidade:
							</Text>
							<Text
								className='text-foreground font-medium'
								allowFontScaling={false}
								style={{
									fontSize: 14,
									textTransform: 'uppercase',
								}}
							>
								{data?.city}
							</Text>
						</View>
					</View>
				</View>
				<View style={{ height: 200 }} />
			</ScrollView>
			<View
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
				}}
			>
				<TouchableOpacity
					style={{
						backgroundColor: colors.primary,
						paddingHorizontal: 20,
						paddingVertical: 10,
						borderRadius: 5,
						alignSelf: 'center',
						marginBottom: 10,
						width: 300,
					}}
					onPress={() => Linking.openURL(`https://wa.me/+${data?.phone}`)}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
						}}
					>
						<Text
							className='text-white font-bold'
							allowFontScaling={false}
							style={{
								fontSize: 18,
							}}
						>
							CONVERSAR
						</Text>
						<FontAwesome name='whatsapp' size={18} color='white' />
					</View>
				</TouchableOpacity>
				<View
					style={{
						backgroundColor: '#F1F1F1',
						paddingVertical: 10,
						alignItems: 'center',
						borderTopWidth: 2,
						borderColor: colors.border,
					}}
				>
					<Text
						className='text-muted-foreground font-medium'
						allowFontScaling={false}
						style={{
							fontSize: 16,
							textTransform: 'uppercase',
						}}
					>
						{capitalizeFirstLetters(data?.name || '')} ( anunciante )
					</Text>
				</View>
				<View style={{ height: bottom, backgroundColor: '#F1F1F1' }} />
			</View>
		</Fragment>
	);
}
