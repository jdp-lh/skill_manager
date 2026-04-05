import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  ArrowLeft,
  Download,
  Globe,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import {
  MarketplaceListing,
  SkillEntry,
  getMarketplaceListings,
  getMarketplaceListingDetail,
  downloadMarketplaceSkill,
} from "../lib/api";

type MarketplaceViewProps = {
  labels: Record<string, string>;
  storagePath: string;
  skills: SkillEntry[];
  onRefresh: () => void;
  onDownloadSuccess: (message?: string) => void;
};

export function MarketplaceView({
  labels,
  storagePath,
  skills,
  onRefresh,
  onDownloadSuccess,
}: MarketplaceViewProps) {
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadListings = async () => {
    setLoading(true);
    try {
      const query = search.trim() || undefined;
      const response = await getMarketplaceListings(page, pageSize, undefined, query);
      setListings(response.listings);
      setTotal(response.total);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    loadListings();
  }, [page, search]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const isSkillInstalled = (listing: MarketplaceListing) => {
    if (!skills || !Array.isArray(skills)) return false;
    const expectedFileName = `${listing.name.toLowerCase().replace(/ /g, "-")}.md`;
    return skills.some((s) => s.name === expectedFileName || s.name === listing.name || s.name === `${listing.name}.md`);
  };

  const handleDownload = async (listing: MarketplaceListing) => {
    setDownloading(listing.id);
    try {
      const isUpdate = isSkillInstalled(listing);
      await downloadMarketplaceSkill(listing.id, storagePath);
      onDownloadSuccess(isUpdate ? `${listing.name} 更新成功` : `${listing.name} 安装成功`);
      onRefresh();
    } catch (err) {
      console.error("Failed to download:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleViewDetail = async (listing: MarketplaceListing) => {
    try {
      const detail = await getMarketplaceListingDetail(listing.id);
      setSelectedListing(detail);
    } catch (err) {
      console.error("Failed to load detail:", err);
    }
  };

  if (selectedListing) {
    return (
      <MarketplaceListingDetailView
        listing={selectedListing}
        labels={labels}
        installed={isSkillInstalled(selectedListing)}
        onBack={() => setSelectedListing(null)}
        onDownload={handleDownload}
        downloading={downloading}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8fafc]">
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#f8fafc] pt-6 pb-4 px-4 border-b border-gray-100 shrink-0">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 tracking-tight">
          {labels.marketplace || "技能市场"}
        </h1>
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center overflow-hidden rounded-full border border-gray-200 bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50">
            <div className="pl-4 pr-3 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={labels.searchMarketplace || "搜索你想要的技能..."}
              className="flex-1 bg-transparent py-2 text-[14px] outline-none placeholder:text-gray-400 font-medium text-gray-700"
            />
            <button
              onClick={() => {
                setSearch(searchInput);
                setPage(1);
              }}
              className="mr-0.5 rounded-full bg-[#0066FF] px-5 py-2 text-[13px] font-bold text-white transition hover:bg-blue-600 active:scale-95"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-4 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 content-start flex-1 min-h-0 pb-12">
              {listings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  labels={labels}
                  installed={isSkillInstalled(listing)}
                  onViewDetail={handleViewDetail}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </div>

            {listings.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-gray-200 bg-white py-20 px-4 text-center shadow-sm mt-4">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 shadow-sm border border-blue-100">
                  <Search className="h-7 w-7 text-[#0066FF]" />
                </div>
                <h3 className="mb-1.5 text-[17px] font-bold text-gray-900">{labels.noListingsFound || "未找到相关技能"}</h3>
                <p className="text-[14px] text-gray-500 max-w-md leading-relaxed">
                  {search
                    ? `没有找到与 "${search}" 匹配的技能，请尝试调整关键词或分类筛选。`
                    : "该分类下暂无技能数据，请稍后再试。"}
                </p>
                {search && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="mt-6 rounded-full bg-[#F0F4FF] px-6 py-2.5 text-[14px] font-bold text-[#0066FF] transition-all hover:bg-[#E1EAFF] active:scale-95"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-2 flex shrink-0 items-center justify-center gap-2 pb-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {labels.previous}
                </button>
                <span className="px-4 text-xs text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {labels.next}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function generateSkillPreview(listing: MarketplaceListing): string {
  return `# ${listing.name}

## Description

${listing.description}

## Installation

1. Download this skill file
2. Place it in your skills directory
3. Configure as needed

## Usage

Describe how to use this skill here.

## Configuration

Add any configuration options here.
`;
}


function MarketplaceListingDetailView({
  listing,
  labels,
  installed,
  onBack,
  onDownload,
  downloading,
}: {
  listing: MarketplaceListing;
  labels: Record<string, string>;
  installed: boolean;
  onBack: () => void;
  onDownload: (listing: MarketplaceListing) => void;
  downloading: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {labels.back}
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{listing.name}</h1>
      </div>

      <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-gray-900">{listing.name}</h2>
              </div>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-gray-600">
              {listing.description}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500">
              <Globe className="h-4 w-4" />
              <span>来源: {listing.source}</span>
            </div>
            <button
              onClick={() => onDownload(listing)}
              disabled={downloading === listing.id}
              className={`flex items-center gap-2 rounded-full px-8 py-3 text-[15px] font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                installed
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-[#0066FF] text-white hover:bg-blue-600 shadow-md shadow-blue-500/20"
              }`}
            >
              {downloading === listing.id ? (
                <div className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${installed ? 'border-gray-500' : 'border-white'}`} />
              ) : (
                installed ? <RefreshCw className="h-4 w-4" /> : <Download className="h-4 w-4" />
              )}
              {installed ? (labels.update || "更新") : (labels.download || "获取此技能")}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">{labels.skillContent || "技能内容"}</h3>
        <div className="mt-4 rounded-xl border border-gray-100 bg-[#fafafa] p-5 overflow-hidden">
          <div className="prose prose-sm prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-pre:bg-gray-800 prose-pre:text-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {listing.content || generateSkillPreview(listing)}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}


function MarketplaceListingCard({
  listing,
  labels,
  installed,
  onViewDetail,
  onDownload,
  downloading,
}: {
  listing: MarketplaceListing;
  labels: Record<string, string>;
  installed: boolean;
  onViewDetail: (listing: MarketplaceListing) => void;
  onDownload: (listing: MarketplaceListing) => void;
  downloading: string | null;
}) {
  return (
    <article
      onClick={() => onViewDetail(listing)}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 min-h-[140px] transition-all hover:bg-gray-50/50 hover:shadow-md border border-gray-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold tracking-tight text-gray-900 group-hover:text-[#0066FF] transition-colors" title={listing.name}>
              {listing.name}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(listing);
            }}
            disabled={downloading === listing.id}
            className={`flex h-7 items-center justify-center rounded-full px-3.5 text-xs font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shrink-0 ${
              installed
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                : "bg-[#F0F4FF] text-[#0066FF] hover:bg-[#E1EAFF]"
            }`}
          >
            {downloading === listing.id ? (
              <div className={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${installed ? 'border-gray-500' : 'border-[#0066FF]'}`} />
            ) : (
              installed ? (labels.update || "更新") : (labels.install || "获取")
            )}
          </button>
        </div>
        
        <p className="line-clamp-2 text-[12px] leading-snug text-gray-500" title={listing.description}>
          {listing.description || "暂无描述"}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
        <span className="truncate max-w-[120px] font-medium"><User className="inline-block h-3 w-3 mr-1" />{listing.author || "Unknown"}</span>
      </div>
    </article>
  );
}
