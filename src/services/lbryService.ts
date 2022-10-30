import axios from 'axios';

export const getVideosList = async (channel: string, page: number, pageSize: number = 50) => {
  const requestBody = {
    method: 'claim_search',
    params: {
      channel,
      order_by: 'release_time',
      page,
      page_size: pageSize,
    },
  };
  const response = await axios.post('https://api.lbry.tv/api/v1/proxy', requestBody);
  return response.data;
};

export default getVideosList;
