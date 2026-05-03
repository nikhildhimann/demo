"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProperties(query: string = "") {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/properties${query ? `?${query}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    properties: data?.properties || [],
    metadata: {
      totalPages: data?.totalPages || 0,
      currentPage: data?.currentPage || 1,
      totalCount: data?.totalCount || 0,
    },
    isLoading,
    isError: error,
    mutate,
  };
}
