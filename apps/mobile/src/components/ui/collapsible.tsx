import { cn } from '@/libraries/classname';
import { createContext, useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const CollapsibleContext = createContext<{
	isOpen: boolean;
	toggle: () => void;
}>({
	isOpen: false,
	toggle: () => {},
});

interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof View> {
	className?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

function Collapsible({
	open: controlledOpen,
	onOpenChange,
	className,
	children,
	...props
}: CollapsibleProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isOpen = controlledOpen ?? uncontrolledOpen;
	const toggle = () => {
		const next = !isOpen;
		setUncontrolledOpen(next);
		onOpenChange?.(next);
	};
	return (
		<CollapsibleContext.Provider value={{ isOpen, toggle }}>
			<View className={cn('', className)} {...props}>
				{children}
			</View>
		</CollapsibleContext.Provider>
	);
}

interface CollapsibleTriggerProps
	extends React.ComponentPropsWithoutRef<typeof Pressable> {
	className?: string;
	children?: React.ReactNode;
}

function CollapsibleTrigger({
	className,
	children,
	...props
}: CollapsibleTriggerProps) {
	const { isOpen, toggle } = useContext(CollapsibleContext);

	return (
		<Pressable
			className={cn('min-h-12 min-w-12', className)}
			onPress={toggle}
			accessible={true}
			accessibilityRole='button'
			accessibilityState={{ expanded: isOpen }}
			data-active={isOpen}
			{...props}
		>
			{children}
		</Pressable>
	);
}

interface CollapsibleContentProps
	extends React.ComponentPropsWithoutRef<typeof View> {
	className?: string;
	children?: React.ReactNode;
}

function CollapsibleContent({
	className,
	children,
	...props
}: CollapsibleContentProps) {
	const { isOpen } = useContext(CollapsibleContext);

	if (!isOpen) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			exiting={FadeOut.duration(150)}
		>
			<View className={cn('', className)} {...props}>
				{children}
			</View>
		</Animated.View>
	);
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
