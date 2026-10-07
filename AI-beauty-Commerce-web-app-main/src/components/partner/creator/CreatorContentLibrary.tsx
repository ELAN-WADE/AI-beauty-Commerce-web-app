import React, { useState } from 'react';
import {
  Video,
  Search,
  Plus,
  Eye,
  ShoppingBag,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyStateCard } from '../shared/EmptyStateCard';

export interface CreatorContentLibraryProps {
  onOpenCreate: () => void;
}

export const CreatorContentLibrary: React.FC<CreatorContentLibraryProps> = ({
  onOpenCreate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const contentItems = [
    {
      id: 'c-1',
      title: 'Morning Melanin Barrier Shield Regimen',
      type: 'Beauty Routine',
      status: 'published' as const,
      views: '12.8k',
      orders: 42,
      commission: '₦19,400',
      lastEdited: 'Edited yesterday',
      thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c-2',
      title: 'Clinical Barrier Repair Breakdown: 3 Essential Steps',
      type: 'Video Reel',
      status: 'published' as const,
      views: '8.4k',
      orders: 28,
      commission: '₦12,800',
      lastEdited: 'Edited 3 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c-3',
      title: 'Evening Double Cleanse with Botanical Amino Wash',
      type: 'Product Review',
      status: 'draft' as const,
      views: '0',
      orders: 0,
      commission: '₦0',
      lastEdited: 'Saved 4 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'c-4',
      title: 'Lekki Harmattan Sun Defense SPF50+ Wear Test',
      type: 'Video Reel',
      status: 'scheduled' as const,
      views: 'Scheduled for Fri',
      orders: 0,
      commission: '₦0',
      lastEdited: 'Scheduled Oct 12',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const filteredItems = contentItems.filter((item) => {
    if (activeTab === 'published' && item.status !== 'published') return false;
    if (activeTab === 'drafts' && item.status !== 'draft') return false;
    if (activeTab === 'scheduled' && item.status !== 'scheduled') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Content Management
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            My Content Library
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Manage your published regimens, video reels, reviews, and drafts.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>New Content</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Content', count: 4 },
            { id: 'published', label: 'Published', count: 2 },
            { id: 'drafts', label: 'Drafts', count: 1 },
            { id: 'scheduled', label: 'Scheduled', count: 1 }
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles…"
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <EmptyStateCard
          icon={<Video size={24} />}
          title="No content found"
          description="Try selecting a different filter or search term, or create your next routine now."
          actionLabel="Create Content"
          onAction={onOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:border-[#D4AF37]/70 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative h-44 w-full bg-[#FAF9F6] overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="absolute top-3 right-3 bg-[#0F0F10]/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-mono text-white font-bold">
                    {item.type}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <h3 className="font-heading font-bold text-base text-[#0F0F10] line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] font-mono">{item.lastEdited}</p>

                  {/* Performance row */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] text-xs">
                    <div className="flex items-center gap-1 text-[#6B7280]">
                      <Eye size={13} />
                      <span>{item.views}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-[#0F0F10]">
                      <ShoppingBag size={13} className="text-[#997A2E]" />
                      <span>{item.orders} orders</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#0F0F10]">{item.commission}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FAF9F6]/50 flex items-center justify-between">
                <button
                  onClick={() => alert(`Opening editor for ${item.title}`)}
                  className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <div className="flex items-center gap-1 text-[#6B7280]">
                  <button
                    onClick={() => alert('Link copied to clipboard')}
                    className="p-1.5 rounded-full hover:bg-white text-[#4B5563] cursor-pointer"
                    title="Copy share link"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => alert('Archived successfully')}
                    className="p-1.5 rounded-full hover:bg-white text-rose-600 cursor-pointer"
                    title="Archive item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
