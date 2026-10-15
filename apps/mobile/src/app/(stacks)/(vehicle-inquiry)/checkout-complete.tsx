import { maskPlate } from '@segwise/core/masks';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Animated,
	Easing,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { api } from '@/libraries/api';

type PaymentStatus = 'pending' | 'paid' | 'expired';

interface PixCheckoutScreenProps {
	plate?: string;
	amount?: string;
	pixCode?: string;
	expirationSeconds?: number;
	onPaymentSuccess?: () => void;
	onExpired?: () => void;
	onBack?: () => void;
	onGenerateNew?: () => void;
}

const COLORS = {
	bg: '#111111',
	bgCard: '#000000',
	bgSurface: '#1a1a1a',
	bgSurface2: '#222222',
	border: '#2a2a2a',
	borderStrong: '#333333',
	orange: '#E85C00',
	white: '#FFFFFF',
	gray: '#888888',
	grayLight: '#cccccc',
	green: '#2ecc71',
	greenDim: 'rgba(46,204,113,0.12)',
	orangeDim: 'rgba(232,92,0,0.12)',
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const InfoBanner: React.FC = () => (
	<View style={styles.infoBanner}>
		<Text style={styles.infoBannerIcon}>ⓘ</Text>
		<Text style={styles.infoBannerText}>
			Após o pagamento, o acesso é liberado automaticamente.
		</Text>
	</View>
);

interface StatusPillProps {
	status: PaymentStatus;
	pulseAnim: Animated.Value;
}

const StatusPill: React.FC<StatusPillProps> = ({ status, pulseAnim }) => {
	const pillStyle =
		status === 'paid'
			? styles.pillPaid
			: status === 'expired'
				? styles.pillExpired
				: styles.pillPending;

	const dotStyle =
		status === 'paid'
			? styles.dotGreen
			: status === 'expired'
				? styles.dotOrange
				: styles.dotGray;

	const textStyle =
		status === 'paid'
			? styles.pillTextGreen
			: status === 'expired'
				? styles.pillTextOrange
				: styles.pillTextGray;

	const label =
		status === 'paid'
			? 'Pago com sucesso'
			: status === 'expired'
				? 'QR Code expirado'
				: 'Aguardando pagamento';

	const scale = pulseAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.04],
	});

	return (
		<Animated.View style={[styles.pill, pillStyle, { transform: [{ scale }] }]}>
			<View style={[styles.dot, dotStyle]} />
			<Text style={[styles.pillText, textStyle]}>{label}</Text>
		</Animated.View>
	);
};

interface TimerBlockProps {
	secondsLeft: number;
	status: PaymentStatus;
}

const TimerBlock: React.FC<TimerBlockProps> = ({ secondsLeft, status }) => {
	const timeColor =
		status === 'paid'
			? COLORS.green
			: status === 'expired'
				? COLORS.orange
				: COLORS.bg;

	return (
		<View style={styles.timerBlock}>
			<Text style={styles.timerClockIcon}>🕐</Text>
			<Text style={styles.timerLabel}>Expira em</Text>
			<Text style={[styles.timerNum, { color: timeColor }]}>
				{formatTime(secondsLeft)}
			</Text>
		</View>
	);
};

const PixCheckoutScreen: React.FC<PixCheckoutScreenProps> = () => {
	const { push, back } = useRouter();
	const { plate } = useLocalSearchParams<{
		plate: string;
	}>();

	const [status, setStatus] = useState<PaymentStatus>('pending');
	const [secondsLeft, setSecondsLeft] = useState(3600);
	const [copied, setCopied] = useState(false);

	const [idPix, setIdPix] = useState(null);
	const [pixCode, setPixCode] = useState(null);
	const [pixBase64, setPixBase64] = useState(null);

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pulseAnim = useRef(new Animated.Value(0)).current;
	const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

	const [amount, setAmount] = useState(null);

	const { refetch } = useQuery({
		queryKey: ['generate', 'pix', 'search-vehicle', 'complete'],
		queryFn: async ({ signal }) => {
			const { data } = await api.get('/pix', {
				params: {
					plate,
				},
				signal,
			});

			setIdPix(data.id);
			setAmount(data.amount);
			setPixCode(data.code);
			setSecondsLeft(data.expiration / 60);

			const base64 = `data:image/png;base64,${data.base64}`;
			// @ts-expect-error
			setPixBase64(base64);

			return data;
		},
	});

	useQuery({
		queryKey: ['pix', idPix],
		queryFn: async ({ signal }) => {
			const { data } = await api.get(`/pix/${idPix}/status`, {
				params: {
					plate,
				},
				signal,
			});

			setStatus(data.status);

			return data;
		},
		enabled: !!idPix && status === 'pending',
		refetchInterval: 10_000,
	});

	const startPulse = useCallback(() => {
		pulseLoop.current = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 600,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 0,
					duration: 600,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			]),
		);
		pulseLoop.current.start();
	}, [pulseAnim]);

	const stopPulse = useCallback(() => {
		pulseLoop.current?.stop();
		pulseAnim.setValue(0);
	}, [pulseAnim]);

	const onExpired = useCallback(() => {
		back();
	}, [back]);

	const onGenerateNew = useCallback(() => {
		refetch();
	}, [refetch]);

	const onPaymentSuccess = useCallback(() => {
		const token = 'fsdfdfdsfdsfdsfdsf';

		push(`/(vehicle-inquiry)/complete-token/${token}`);
	}, [push]);

	useEffect(() => {
		if (status !== 'pending') return;
		timerRef.current = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					// @ts-expect-error
					clearInterval(timerRef.current);
					setStatus('expired');
					onExpired?.();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [status, onExpired]);

	useEffect(() => {
		if (status === 'paid') {
			startPulse();
		} else {
			stopPulse();
		}
	}, [status, startPulse, stopPulse]);

	const handleCopy = useCallback(async () => {
		if (!pixCode) {
			return;
		}

		await Clipboard.setStringAsync(pixCode);

		setCopied(true);

		setTimeout(() => setCopied(false), 2500);
	}, [pixCode]);

	const handleCtaPress = useCallback(() => {
		if (status === 'paid') {
			onPaymentSuccess?.();
		} else if (status === 'expired') {
			onGenerateNew?.();
		}
	}, [status, onPaymentSuccess, onGenerateNew]);

	const ctaLabel =
		status === 'paid'
			? 'ACESSAR HISTÓRICO COMPLETO ›'
			: status === 'expired'
				? 'GERAR NOVO QR CODE'
				: 'AGUARDANDO PAGAMENTO $';

	const ctaDisabled = status === 'pending';

	const ctaStyle = [
		styles.cta,
		status === 'paid' && styles.ctaPaid,
		status === 'expired' && styles.ctaExpired,
		ctaDisabled && styles.ctaDisabled,
	];

	const ctaTextStyle = [
		styles.ctaText,
		status === 'expired' && styles.ctaTextWhite,
	];

	const showOverlay = status !== 'pending';
	const overlayLabel = status === 'paid' ? '✅  PAGO' : '⛔  EXPIRADO';
	const overlayTextColor = status === 'paid' ? COLORS.green : COLORS.orange;

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.body}>
				<View style={styles.titleBlock}>
					<Text style={styles.eyebrow}>AGUARDANDO PAGAMENTO</Text>
					<Text style={styles.title}>Escaneie o QR Code</Text>
					<Text style={styles.desc}>
						Use o app do seu banco para pagar via PIX.
					</Text>
				</View>
				<InfoBanner />
				<View>
					<Text style={styles.sectionLabel}>CONSULTA VEICULAR</Text>
					<View style={styles.qrCard}>
						<View style={styles.qrCardTop}>
							<View>
								<Text style={styles.qrCardTopLabel}>PLACA</Text>
								<Text style={styles.qrCardTopValue}>
									{maskPlate(plate.toUpperCase())}
								</Text>
							</View>
							<View style={{ alignItems: 'flex-end' }}>
								<Text style={styles.qrCardTopLabel}>VALOR</Text>
								<Text style={styles.qrCardTopValue}>
									{new Intl.NumberFormat('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}).format(amount || 0)}
								</Text>
							</View>
						</View>
						<View style={styles.qrBody}>
							<View style={styles.qrFrame}>
								<View style={[styles.corner, styles.cornerTL]} />
								<View style={[styles.corner, styles.cornerTR]} />
								<View style={[styles.corner, styles.cornerBL]} />
								<View style={[styles.corner, styles.cornerBR]} />
								{pixBase64 && (
									<Image
										source={{
											uri: pixBase64,
										}}
										style={{
											width: '100%',
											height: '100%',
										}}
									/>
								)}
								{showOverlay && (
									<View style={styles.qrOverlay}>
										<Text
											style={[
												styles.qrOverlayText,
												{ color: overlayTextColor },
											]}
										>
											{overlayLabel}
										</Text>
									</View>
								)}
							</View>
							<TimerBlock secondsLeft={secondsLeft} status={status} />
							<StatusPill status={status} pulseAnim={pulseAnim} />
						</View>
					</View>
				</View>
				{status !== 'expired' && (
					<TouchableOpacity
						style={[
							styles.copyBtn,
							copied && {
								backgroundColor: COLORS.green,
								borderWidth: 0,
							},
						]}
						onPress={handleCopy}
						accessibilityLabel='Copiar código PIX'
					>
						<Text
							style={[
								styles.copyBtnText,
								copied && {
									color: COLORS.bg,
								},
							]}
						>
							{copied ? '✓  CÓDIGO COPIADO!' : '⎘  COPIAR CÓDIGO PIX'}
						</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					style={ctaStyle}
					onPress={handleCtaPress}
					disabled={ctaDisabled}
					activeOpacity={0.85}
					accessibilityLabel={ctaLabel}
				>
					<Text style={ctaTextStyle}>{ctaLabel}</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 32,
	},
	body: {
		paddingHorizontal: 20,
		paddingTop: 24,
		gap: 20,
	},
	titleBlock: {
		gap: 4,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 2,
		color: COLORS.gray,
		textTransform: 'uppercase',
	},
	title: {
		fontSize: 26,
		fontWeight: '900',
		color: COLORS.bgSurface,
		lineHeight: 30,
	},
	desc: {
		fontSize: 13,
		color: COLORS.gray,
	},
	infoBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: COLORS.white,
		borderWidth: 1,
		borderColor: COLORS.gray,
		borderRadius: 10,
		padding: 12,
	},
	infoBannerIcon: {
		color: COLORS.bg,
		fontSize: 20,
	},
	infoBannerText: {
		flex: 1,
		fontSize: 13,
		fontWeight: '600',
		color: COLORS.bg,
		lineHeight: 18,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 2,
		color: '#555',
		textTransform: 'uppercase',
		marginBottom: 10,
	},
	qrCard: {
		backgroundColor: COLORS.white,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 14,
		overflow: 'hidden',
	},
	qrCardTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: COLORS.bgSurface,
		paddingHorizontal: 18,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#222',
	},
	qrCardTopLabel: {
		fontSize: 11,
		color: '#666',
		fontWeight: '700',
		letterSpacing: 1,
	},
	qrCardTopValue: {
		fontSize: 18,
		fontWeight: '900',
		color: COLORS.white,
	},
	qrBody: {
		padding: 24,
		alignItems: 'center',
		gap: 16,
	},
	qrFrame: {
		width: 200,
		height: 200,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	corner: {
		position: 'absolute',
		width: CORNER_SIZE,
		height: CORNER_SIZE,
		borderColor: COLORS.orange,
	},
	cornerTL: {
		top: 0,
		left: 0,
		borderTopWidth: CORNER_THICKNESS,
		borderLeftWidth: CORNER_THICKNESS,
		borderTopLeftRadius: 4,
	},
	cornerTR: {
		top: 0,
		right: 0,
		borderTopWidth: CORNER_THICKNESS,
		borderRightWidth: CORNER_THICKNESS,
		borderTopRightRadius: 4,
	},
	cornerBL: {
		bottom: 0,
		left: 0,
		borderBottomWidth: CORNER_THICKNESS,
		borderLeftWidth: CORNER_THICKNESS,
		borderBottomLeftRadius: 4,
	},
	cornerBR: {
		bottom: 0,
		right: 0,
		borderBottomWidth: CORNER_THICKNESS,
		borderRightWidth: CORNER_THICKNESS,
		borderBottomRightRadius: 4,
	},
	qrOverlay: {
		position: 'absolute',
		inset: 0,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.78)',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4,
	},
	qrOverlayText: {
		fontSize: 18,
		fontWeight: '900',
		letterSpacing: 2,
		textTransform: 'uppercase',
	},
	timerBlock: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	timerClockIcon: {
		fontSize: 16,
	},
	timerLabel: {
		fontSize: 14,
		color: '#aaa',
	},
	timerNum: {
		fontSize: 22,
		fontWeight: '900',
		fontVariant: ['tabular-nums'],
		minWidth: 56,
		textAlign: 'center',
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 100,
		paddingVertical: 6,
		paddingHorizontal: 16,
		borderWidth: 1.5,
	},
	pillPending: {
		backgroundColor: COLORS.bgSurface,
		borderColor: COLORS.borderStrong,
	},
	pillPaid: {
		backgroundColor: COLORS.greenDim,
		borderColor: COLORS.green,
	},
	pillExpired: {
		backgroundColor: COLORS.orangeDim,
		borderColor: COLORS.orange,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	dotGray: { backgroundColor: COLORS.gray },
	dotGreen: { backgroundColor: COLORS.green },
	dotOrange: { backgroundColor: COLORS.orange },
	pillText: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'uppercase',
	},
	pillTextGray: { color: COLORS.gray },
	pillTextGreen: { color: COLORS.green },
	pillTextOrange: { color: COLORS.orange },
	copyBtn: {
		backgroundColor: COLORS.bgSurface,
		borderWidth: 1,
		borderColor: COLORS.borderStrong,
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: 'center',
	},
	copyBtnDisabled: {
		opacity: 0.3,
	},
	copyBtnText: {
		color: COLORS.grayLight,
		fontSize: 13,
		fontWeight: '700',
		letterSpacing: 1,
	},
	cta: {
		backgroundColor: COLORS.white,
		borderRadius: 12,
		paddingVertical: 18,
		alignItems: 'center',
		marginBottom: 8,
	},
	ctaPaid: {
		backgroundColor: COLORS.green,
	},
	ctaExpired: {
		backgroundColor: COLORS.orange,
	},
	ctaDisabled: {
		opacity: 0.3,
	},
	ctaText: {
		color: '#000',
		fontSize: 14,
		fontWeight: '900',
		letterSpacing: 2,
		textTransform: 'uppercase',
	},
	ctaTextWhite: {
		color: COLORS.white,
	},
});

export default PixCheckoutScreen;
