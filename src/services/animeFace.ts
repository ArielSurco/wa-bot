import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const animeFaceAPI: string = process.env.ANIME_FACE_API;

export const postCreateAnimeFace = async (image: string) => {
  const response = await axios.post(animeFaceAPI, {
    busiId: 'ai_painting_anime_img_entry',
    images: [image],
    extra: JSON.stringify({
      face_rects: [],
      version: 2,
      platform: 'web',
      data_report: {
        parent_trace_id: 'a93cf8a7-558e-e369-441d-839c943458b7',
        root_channel: '',
        level: 0,
      },
    }),
    // eslint-disable-next-line max-len
    // extra: '{"face_rects":[],"version":2,"platform":"web","data_report":{"parent_trace_id":"a93cf8a7-558e-e369-441d-839c943458b7","root_channel":"","level":0}}',
  });
  return response.data;
};

export default postCreateAnimeFace;
