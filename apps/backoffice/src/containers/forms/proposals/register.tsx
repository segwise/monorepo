'use client';

import {
	Building2Icon,
	CarIcon,
	ChevronLeftIcon,
	CircleDollarSignIcon,
	ClipboardIcon,
	SaveIcon,
	User2Icon,
	UserCircle2Icon,
} from 'lucide-react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonBack } from '@/components/ui/button/back';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useProfessionsSimple } from '@/libraries/hooks/use-professions';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';

function FormProposalRegister() {
	const { data: producers } = useProducersSimple();
	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();
	const { data: professions } = useProfessionsSimple();
	const { data: manufacturers } = useVehiclesManufacturers();

	return (
		<Fragment>
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
									<FieldLabel>Seguradora:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<FieldGroup className='flex flex-row items-center justify-between gap-x-0!'>
									<Field>
										<FieldLabel>Início da Vigência:</FieldLabel>
										<Input
											placeholder='00/00/0000'
											className='rounded-r-none border-r-0'
										/>
									</Field>
									<Field>
										<FieldLabel>Final da Vigência:</FieldLabel>
										<Input
											placeholder='00/00/0000'
											className='rounded-l-none'
										/>
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
									<FieldLabel>Tempo de Habilitação:</FieldLabel>
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
										Dados do Veículo
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
						<Separator />
						<FieldGroup>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<CircleDollarSignIcon />
										</div>
										Valores
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>Parcelas:</FieldLabel>
									<Input placeholder='X vezes' />
								</Field>
								<Field>
									<FieldLabel>Prêmio Líquido:</FieldLabel>
									<Input placeholder='R$ 000,00' />
								</Field>
								<Field>
									<FieldLabel>Frânquia:</FieldLabel>
									<Input placeholder='R$ 000,00' />
								</Field>
								<Field>
									<FieldLabel>Comissão:</FieldLabel>
									<Input placeholder='R$ 000,00' />
								</Field>
							</FieldGroup>
						</FieldGroup>
						<div className='bg-muted-foreground/10 flex flex-col gap-4 -mx-4 p-4'>
							<FieldSet>
								<FieldContent>
									<FieldTitle className='text-base'>
										<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
											<User2Icon />
										</div>
										Comissionamento
									</FieldTitle>
								</FieldContent>
							</FieldSet>
							<FieldGroup className='grid grid-cols-4'>
								<Field>
									<FieldLabel>Tipo de Comissão:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Percentual:</FieldLabel>
									<Input placeholder='%' />
								</Field>
								<Field>
									<FieldLabel>Desconto:</FieldLabel>
									<InputGroup>
										<InputGroupAddon align='inline-start'>
											<Select>
												<SelectTrigger className='-ml-3 rounded-r-none border-0 border-r w-20 pl-4'>
													<SelectValue placeholder='%' />
												</SelectTrigger>
												<SelectContent align='start'>
													<SelectItem value='percent'>%</SelectItem>
													<SelectItem value='fixed'>R$</SelectItem>
												</SelectContent>
											</Select>
										</InputGroupAddon>
										<InputGroupInput
											placeholder='0'
											className='bg-background'
										/>
									</InputGroup>
								</Field>
								<Field>
									<FieldLabel>Pagar em X Parcelas:</FieldLabel>
									<Input placeholder='X vezes' />
								</Field>
								<Field>
									<FieldLabel>Juros ao Mês:</FieldLabel>
									<Input placeholder='%' />
								</Field>
								<Field>
									<FieldLabel>Juros Pago a Partir do Mês:</FieldLabel>
									<Input placeholder='Mês' />
								</Field>
								<Field>
									<FieldLabel>Tipo de Juros:</FieldLabel>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='simple'>Simples</SelectItem>
											<SelectItem value='compound'>Composto</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field>
									<FieldLabel>Data de Pagamento:</FieldLabel>
									<Input placeholder='00/00/0000' />
								</Field>
							</FieldGroup>
						</div>
						<Separator />
						<FieldGroup className='grid grid-cols-4'>
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<Building2Icon />
											</div>
											Corretora
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='gap-0! space-y-1'>
									<Field orientation='horizontal'>
										<FieldLabel>Parcelas</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
									<Field orientation='horizontal'>
										<FieldLabel>Prêmio Líquido</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
									<Field orientation='horizontal'>
										<FieldLabel>Comissão sobre a venda</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
								</FieldGroup>
							</FieldGroup>
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<User2Icon />
											</div>
											Produtor
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='gap-0! space-y-1'>
									<Field orientation='horizontal'>
										<FieldLabel>Parcelas de Comissão</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
									<Field orientation='horizontal'>
										<FieldLabel>Comissão do Produtor</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
									<Field orientation='horizontal'>
										<FieldLabel>Subtotal</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
									<Field orientation='horizontal'>
										<FieldLabel>Total</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
								</FieldGroup>
							</FieldGroup>
							<FieldGroup className='col-start-4'>
								<FieldSet className='opacity-0 pointer-events-auto'>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<Building2Icon />
											</div>
											Corretora
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='gap-0! space-y-1'>
									<Field orientation='horizontal'>
										<FieldLabel>Total</FieldLabel>
										<FieldLabel className='text-right'>---------</FieldLabel>
									</Field>
								</FieldGroup>
							</FieldGroup>
						</FieldGroup>
					</FieldGroup>
				</CardContent>
			</Card>
			<Button className='w-full'>
				<SaveIcon /> Salvar Registro
			</Button>
		</Fragment>
	);
}

export { FormProposalRegister };
