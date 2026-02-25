import type { SalesChannel } from './product-schema';

export const CHANNEL_METADATA: Record<SalesChannel, { label: string; description: string }> = {
  KODY_GLOBAL: {
    label: 'KODY Global (EN)',
    description: '국제몰 (EN) 채널 노출',
  },
  KPOP_WHOLESALE: {
    label: 'KPOP Wholesale (KR)',
    description: '국내 도매 채널 노출',
  },
  KPOP_B2B: {
    label: 'KPOP B2B',
    description: '파트너 대상 B2B 전용 페이지',
  },
};

export function toChannelOptions<T extends SalesChannel>(channels: readonly T[]) {
  return channels.map((channel) => ({
    id: channel,
    label: CHANNEL_METADATA[channel]?.label ?? channel,
    description: CHANNEL_METADATA[channel]?.description,
  }));
}
