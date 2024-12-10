import { Client } from '@elastic/elasticsearch';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const ELASTIC_URL = process.env.ELASTIC_URL || '';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME || '';
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD || '';

export const client = new Client({
  node: ELASTIC_URL,
  auth: {
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD,
  },
});

type Article = {
  title: string;
  text: string;
  url: string;
};

export async function searchArticles(
  query: string,
  skip: number = 0,
  limit: number = 10,
  index = 'wikipedia'
): Promise<Article[]> {
  const searchBody = {
    from: skip,
    size: limit,
    query: {
      bool: {
        should: [
          {
            match: {
              title: {
                query,
                boost: 3.0,
              },
            },
          },
          {
            match: {
              text: {
                query,
                fuzziness: 'AUTO',
                boost: 2.0,
              },
            },
          },
          {
            nested: {
              path: 'keywords',
              query: {
                bool: {
                  should: [
                    {
                      match: {
                        'keywords.word': {
                          query,
                          fuzziness: 'AUTO',
                          boost: 1.5,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  };

  const response = await client.search({
    index,
    body: searchBody,
  });

  return (response.hits.hits as Array<{ _source: Article }>).map(hit => ({
    title: hit._source.title,
    text: hit._source.text,
    url: hit._source.url,
  }));
}
