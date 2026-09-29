import type {
	MarketingCampaign,
	MarketingCampaignInput,
	MarketingContact,
	MarketingContactInput,
	MarketingTemplateOption,
	ResponseDefault,
} from '@segwise/core/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

function toError(error: unknown, fallback: string) {
	if (error instanceof XiorError && error.response?.data?.message) {
		return new Error(error.response.data.message);
	}

	return new Error(fallback);
}

const useMarketingTemplates = () =>
	useQuery({
		queryKey: ['marketing', 'templates'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<MarketingTemplateOption>>('/marketing/templates', {
					signal,
				})
			).data,
		staleTime: Number.POSITIVE_INFINITY,
	});

const useMarketingCampaigns = () =>
	useQuery({
		queryKey: ['marketing', 'campaigns'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<MarketingCampaign>>('/marketing/campaigns', {
					signal,
				})
			).data,
	});

const useMarketingCampaignSave = (id?: string) =>
	useMutation<ResponseDefault, Error, MarketingCampaignInput>({
		mutationKey: ['marketing', 'campaigns', 'save', id],
		mutationFn: async (props) => {
			try {
				return id
					? (
							await api.put<ResponseDefault>(
								`/marketing/campaigns/${id}`,
								props,
							)
						).data
					: (await api.post<ResponseDefault>('/marketing/campaigns', props))
							.data;
			} catch (error) {
				throw toError(error, 'Falha ao salvar campanha');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({ queryKey: ['marketing'] });
		},
	});

const useMarketingCampaignDelete = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['marketing', 'campaigns', 'delete', id],
		mutationFn: async () => {
			try {
				return (await api.delete<ResponseDefault>(`/marketing/campaigns/${id}`))
					.data;
			} catch (error) {
				throw toError(error, 'Falha ao excluir campanha');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({ queryKey: ['marketing'] });
		},
	});

const useMarketingCampaignSend = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['marketing', 'campaigns', 'send', id],
		mutationFn: async () => {
			try {
				return (
					await api.post<ResponseDefault>(`/marketing/campaigns/${id}/send`)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao enviar campanha');
			}
		},
	});

const useMarketingContacts = (campaignId: string) =>
	useQuery({
		queryKey: ['marketing', 'contacts', campaignId],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<MarketingContact>>(
					`/marketing/campaigns/${campaignId}/contacts`,
					{ signal },
				)
			).data,
	});

const useMarketingContactAdd = (campaignId: string) =>
	useMutation<ResponseDefault, Error, MarketingContactInput>({
		mutationKey: ['marketing', 'contacts', 'add', campaignId],
		mutationFn: async (props) => {
			try {
				return (
					await api.post<ResponseDefault>(
						`/marketing/campaigns/${campaignId}/contacts`,
						props,
					)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao adicionar contato');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({ queryKey: ['marketing'] });
		},
	});

const useMarketingContactSend = (campaignId: string) =>
	useMutation<ResponseDefault, Error, string>({
		mutationKey: ['marketing', 'contacts', 'send', campaignId],
		mutationFn: async (contactId) => {
			try {
				return (
					await api.post<ResponseDefault>(
						`/marketing/campaigns/${campaignId}/contacts/${contactId}/send`,
					)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao enviar e-mail');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			// O worker grava o envio em seguida; recarrega a lista depois.
			setTimeout(
				() => ctx.client.invalidateQueries({ queryKey: ['marketing'] }),
				4000,
			);
		},
	});

const useMarketingContactRemove = (campaignId: string) =>
	useMutation<ResponseDefault, Error, string>({
		mutationKey: ['marketing', 'contacts', 'remove', campaignId],
		mutationFn: async (contactId) => {
			try {
				return (
					await api.delete<ResponseDefault>(
						`/marketing/campaigns/${campaignId}/contacts/${contactId}`,
					)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao remover contato');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({ queryKey: ['marketing'] });
		},
	});

export {
	useMarketingTemplates,
	useMarketingCampaigns,
	useMarketingCampaignSave,
	useMarketingCampaignDelete,
	useMarketingCampaignSend,
	useMarketingContacts,
	useMarketingContactAdd,
	useMarketingContactSend,
	useMarketingContactRemove,
};
