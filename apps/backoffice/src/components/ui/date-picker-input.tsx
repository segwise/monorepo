import { maskDateString } from '@segwise/core/masks';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils';

function parseDate(str: string): Date | null {
	if (str.length !== 10) {
		return null;
	}

	const parsed = parse(str, 'dd/MM/yyyy', new Date());

	return isValid(parsed) ? parsed : null;
}

interface DatePickerInputProps {
	id?: string;
	value?: Date | null;
	onChange?: (date: Date | null | '') => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	invalid?: boolean;
	readonly?: boolean;
}

function DatePickerInput({
	id,
	value,
	onChange,
	placeholder,
	disabled,
	className,
	invalid,
	readonly,
}: DatePickerInputProps) {
	const [inputValue, setInputValue] = useState(
		value ? format(value, 'dd/MM/yyyy') : '',
	);

	const [open, setOpen] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	function handleBlur() {
		setTimeout(() => {
			const active = document.activeElement;

			if (
				containerRef.current?.contains(active) ||
				popoverRef.current?.contains(active)
			)
				return;

			setOpen(false);
		}, 0);
	}

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const masked = maskDateString(e.target.value);

		setInputValue(masked);
		const date = parseDate(masked);

		onChange?.(date || '');
	}

	function handleCalendarSelect(date: Date | undefined) {
		if (!date) return;
		setInputValue(format(date, 'dd/MM/yyyy'));
		onChange?.(date);
		setOpen(false);
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: div
		<div
			ref={containerRef}
			onBlur={handleBlur}
			className={cn(
				'relative flex items-center',
				invalid && 'border-destructive',
				className,
			)}
		>
			<Input
				id={id}
				value={inputValue}
				onChange={handleInputChange}
				onFocus={() => setOpen(true)}
				placeholder={placeholder ?? '00/00/0000'}
				maxLength={10}
				disabled={disabled}
				className='pr-10'
				readOnly={readonly}
			/>
			<Popover
				open={readonly ? false : open}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						return;
					}

					setOpen(true);
				}}
			>
				<PopoverTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						disabled={disabled}
						className='absolute right-1 h-7 w-7 text-muted-foreground'
					>
						<CalendarIcon className='h-4 w-4' />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					ref={popoverRef}
					className='w-auto p-0'
					align='end'
					side='bottom'
					sideOffset={12}
					alignOffset={-5}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Calendar
						{...(value && {
							defaultMonth: value,
						})}
						mode='single'
						selected={value ?? undefined}
						onSelect={handleCalendarSelect}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export { DatePickerInput };
