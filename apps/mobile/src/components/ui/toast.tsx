import {
	toast as baseToast,
	Toasts as Toast,
	type ToastOptions,
} from '@backpackapp-io/react-native-toast';
import { useTheme } from '@react-navigation/native';

function Toasts(props: React.ComponentProps<typeof Toast>) {
	const { colors } = useTheme();

	return (
		<Toast
			{...props}
			defaultStyle={{
				view: {
					backgroundColor: colors.primary,
					borderRadius: 4,
					paddingHorizontal: 16,
					paddingVertical: 12,
				},
				text: {
					color: '#fff',
					fontSize: 14,
					fontWeight: '600',
					textAlign: 'center',
				},
				indicator: {
					backgroundColor: colors.notification,
				},
			}}
		/>
	);
}

const toast = baseToast;

toast.success = (message: string, options?: Omit<ToastOptions, 'styles'>) =>
	baseToast(message, {
		...options,
		styles: {
			view: { backgroundColor: '#16a34a' },
			text: { color: '#fff' },
		},
	});

toast.error = (message: string, options?: Omit<ToastOptions, 'styles'>) =>
	baseToast(message, {
		...options,
		styles: {
			view: { backgroundColor: '#dc2626' },
			text: { color: '#fff' },
		},
	});

export { Toasts, toast };
