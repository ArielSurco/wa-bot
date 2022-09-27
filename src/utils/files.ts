import fs from 'fs';

export const getData = (type) => {
  const data = fs.readFileSync(`${__dirname}/../../data/${type}.json`, 'utf8');
  return JSON.parse(data);
};

export const setData = (type, data) => {
  const stringifiedData = JSON.stringify(data);
  fs.writeFileSync(`${__dirname}/../../data/${type}.json`, stringifiedData, 'utf8');
};
