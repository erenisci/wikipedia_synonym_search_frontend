'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type SearchResult = {
  title: string;
  url: string;
  sentences: string[];
  text: string;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const resultsPerPage = 10;
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.push(`?query=${query}&page=1`);

    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 100 }),
    });

    const data = await res.json();

    const filteredResults = data.results.map((result: SearchResult) => {
      const sentences = result.text
        .split('.')
        .filter((sentence: string) => sentence.toLowerCase().includes(query.toLowerCase()));

      return {
        ...result,
        sentences: sentences.map(sentence => highlightWords(sentence, query)),
      };
    });

    setSearchResults(filteredResults);
    setLoading(false);
  };

  const highlightWords = (sentence: string, query: string) => {
    const wordsToHighlight = query.split(' ');

    let highlightedSentence = sentence;

    wordsToHighlight.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedSentence = highlightedSentence.replace(
        regex,
        `<span style="color: #fdba74;">$1</span>`
      );
    });

    return highlightedSentence;
  };

  const paginatedResults = searchResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const totalPages = Math.ceil(searchResults.length / resultsPerPage);

  // Sayfa değişimi
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(`?query=${query}&page=${page}`);
    }
  };

  const generatePageNumbers = () => {
    const pageNumbers: (number | string)[] = [];

    if (currentPage > 2) pageNumbers.push(1);

    if (currentPage > 2) pageNumbers.push('...');
    if (currentPage > 1) pageNumbers.push(currentPage - 1);
    pageNumbers.push(currentPage);
    if (currentPage < totalPages) pageNumbers.push(currentPage + 1);

    if (totalPages > currentPage + 1) pageNumbers.push('...');
    if (totalPages > 1 && currentPage < 9) pageNumbers.push(totalPages);

    const finalPageNumbers: (number | string)[] = [];
    pageNumbers.forEach((number, index) => {
      if (
        typeof number === 'number' &&
        index > 0 &&
        typeof pageNumbers[index - 1] === 'number' &&
        number - (pageNumbers[index - 1] as number) > 1
      ) {
        finalPageNumbers.push('...');
      }
      finalPageNumbers.push(number);
    });

    return finalPageNumbers;
  };

  const truncateTitle = (title: string) => {
    return title.length > 30 ? title.slice(0, 40) + '...' : title;
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
  };

  return (
    <div className='flex h-screen justify-center items-center gap-20'>
      {/* Sol Bölüm */}
      <div className='flex-1 bg-gray-900 p-4 min-w-[25rem] max-w-[25rem]'>
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className={`flex items-center rounded-lg transition-all duration-500 ${
            focused ? 'shadow-[1px_1px_10px_5px_rgba(255,255,255,0.1)]' : ''
          }`}
        >
          <input
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search...'
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className='w-full p-2 bg-gray-200 text-gray-700 focus:outline-none rounded-l-md text-l font-semibold'
          />
          <button
            type='submit'
            className='p-2 bg-gray-700 text-gray-200 rounded-r-[6.7px] hover:bg-gray-500 focus:outline-none'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='1.5'
              stroke='currentColor'
              className='w-6 h-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
              />
            </svg>
          </button>
        </form>

        {/* Loader */}
        {loading && (
          <div className='mt-4 text-center text-gray-400'>
            <div className='w-8 h-8 border-4 border-t-transparent border-gray-200 rounded-full animate-spin mx-auto'></div>
            <p className='mt-2'>Searching...</p>
          </div>
        )}

        {/* Arama Sonuçları */}
        {!loading && paginatedResults.length > 0 && (
          <div className='mt-4'>
            {paginatedResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultClick(result)}
                className={`block p-3 border-b border-gray-700 bg-gray-200 text-gray-700 cursor-pointer hover:bg-gray-400 font-semibold ${
                  index === 0 ? 'rounded-t-lg' : ''
                } ${index === paginatedResults.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                {truncateTitle(result.title)}
              </div>
            ))}

            {/* Pagination */}
            <div className='flex justify-center items-center mt-4 space-x-2'>
              {generatePageNumbers().map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return (
                    <span
                      key={`dots-${index}`}
                      className='px-2 text-gray-200'
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber as number)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNumber
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-500'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sağ Bölüm */}
      {selectedResult && (
        <div className=' bg-gray-800 p-2 flex flex-col text-white overflow-y-auto max-w-[40rem] min-w-[40rem] rounded-lg min-h-[36.9rem] max-h-[36.9rem] justify-between'>
          <div className='flex items-center space-x-2 justify-between px-6 py-3 max-h-20'>
            <h1 className='text-2xl text-blue-300 font-semibold max-w-[26rem]'>
              {selectedResult.title}
            </h1>
            <div className='flex justify-center items-center text-xs min-w-30 max-w-30'>
              <a
                href={selectedResult.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-500 hover:text-blue-200 inline-block'
              >
                <p className='inline-block mr-2'>Wikipedia sayfasına git</p>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-4 h-4 inline-block'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25'
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className='mt-4 overflow-y-scroll custom-scrollbar pr-2 min-h-[29rem] max-h-[29rem]'>
            {selectedResult.sentences && selectedResult.sentences.length > 0 ? (
              selectedResult.sentences.map((sentence, index) => (
                <div
                  key={index}
                  className='bg-gray-700 p-2 rounded-md mt-2'
                  dangerouslySetInnerHTML={{ __html: sentence }}
                />
              ))
            ) : (
              <p className='text-gray-400 px-6'>No relevant sentences found...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
