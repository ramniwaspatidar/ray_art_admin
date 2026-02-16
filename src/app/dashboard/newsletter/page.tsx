'use client';

import React, { useState, useEffect } from 'react';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { withAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { getCookieAuthToken } from '@/utils/auth';

interface Newsletter {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterPagination {
  currentPage: number;
  itemsPerPage: number;
  hasMore: boolean;
  offset: number;
  total: number;
}

const NewsletterPage: React.FC = () => {
  const [emails, setEmails] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<NewsletterPagination>({
    currentPage: 1,
    itemsPerPage: 10,
    hasMore: false,
    offset: 0,
    total: 0
  });

  const fetchNewsletters = async (page: number = 1, search: string = searchQuery) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: search
      });
      
      const token = getCookieAuthToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/newsletter?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setEmails(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        toast.error(result.message || 'Failed to fetch newsletters');
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Failed to fetch newsletters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNewsletters(1, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    fetchNewsletters(page);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 p-4 border-b bg-theme-background border-theme-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-theme-foreground">Newsletters</h1>
            <p className="text-sm text-muted-foreground">Manage newsletter subscriptions</p>
          </div>
          <div className="w-64">
             <input
              type="text"
              placeholder="Search email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-theme-border rounded-lg bg-theme-background text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-4 min-h-0">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-hidden bg-theme-background border border-theme-border rounded-xl shadow-lg">
              <div className="h-full overflow-auto">
                <table className="w-full min-w-max">
                  <thead className="table-header border-b border-theme-border sticky top-0 bg-theme-background z-10">
                    <tr>
                      <th className="table-header-text px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Email Address
                      </th>
                      <th className="table-header-text px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Subscribed On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {emails.length === 0 ? (
                      <tr>
                        <td className="px-6 py-12 text-center text-neutral-500" colSpan={2}>
                          No newsletter subscriptions found
                        </td>
                      </tr>
                    ) : (
                      emails.map((item) => (
                        <tr 
                          key={item.id}
                          className="table-row-hover transition-colors duration-200 hover:bg-theme-muted/20"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-foreground">
                            {item.email}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!loading && emails.length > 0 && (
              <div className="flex-shrink-0 mt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  // Calculating max page based on total and items per page since maxPageReached isn't in this specific API response
                  maxPageReached={Math.ceil(pagination.total / pagination.itemsPerPage)}
                  onPageChange={handlePageChange}
                  canGoNext={pagination.hasMore}
                  canGoPrev={pagination.currentPage > 1}
                  itemsOnCurrentPage={emails.length}
                  itemsPerPage={pagination.itemsPerPage}
                  hasMore={pagination.hasMore}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default withAuth(NewsletterPage);
