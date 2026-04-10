import {
	maskPhone,
	maskPlate,
	maskPostalCode,
	translateModality,
	translateVehicleUsage,
} from '@segwise/core';
import type { QuotePrint } from '@segwise/core/types';
import { parseISO } from 'date-fns';
import hbs from 'handlebars';
import { PDFDocument } from 'pdf-lib';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/libraries/database/adapters/quote/print';
import { serializer } from '@/libraries/database/serializers/quote/print';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

const htmlText = `
  <html lang='pt-BR' class='h-full'>
    <head>
      <meta charset='UTF-8' />
      <meta http-equiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <title>{{title}}</title>
      <script src='https://cdn.tailwindcss.com'></script>
    </head>
    <body class='flex flex-col h-full p-5'>
      <header class='w-full flex flex-row items-center justify-between gap-10'>
        <h1
          class='uppercase font-extrabold text-lg text-black flex flex-row items-start justify-start leading-tight gap-1'
        >
          formulário para cotação
          <br />
          de seguro veicular
        </h1>
        <div class='flex flex-col gap-2 leading-tight text-right text-xs'>
          <span class='uppercase font-extrabold text-black leading-tight'>
            indicação:
            <span class='underline text-[20px] font-bold'>
              {{producer}}
            </span>
          </span>
          <span class='uppercase font-extrabold text-black leading-tight'>
            data:
            <span class='font-normal'>{{created_at}}</span>
          </span>
        </div>
      </header>
      <main class='h-full flex flex-1 flex-col gap-6 bg-white rounded-t-lg my-5'>
        <div>
          <div class='flex flex-row items-center justify-between'>
            <span
              class='uppercase font-extrabold text-lg text-black flex flex-row items-center justify-start gap-1'
            >

              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z'
                />
              </svg>
              dados do segurado
            </span>
            <div class='flex flex-row gap-0 items-end'>
              {{#eq type 'renovação'}}
                {{#if insured.additional_information.hasBonusClass}}
                  <div>
                    <span class='uppercase text-[7.8px] font-bold'>Classe de Bônus</span>
                    <span
                      class='bg-white h-7 px-4 py-1 text-sm text-black font-extrabold uppercase border border-black border-r-0 flex flex-row items-center gap-3'
                    >
                      {{insured.additional_information.bonus_class}}
                    </span>
                  </div>
                {{/if}}
                {{#if validity}}
                  <div>
                    <span class='uppercase text-[7.8px] font-bold'>final da
                      vigência</span>
                    <span
                      class='bg-white h-7 px-4 py-1 text-sm text-black font-extrabold uppercase border border-black border-r-0 flex flex-row items-center gap-3'
                    >
                      {{validity}}
                    </span>
                  </div>
                {{/if}}
                <div>
                  <span class='uppercase text-[7.8px] font-bold'>seguradora</span>
                  <span
                    class='bg-white h-7 px-4 py-1 w-40 truncate text-sm text-black font-extrabold uppercase border border-black border-r-0 flex flex-row items-center gap-3'
                  >
                    <img src={{insurer.image}} class='w-5 h-5' alt='seguradora' />
                    <span class='truncate'>{{insurer.name}}</span>
                  </span>
                </div>
              {{/eq}}
              <div>
                <span class='uppercase text-[7.8px] font-bold'>tipo de cotação</span>
                <span
                  class='bg-white h-7 px-4 py-1 text-sm text-black font-extrabold items-center flex flex-row uppercase border border-black'
                >
                  {{type}}
                </span>
              </div>
            </div>
          </div>
          <table
            class='w-full flex flex-row flex-no-wrap overflow-hidden border border-black mt-2'
          >
            <thead class='text-black uppercase rounded-t-lg'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-10 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  nome completo | telefone
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  cpf
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  e-mail
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-10 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  estado civil
                </th>
              </tr>

              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-black'
                >
                  profissão
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-t border-black'
                >
                  cep do segurado
                </th>
              </tr>
            </thead>
            <thead class='text-black rounded-t-lg w-full'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-10 uppercase items-center flex w-full border-b border-black'
                >
                  {{insured.name}}
                  <span class='mx-3'>|</span>
                  {{insured.contact.phone}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  {{insured.registration}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  {{insured.contact.email}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-10 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SOLTEIRO&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;CASADO&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;UNIÃO
                  ESTÁVEL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;DIVORCIADO&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;VIÚVO
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full'
                >
                  {{insured.additional_information.office}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase border-t border-black w-full flex flex-row items-center justify-start gap-5'
                >
                  <span>
                    {{insured.address.zip_code}}
                  </span>
                  <span>
                    Nº:
                    {{#if insured.address.number}}
                      {{insured.address.number}}
                    {{else}}
                      ______
                    {{/if}}
                  </span>
                  <span>
                    Complemento:
                    {{#if insured.address.complement}}
                      {{insured.address.complement}}
                    {{else}}
                      ______
                    {{/if}}
                  </span>
                </th>
              </tr>
            </thead>
          </table>
        </div>
        <div>
          <div class='flex flex-row items-center justify-between'>
            <span
              class='uppercase font-extrabold text-lg text-black flex flex-row items-center justify-start gap-1'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z'
                />
              </svg>
              dados do veículo
            </span>
          </div>
          <table
            class='w-full flex flex-row overflow-hidden border border-black border-b-0 mt-2'
          >
            <thead class='text-black uppercase rounded-t-lg'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  placa | modelo
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  proprietário
                </th>
              </tr>
            </thead>
            <thead class='text-black rounded-t-lg w-full'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  {{details.vehicle.plate}}
                  <span class='mx-3'>|</span>
                  {{details.vehicle.model}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO
                </th>
              </tr>
            </thead>
          </table>
          <table
            class='w-full flex flex-col overflow-hidden border border-t-0 border-black'
          >
            <thead class='text-black'>
              <tr class='bg-white flex flex-row flex-no wrap'>
                <th
                  class='p-2 text-left text-xs h-10 uppercase items-center flex w-[535px] border-r border-black truncate'
                >FINANCIADO:<br
                  />(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO</th>
                <th
                  class='p-2 text-left text-xs h-10 uppercase items-center flex w-full border-r border-black'
                >BLINDADO:<br
                  />(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO</th>
                <th
                  class='p-2 text-left text-xs h-10 uppercase items-center flex w-full border-black'
                >TEM KIT GÁS:<br
                  />(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO</th>
              </tr>
            </thead>
          </table>
        </div>
        <div>
          <div class='flex flex-col items-start gap-0'>
            <span
              class='uppercase font-extrabold text-lg text-black flex flex-row items-center justify-start gap-1 leading-none'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z'
                />
              </svg>
              dados do condutor
            </span>
            <span class='text-[7.8px] uppercase font-medium'>
              a pessoa que utiliza o veículo do segurado 2 ou mais dias por
              semana, caso existam mais de um condutor nesta condição, será
              definido sempre o de menor idade
            </span>
          </div>
          <table
            class='w-full flex flex-col flex-no-wrap overflow-hidden border border-black mt-2'
          >
            <thead class='text-black'>
              <tr class='bg-white flex flex-row flex-no wrap'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-[268px] border-b border-r border-black'
                >
                  O
                  mesmo:&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM
                </th>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >nome completo:</th>
              </tr>
            </thead>
            <thead class='text-black'>
              <tr class='bg-white flex flex-row flex-no wrap'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-[535px] border-r border-black'
                >CPF:</th>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-r border-black'
                >RG:</th>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-black'
                >EMISSOR:</th>
              </tr>
            </thead>
          </table>
        </div>
        <div>
          <div class='flex flex-col items-start gap-0'>
            <span
              class='uppercase font-extrabold text-lg text-black flex flex-row items-center justify-start gap-1 leading-none'
            >

              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z'
                />
              </svg>
              avaliação de risco
            </span>
          </div>
          <table
            class='w-full flex flex-row flex-no-wrap overflow-hidden border border-black mt-2'
          >
            <thead class='text-black uppercase rounded-t-lg'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  uso do veículo
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  cep de pernoite
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  pernoita em
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  cobertura 18/26 anos
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  garagem na residência
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-b border-black'
                >
                  garagem no trabalho
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-black'
                >
                  garagem na escola
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='bg-white p-2 text-left text-xs h-7 uppercase items-center flex w-[200px] border-r border-t border-black'
                >
                  houve sinistro
                </th>
              </tr>
            </thead>
            <thead class='text-black rounded-t-lg w-full'>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  {{details.vehicle.vehicle_use}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  {{details.vehicle.zip_code}}
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;CASA&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;APARTAMENTO&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;CASA
                  EM CONDOMÍNIO
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;&nbsp;SIM,
                  PORTÃO
                  MANUAL&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;&nbsp;SIM,
                  COM PORTÃO AUTOMÁTICO
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO
                  TRABALHA&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;&nbsp;SIM&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;&nbsp;SIM
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO
                  ESTUDA&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM
                </th>
              </tr>
              <tr class='flex flex-row flex-no wrap rounded-t-lg'>
                <th
                  class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-t border-black'
                >
                  (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;SIM&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)&nbsp;NÃO
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </main>
      <footer class='bg-white pb-5'>
        <div>
          <div class='flex flex-row items-center justify-between'>
            <span
              class='uppercase font-extrabold text-lg text-black flex flex-row items-center justify-start gap-1'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
                />
              </svg>
              Dados para Fechamento
            </span>
            <div class='flex flex-row gap-10 text-xs text-black font-bold'>
              <span>
                APÓLICE:
                <span class='font-normal'>____________________________</span>
              </span>
              <span>
                |
              </span>
              <span>
                C.I:
                <span class='font-normal'>______________</span>
              </span>
            </div>
          </div>
          <div class='flex items-center justify-center mt-2'>
            <div class='container'>
              <table
                class='w-full flex flex-col flex-no-wrap overflow-hidden border border-black'
              >
                <thead class='text-black'>
                  <tr class='bg-white flex flex-row flex-no wrap'>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-[820px] border-b border-r border-black'
                    >CPF: {{insured.registration}}</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-r border-black'
                    >RG: {{insured.rg}}</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-r border-black'
                    >EMISSOR: {{insured.rg_sender}}</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-black'
                    >DATA DE EMISSÃO: {{insured.date_rg_sender_at}}</th>
                  </tr>
                </thead>
                <thead class='text-black'>
                  <tr class='bg-white flex flex-row flex-no wrap'>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-[820px] border-b border-t border-r border-black'
                    >BANCO:</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-r border-black'
                    >AGÊNCIA:</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-r border-black'
                    >DIA DA PARCELA:</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-black'
                    ></th>
                  </tr>
                </thead>
                <thead class='text-black'>
                  <tr class='bg-white flex flex-row flex-no wrap'>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-[820px] border-b border-t border-r border-black'
                    >Nº CARTÃO</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-r border-black'
                    >NOME NO CARTÃO</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-r border-black'
                    >BANDEIRA</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-b border-t border-black'
                    >VALIDADE</th>
                  </tr>
                </thead>
                <thead class='text-black'>
                  <tr class='bg-white flex flex-row flex-no wrap'>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-[820px] border-r border-black'
                    >{{condutor.marital_status}}</th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-r border-black'
                    ></th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-r border-black'
                    ></th>
                    <th
                      class='p-2 text-left text-xs h-7 uppercase items-center flex w-full border-black'
                    ></th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
      </footer>
    </body>
  </html>
`;

async function compile(
	quote: Omit<QuotePrint, 'insuranceCompanyId'> & {
		insuranceCompany: {
			name: string;
			icon: string;
		};
	},
) {
	const formatadorData = new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
	const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	});

	hbs.registerHelper('eq', function (a, b, options) {
		//@ts-expect-error
		return a === b ? options.fn(this) : options.inverse(this);
	});

	return hbs.compile(htmlText)({
		validity: quote.expiration
			? new Intl.DateTimeFormat('pt-BR').format(
					typeof quote.expiration === 'string'
						? parseISO(quote.expiration)
						: quote.expiration,
				)
			: undefined,
		type: quote.renewal ? 'renovação' : 'seguro novo',
		category: translateModality(quote.modality),
		// company: {
		// 	image: quote.company.image ?? 'https://app.segwise.com.br' + LOGO.src,
		// 	name: quote.company.short_name ?? quote.company.name,
		// 	registration: maskedCNPJ(quote.company.registration),
		// 	theme: {
		// 		primary: quote.company.theme?.primary,
		// 	},
		// },
		...(!!quote.insuranceCompany && {
			insurer: {
				name: quote.insuranceCompany.name,
				image: quote.insuranceCompany.icon,
			},
		}),
		insured: {
			name: quote.insured.name,
			// registration: isCPF(quote.insured.registration) ? maskCPF(quote.insured.registration) : maskCNPJ(quote.insured.registration),
			contact: {
				phone: maskPhone(quote.insured.contact.phone),
				// email: quote.insured.contacts?.find((e) => e.type === 'email')?.value,
			},
			// address: {
			// 	zip_code: maskedZipCode(quote.insured.address?.zip_code),
			// 	street: quote.insured.address?.street,
			// 	neighborhood: quote.insured.address?.neighborhood,
			// 	city: quote.insured.address?.city,
			// 	number: quote.insured.address?.number,
			// },
			// marital_status: '',
			// first_license: '',
			// owner_vehicle: '',
			// additional_information: {
			// 	bonus_class: quote.insured.additional_information?.bonus_class,
			// 	office: quote.insured.additional_information?.office,
			// },
		},
		producer: quote.producer,
		details: {
			vehicle: {
				model: !quote.vehicle?.plate
					? quote.vehicle?.modelYear
					: quote.vehicle.model && quote.vehicle.modelYear
						? `${quote.vehicle.model} - ${quote.vehicle.modelYear}`
						: undefined,
				plate: !quote?.vehicle?.plate
					? 'Sem Placa'
					: maskPlate(quote.vehicle.plate),
				vehicle_use: quote.vehicle
					? translateVehicleUsage(quote.vehicle.usage)
					: 'Sem uso definido',

				zip_code: quote.vehicle?.overnightPostalCode
					? maskPostalCode(quote.vehicle.overnightPostalCode)
					: 'Sem endereço definido',
			},
		},
		created_at: `${formatadorData.format(
			quote.requestedAt,
		)} - ${formatadorHora.format(quote.requestedAt)}h` as string,
		// qrcode:
		// 	`https://${quote.company.registration}.segwise.com` +
		// 	'/api/quotes/' +
		// 	quote.id +
		// 	'/pdf',
	});
}

function registerRoutersServicesQuotesByIdPrint(server: Server) {
	server.get('/print', async (ctx) => {
		const id = ctx.req.param('id');

		const quote = await ctx.database.quote.findUnique({
			where: {
				id,
			},
			select: selectPrisma,
		});

		if (!quote) {
			return ctx.json(
				{
					message: 'Cotação não encontrada!',
				},
				404,
			);
		}

		// @ts-expect-error
		const content = await compile({
			...serializer(quote),
			...(!!quote.producer && {
				producer: quote.producer.name,
			}),
			...(!quote.producer && {
				producer: 'SEGWISE',
			}),
			...(!!quote.insuranceCompany && {
				insuranceCompany: {
					name: quote.insuranceCompany.name,
					icon: getPresignedUrl(
						ctx.storage.images,
						quote.insuranceCompany.icon,
					),
				},
			}),
		});

		const { page, release } = await ctx.browser();

		try {
			await page.setContent(content, {
				waitUntil: 'networkidle',
				timeout: 15000,
			});

			const pdfBuffer = await page.pdf({
				pageRanges: '1',
				format: 'A4',
				printBackground: true,
				margin: {
					left: 0,
					top: 0,
					right: 0,
					bottom: 0,
				},
			});

			const pdf = await PDFDocument.load(pdfBuffer);

			pdf.setTitle(`${quote.id}.pdf`);
			pdf.setAuthor('SEGWISE TECNOLOGIA');
			pdf.setCreator('SEGWISE TECNOLOGIA');
			pdf.setLanguage('pt-BR');
			pdf.setCreationDate(quote.requestedAt);
			pdf.setModificationDate(quote.updatedAt);

			return new Response(await pdf.save(), {
				headers: {
					'Content-Type': 'application/pdf',
				},
				status: 200,
			});
		} catch {
			return ctx.json({ message: 'Erro ao gerar PDF' }, 500);
		} finally {
			await release();
		}
	});
}

export { registerRoutersServicesQuotesByIdPrint };
