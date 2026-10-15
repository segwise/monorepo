import type {
	MarketingCampaign,
	MarketingCampaignInput,
	MarketingContact,
	MarketingContactInput,
	MarketingTemplateOption,
	ResponseDefault,
} from '@segwise/core/types';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
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

const useMarketingCampaigns = (search?: string | null) =>
	useQuery({
		queryKey: ['marketing', 'campaigns', { search: search || null }],
		placeholderData: keepPreviousData,
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<MarketingCampaign>>('/marketing/campaigns', {
					params: { ...(search && { search }) },
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

const useMarketingContacts = (campaignId: string, search?: string | null) =>
	useQuery({
		queryKey: ['marketing', 'contacts', campaignId, { search: search || null }],
		placeholderData: keepPreviousData,
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<MarketingContact>>(
					`/marketing/campaigns/${campaignId}/contacts`,
					{ params: { ...(search && { search }) }, signal },
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

const useMarketingContactsPrint = (campaignId: string) =>
	useMutation<
		Blob,
		Error,
		{
			ids: Array<string>;
			filters: { state?: string | null; city?: string | null };
		}
	>({
		mutationKey: ['marketing', 'contacts', 'print', campaignId],
		mutationFn: async ({ ids, filters }) => {
			try {
				return (
					await api.post(
						`/marketing/campaigns/${campaignId}/contacts/print`,
						{
							ids,
							filters: {
								...(filters.state && { state: filters.state }),
								...(filters.city && { city: filters.city }),
							},
						},
						{ responseType: 'blob' },
					)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao gerar o PDF');
			}
		},
		onSuccess(data) {
			window.open(URL.createObjectURL(data), '_blank');
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
	useMarketingCampaignDelete,
	useMarketingCampaignSave,
	useMarketingCampaignSend,
	useMarketingCampaigns,
	useMarketingContactAdd,
	useMarketingContactRemove,
	useMarketingContactSend,
	useMarketingContacts,
	useMarketingContactsPrint,
	useMarketingTemplates,
};
