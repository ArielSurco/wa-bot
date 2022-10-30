import { LbryItemData, LbryVideo } from '../constants/interfaces';
import { getVideosList } from '../services/lbryService';
import { getData, setData } from '../utils/files';

export const getChannelVideos = async (
  channel: string,
  createLog?: Function,
): Promise<LbryVideo[]> => {
  const firstRequest = await getVideosList(channel, 1);
  const pages = [];
  for (let i = 2; i <= firstRequest.result.total_pages; i += 1) {
    pages.push(i);
  }
  await createLog(`Se encontraron ${firstRequest.result.total_items} videos en el canal ${channel}`);
  const leftRequests = await Promise.all(pages.map(async (page) => {
    const videosList = await getVideosList(channel, page);
    return videosList;
  }));
  const leftRequestsItems = leftRequests.map((req) => req.result.items).flat();
  const allItems = [...firstRequest.result.items, ...leftRequestsItems];
  const objs: LbryVideo[] = allItems.map((obj) => {
    const cantConvertVideoObj = !obj.value?.title
      || !obj.value.thumbnail?.url
      || !obj?.claim_id
      || !obj.value.source?.sd_hash;
    if (cantConvertVideoObj) {
      return null;
    }
    return {
      title: obj.value.title,
      thumbnail: obj.value.thumbnail?.url,
      videoUrl: `https://player.odycdn.com/api/v3/streams/free/${obj.name}/${obj.claim_id}/${obj.value.source.sd_hash}.mp4`,
    };
  });
  const objsWithoutNull: LbryVideo[] = objs.filter((obj) => obj !== null);
  return objsWithoutNull;
};

export const alreadyExistsChannel = (channel: string): boolean => {
  const data: LbryItemData[] = getData('lbry');
  const alreadyExists = data.some((obj) => obj.channel === channel);
  return alreadyExists;
};

export const saveVideosChannel = async (channel: string, createLog: Function = () => {}) => {
  const lbryData: LbryItemData[] = getData('lbry');
  const channelAlreadySaved = lbryData.some((item) => item.channel === channel);
  const channelVideos = await getChannelVideos(channel, createLog);
  if (channelAlreadySaved) {
    const lbryItem = lbryData.find((item) => item.channel === channel);
    lbryItem.videos = channelVideos;
  } else {
    lbryData.push({ channel, videos: channelVideos });
  }
  setData('lbry', lbryData);
};

export const getAllLbryVideos = (): LbryVideo[] => {
  const lbryData: LbryItemData[] = getData('lbry');
  const videos = lbryData.map((item) => item.videos).flat();
  return videos;
};

export const updateAllLbryChannels = async () => {
  const lbryData: LbryItemData[] = getData('lbry');
  const channels = lbryData.map((item) => item.channel);
  await Promise.all(channels.map((channel) => saveVideosChannel(channel)));
};
