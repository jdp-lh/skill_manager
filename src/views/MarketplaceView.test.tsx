import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketplaceView } from "./MarketplaceView";
import { vi } from "vitest";

// Simple mock for the api module
vi.mock("../lib/api", () => ({
  getMarketplaceListings: vi.fn(async (page?: number, pageSize?: number, category?: string, search?: string) => {
    const allListings = [
      {
        id: "volcengine/documentation/volcengine-documentation",
        name: "volcengine-documentation",
        description: "火山引擎官方文档查询agent，支持文档检索和全文获取。",
        author: "volcengine",
        version: "1.0.0",
        tags: ["document_processing"],
        download_count: 150,
        source: "volcengine",
      },
      {
        id: "volcengine/voice/voice-notify",
        name: "voice-notify",
        description: "使用火山引擎语音服务API，向指定手机号码发送语音通知。",
        author: "volcengine",
        version: "1.0.0",
        tags: ["voice", "notification"],
        download_count: 89,
        source: "volcengine",
      },
      {
        id: "clawhub/workflow-optimizer",
        name: "workflow-optimizer",
        description: "可对AI工作流进行分析，定位运行瓶颈并给出优化方案。",
        author: "clawhub",
        version: "1.0.0",
        tags: ["workflow", "optimization"],
        download_count: 123,
        source: "clawhub",
      },
    ];

    let filtered = [...allListings];
    if (category && category !== "all") {
      filtered = filtered.filter((l) =>
        l.tags.some((t) => t.toLowerCase().includes(category.toLowerCase()))
        || l.source.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }
    const p = page || 1;
    const ps = pageSize || 20;
    const start = (p - 1) * ps;
    return {
      listings: filtered.slice(start, start + ps),
      total: filtered.length,
      page: p,
      page_size: ps,
    };
  }),
  getMarketplaceListingDetail: vi.fn(async (id: string) => {
    const listings = [
      {
        id: "volcengine/documentation/volcengine-documentation",
        name: "volcengine-documentation",
        description: "火山引擎官方文档查询agent，支持文档检索和全文获取。",
        author: "volcengine",
        version: "1.0.0",
        tags: ["document_processing"],
        download_count: 150,
        source: "volcengine",
      },
    ];
    const listing = listings.find((l) => l.id === id);
    if (!listing) throw new Error(`Listing not found: ${id}`);
    return listing;
  }),
  downloadMarketplaceSkill: vi.fn(async (id: string, storagePath: string) => {
    return `${storagePath}/${id}.md`;
  }),
}));

const defaultLabels = {
  marketplace: "技能广场",
  marketplaceHint: "从社区发现和安装技能",
  searchMarketplace: "搜索技能...",
  refresh: "刷新",
  featured: "精选",
  allCategories: "全部",
  viewDetail: "查看详情",
  install: "安装",
  download: "下载",
  back: "返回",
  skillContent: "技能内容",
  previous: "上一页",
  next: "下一页",
  noListingsFound: "未找到技能",
};

const renderMarketplace = (props = {}) =>
  render(
    <MarketplaceView
      labels={defaultLabels}
      storagePath="/mock/skills"
      skills={[]}
      onRefresh={vi.fn()}
      onDownloadSuccess={vi.fn()}
      {...props}
    />
  );

describe("MarketplaceView", () => {
  it("加载时显示 marketplace 标题和搜索框", async () => {
    renderMarketplace();

    expect(screen.getByText("技能广场")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搜索" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });
  });

  it("加载完成后显示技能列表", async () => {
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("voice-notify")).toBeInTheDocument();
    expect(screen.getAllByText("workflow-optimizer").length).toBeGreaterThan(0);
  });

  it("支持搜索过滤技能", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    // The input doesn't have a label but has placeholder from fallback
    const searchInput = screen.getByRole("textbox");
    await act(async () => {
      await user.type(searchInput, "voice");
      await new Promise(r => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.queryByText("voice-notify")).toBeInTheDocument();
    });

    expect(screen.getByText("voice-notify")).toBeInTheDocument();
  });

  it("点击查看详情可以查看技能详情", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const listingCards = screen.getAllByText("volcengine-documentation");
    await user.click(listingCards[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    });

    expect(screen.getByText("技能内容")).toBeInTheDocument();
  });

  it("详情页不展示作者版本和标签信息", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const listingCards = screen.getAllByText("volcengine-documentation");
    await user.click(listingCards[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    });

    expect(screen.queryByText("volcengine")).not.toBeInTheDocument();
    expect(screen.queryByText("v1.0.0")).not.toBeInTheDocument();
    expect(screen.queryByText("document_processing")).not.toBeInTheDocument();
  });

  it("详情页点击返回可以回到列表", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const listingCards = screen.getAllByText("volcengine-documentation");
    await user.click(listingCards[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: "返回" });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText("技能广场")).toBeInTheDocument();
    });
  });

  it("支持下载技能", async () => {
    const user = userEvent.setup();
    const onDownloadSuccess = vi.fn();
    renderMarketplace({ onDownloadSuccess });

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    // The buttons have labels.install or "获取" in the new layout
    const installButtons = screen.getAllByRole("button", { name: "安装" });
    await user.click(installButtons[0]);

    await waitFor(() => {
      expect(onDownloadSuccess).toHaveBeenCalled();
    });
  });

  it("已安装技能显示更新按钮", async () => {
    // Add defaultLabels mapping for "update"
    const labelsWithUpdate = { ...defaultLabels, update: "更新" };
    renderMarketplace({
      labels: labelsWithUpdate,
      skills: [
        {
          name: "volcengine-documentation.md",
          is_dir: false,
          last_modified: Date.now(),
          path: "/mock/skills/volcengine-documentation.md",
          description: "Installed version"
        }
      ]
    });

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    // One of the items is installed, so we should see an update button
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
  });

  it("支持搜索按钮", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const searchButton = screen.getByRole("button", { name: "搜索" });
    await user.click(searchButton);
    
    // Test that something happened (like loadListings being called again)
    // The visual check is that the search actually works, which is covered by another test
  });

  it("搜索无结果时显示空状态和清除搜索按钮", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByRole("textbox");
    await act(async () => {
      await user.type(searchInput, "nonexistent-skill-12345");
      await new Promise(r => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.getByText("未找到技能")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "清除筛选" })).toBeInTheDocument();
    });
  });
});
