import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Globe,
  Search,
  Star,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import {
  MarketplaceCategory,
  MarketplaceListing,
  getMarketplaceListings,
  getFeaturedListings,
  getMarketplaceCategories,
  getMarketplaceListingDetail,
  downloadMarketplaceSkill,
} from "../lib/api";

type MarketplaceViewProps = {
  labels: Record<string, string>;
  storagePath: string;
  onRefresh: () => void;
  onDownloadSuccess: () => void;
};

export function MarketplaceView({
  labels,
  storagePath,
  onRefresh,
  onDownloadSuccess,
}: MarketplaceViewProps) {
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [featured, setFeatured] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadListings = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === "all" ? undefined : selectedCategory;
      const query = search.trim() || undefined;
      const response = await getMarketplaceListings(page, pageSize, category, query);
      setListings(response.listings);
      setTotal(response.total);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatured = async () => {
    setFeaturedLoading(true);
    try {
      const data = await getFeaturedListings();
      setFeatured(data);
    } catch (err) {
      console.error("Failed to load featured:", err);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await getMarketplaceCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    loadCategories();
    loadListings();
  }, []);

  useEffect(() => {
    loadListings();
  }, [page, search, selectedCategory]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleDownload = async (listing: MarketplaceListing) => {
    setDownloading(listing.id);
    try {
      await downloadMarketplaceSkill(listing.id, storagePath);
      onDownloadSuccess();
      await loadFeatured();
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
        onBack={() => setSelectedListing(null)}
        onDownload={handleDownload}
        downloading={downloading}
      />
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{labels.marketplace}</h1>
          <p className="mt-1 text-sm text-gray-500">{labels.marketplaceHint}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={labels.searchMarketplace}
              className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              onRefresh();
              void loadFeatured();
              void loadCategories();
              void loadListings();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {labels.refresh}
          </button>
        </div>
      </div>

      {page === 1 && !search && selectedCategory === "all" && (featuredLoading || featured.length > 0) && (
        <div className="shrink-0">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{labels.featured}</h2>
          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    <div className="min-w-0 flex-1 space-y-2 py-1">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-5/6 rounded bg-gray-200" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-3 w-12 rounded bg-gray-200" />
                    <div className="h-6 w-8 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <FeaturedListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetail={handleViewDetail}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-col">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          loading={categoriesLoading}
          labels={labels}
          onCategoryChange={handleCategoryChange}
        />

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {listings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  labels={labels}
                  onViewDetail={handleViewDetail}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </div>

            {listings.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{labels.noListingsFound}</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  {search
                    ? `No skills found matching "${search}". Try adjusting your search terms or category filter.`
                    : "No skills found in this category. Check back later for new additions."}
                </p>
                {(search || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setSelectedCategory("all");
                      setPage(1);
                    }}
                    className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex shrink-0 items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {labels.previous}
                </button>
                <span className="px-4 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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

## Author

${listing.author}

## Version

${listing.version}

## Tags

${listing.tags.join(", ")}

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
  onBack,
  onDownload,
  downloading,
}: {
  listing: MarketplaceListing;
  labels: Record<string, string>;
  onBack: () => void;
  onDownload: (listing: MarketplaceListing) => void;
  downloading: string | null;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

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

      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100/50 bg-blue-50">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{listing.name}</h2>
                <p className="text-sm text-gray-500">
                  by {listing.author} • v{listing.version}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              {listing.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {formatNumber(listing.download_count)} downloads
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {listing.source}
              </span>
            </div>
            <button
              onClick={() => onDownload(listing)}
              disabled={downloading === listing.id}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {downloading === listing.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {labels.download}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{labels.skillContent}</h3>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
            {generateSkillPreview(listing)}
          </pre>
        </div>
      </div>
    </div>
  );
}


function MarketplaceListingCard({
  listing,
  labels,
  onViewDetail,
  onDownload,
  downloading,
}: {
  listing: MarketplaceListing;
  labels: Record<string, string>;
  onViewDetail: (listing: MarketplaceListing) => void;
  onDownload: (listing: MarketplaceListing) => void;
  downloading: string | null;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <article
      className="group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/50 bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100/50">
            <Globe className="h-6 w-6" />
          </div>
          <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            <TrendingUp className="h-3 w-3" />
            {formatNumber(listing.download_count)}
          </span>
        </div>
        <h3 className="mt-3 truncate text-sm font-semibold text-gray-900">
          {listing.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
          <User className="h-3 w-3" />
          {listing.author}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600">
          {listing.description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {listing.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onViewDetail(listing)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          {labels.viewDetail}
        </button>
        <button
          onClick={() => onDownload(listing)}
          disabled={downloading === listing.id}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {downloading === listing.id ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          {labels.install}
        </button>
      </div>
    </article>
  );
}


function FeaturedListingCard({
  listing,
  onViewDetail,
  onDownload,
  downloading,
}: {
  listing: MarketplaceListing;
  onViewDetail: (listing: MarketplaceListing) => void;
  onDownload: (listing: MarketplaceListing) => void;
  downloading: string | null;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <article
      className="group cursor-pointer rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
      onClick={() => onViewDetail(listing)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-100/50 bg-yellow-50 text-yellow-600">
          <Star className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">{listing.name}</h3>
          <p className="mt-0.5 truncate text-xs text-gray-400">{listing.author}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-600">
        {listing.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp className="h-3 w-3" />
          {formatNumber(listing.download_count)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(listing);
          }}
          disabled={downloading === listing.id}
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
        >
          {downloading === listing.id ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
          ) : (
            <Download className="h-3 w-3" />
          )}
        </button>
      </div>
    </article>
  );
}


function CategoryFilter({
  categories,
  selectedCategory,
  loading,
  labels,
  onCategoryChange,
}: {
  categories: MarketplaceCategory[];
  selectedCategory: string;
  loading: boolean;
  labels: Record<string, string>;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        onClick={() => onCategoryChange("all")}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
          selectedCategory === "all"
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {labels.allCategories}
      </button>
      {loading ? (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-gray-200"
            />
          ))}
        </>
      ) : (
        categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              selectedCategory === cat.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))
      )}
    </div>
  );
}
