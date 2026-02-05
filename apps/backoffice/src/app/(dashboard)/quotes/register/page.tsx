import {
	CarIcon,
	ChevronLeftIcon,
	ClipboardIcon,
	SaveIcon,
	UserCircle2Icon,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ButtonBack } from '@/components/ui/button/back';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
	title: 'Cadastrar Cotação',
};

function QuotesRegisterPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<div className='flex flex-row items-center justify-between **:gap-x-2'>
				<div />
				<div className='flex flex-row items-center justify-end'>
					<div className='flex flex-row items-center justify-end gap-x-1'>
						<span className='text-sm font-medium'>Produtor:</span>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder='Nenhum produtor' />
							</SelectTrigger>
						</Select>
					</div>
					<ButtonBack>
						<Button>
							<ChevronLeftIcon /> Voltar
						</Button>
					</ButtonBack>
				</div>
			</div>
			<Card>
				<CardContent>
					<FieldGroup>
						<FieldGroup>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<ClipboardIcon />
										</div>
										Informativo
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>Categoria do Seguro:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Tipo do Seguro:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Status:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Data da Solicitação:</FieldLabel>
									<Input placeholder='00/00/0000' />
								</Field>
							</FieldGroup>
						</FieldGroup>
						<Separator />
						<FieldGroup>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<UserCircle2Icon />
										</div>
										Segurado
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>CPF:</FieldLabel>
									<Input placeholder='000.000.000-00' />
								</Field>
								<Field>
									<FieldLabel>Nome Completo:</FieldLabel>
									<Input placeholder='Nome Completo' />
								</Field>
								<Field>
									<FieldLabel>Nascimento:</FieldLabel>
									<Input placeholder='00/00/0000' />
								</Field>
								<Field>
									<FieldLabel>Celular:</FieldLabel>
									<Input placeholder='(00) 00000-0000' />
								</Field>
								<Field>
									<FieldLabel>Estado Cívil:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Tempo de Experiência:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>
										Profissão:
										<sup className='text-muted-foreground ml-2'>
											( Opcional )
										</sup>
									</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
							</FieldGroup>
						</FieldGroup>
						<Separator />
						<FieldGroup>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<CarIcon />
										</div>
										Dados do Seguro
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>
										Placa:
										<sup className='text-muted-foreground ml-2'>
											( Opcional )
										</sup>
									</FieldLabel>
									<Input placeholder='AAA-0000 / AAA0A00' />
								</Field>
								<Field>
									<FieldLabel>Marca:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Modelo:</FieldLabel>
									<Input placeholder='Modelo' />
								</Field>
								<FieldGroup className='flex flex-row gap-x-0!'>
									<Field>
										<FieldLabel>Ano de Fabricação:</FieldLabel>
										<Input
											placeholder='0000'
											className='rounded-r-none border-r-0'
										/>
									</Field>
									<Field>
										<FieldLabel>Ano do Modelo:</FieldLabel>
										<Input placeholder='0000' className='rounded-l-none' />
									</Field>
								</FieldGroup>
								<Field>
									<FieldLabel>
										Chassi:
										<sup className='text-muted-foreground ml-2'>
											( Opcional )
										</sup>
									</FieldLabel>
									<Input placeholder='Chassi' />
								</Field>
								<Field>
									<FieldLabel>Uso do Veículo:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Câmbio:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>CEP de Pernoite:</FieldLabel>
									<Input placeholder='00000-000' />
								</Field>
								<FieldGroup className='flex flex-row gap-x-0!'>
									<Field>
										<FieldLabel>Reside Em:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-r-none border-r-0'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>Tipo de Garagem:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-l-none'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
								</FieldGroup>
								<FieldGroup className='flex flex-row gap-x-0!'>
									<Field>
										<FieldLabel>Trabalho:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-r-none border-r-0'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>Tipo de Garagem:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-l-none'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
								</FieldGroup>
								<FieldGroup className='flex flex-row gap-x-0!'>
									<Field>
										<FieldLabel>Estuda:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-r-none border-r-0'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>Tipo de Garagem:</FieldLabel>
										<Select>
											<SelectTrigger className='rounded-l-none'>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
								</FieldGroup>
							</FieldGroup>
							<FieldGroup className='mt-3'>
								<FieldSet className='gap-0!'>
									<FieldLegend className='mb-1'>Mais Informações</FieldLegend>
									<FieldDescription className='text-xs'>
										Para uma cotação mais eficiente
									</FieldDescription>
								</FieldSet>
								<FieldGroup className='gap-1.5!'>
									<Field orientation='horizontal' className='gap-1.5'>
										<Checkbox />
										<Label className='font-normal text-xs text-[0.8rem]'>
											Blindado
										</Label>
									</Field>
									<Field orientation='horizontal' className='gap-1.5'>
										<Checkbox />
										<Label className='font-normal text-xs text-[0.8rem]'>
											Kit Gás
										</Label>
									</Field>
									<Field orientation='horizontal' className='gap-1.5'>
										<Checkbox />
										<Label className='font-normal text-xs text-[0.8rem]'>
											Segurado é o proprietário do veículo
										</Label>
									</Field>
									<Field orientation='horizontal' className='gap-1.5'>
										<Checkbox />
										<Label className='font-normal text-xs text-[0.8rem]'>
											Financiado
										</Label>
									</Field>
									<Field orientation='horizontal' className='gap-1.5'>
										<Checkbox />
										<Label className='font-normal text-xs text-[0.8rem]'>
											Pessoas entre 18 a 26 anos utilizam o veículo
										</Label>
									</Field>
								</FieldGroup>
							</FieldGroup>
						</FieldGroup>
						<Separator />
						<FieldGroup>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<UserCircle2Icon />
										</div>
										Principal Condutor
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>CPF:</FieldLabel>
									<InputGroup>
										<InputGroupAddon
											align='inline-start'
											className=' border-r pr-3 mr-1 h-full'
										>
											<Label htmlFor='fdsfsdf' className='z-1'>
												O mesmo
											</Label>{' '}
											<Checkbox />
										</InputGroupAddon>
										<InputGroupInput
											id='fdsfsdf'
											placeholder='000.000.000-00'
										/>
									</InputGroup>
								</Field>
								<Field>
									<FieldLabel>Nome Completo:</FieldLabel>
									<Input placeholder='Nome Completo' />
								</Field>
								<Field>
									<FieldLabel>Nascimento:</FieldLabel>
									<Input placeholder='00/00/0000' />
								</Field>
								<Field>
									<FieldLabel>Celular:</FieldLabel>
									<Input placeholder='(00) 00000-0000' />
								</Field>
							</FieldGroup>
						</FieldGroup>
					</FieldGroup>
				</CardContent>
			</Card>
			<Button className='w-full'>
				<SaveIcon /> Salvar Registro
			</Button>
		</main>
	);
}

export default QuotesRegisterPage;
