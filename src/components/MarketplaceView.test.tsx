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
        description: "火山引擎官方文档查询工具，支持文档检索和全文获取。",
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
  getFeaturedListings: vi.fn(async () => {
    return [
      {
        id: "volcengine/documentation/volcengine-documentation",
        name: "volcengine-documentation",
        description: "火山引擎官方文档查询工具，支持文档检索和全文获取。",
        author: "volcengine",
        version: "1.0.0",
        tags: ["document_processing"],
        download_count: 150,
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
  }),
  getMarketplaceCategories: vi.fn(async () => {
    return [
      { id: "volcengine", name: "volcengine", count: 2 },
      { id: "clawhub", name: "clawhub", count: 1 },
      { id: "workflow", name: "workflow", count: 1 },
    ];
  }),
  getMarketplaceListingDetail: vi.fn(async (id: string) => {
    const listings = [
      {
        id: "volcengine/documentation/volcengine-documentation",
        name: "volcengine-documentation",
        description: "火山引擎官方文档查询工具，支持文档检索和全文获取。",
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
      onRefresh={vi.fn()}
      onDownloadSuccess={vi.fn()}
      {...props}
    />
  );

describe("MarketplaceView", () => {
  it("加载时显示 marketplace 标题和搜索框", async () => {
    renderMarketplace();

    expect(screen.getByText("技能广场")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索技能...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();

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

    const searchInput = screen.getByPlaceholderText("搜索技能...");
    await act(async () => {
      await user.type(searchInput, "voice");
      await new Promise(r => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.queryByText("voice-notify")).toBeInTheDocument();
    });

    expect(screen.getByText("voice-notify")).toBeInTheDocument();
  });

  it("支持按分类筛选", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const volcengineCategory = screen.getByRole("button", { name: /volcengine/i });
    await user.click(volcengineCategory);

    await waitFor(() => {
      expect(screen.getByText("volcengine-documentation")).toBeInTheDocument();
    });
  });

  it("显示精选技能区域", async () => {
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByText("精选")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });
  });

  it("点击查看详情可以查看技能详情", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByRole("button", { name: "查看详情" });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    });

    expect(screen.getByText("技能内容")).toBeInTheDocument();
  });

  it("详情页点击返回可以回到列表", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByRole("button", { name: "查看详情" });
    await user.click(viewButtons[0]);

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

    const installButtons = screen.getAllByRole("button", { name: "安装" });
    await user.click(installButtons[0]);

    await waitFor(() => {
      expect(onDownloadSuccess).toHaveBeenCalled();
    });
  });

  it("支持刷新按钮", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderMarketplace({ onRefresh });

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const refreshButton = screen.getByRole("button", { name: "刷新" });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it("显示分类按钮", async () => {
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /volcengine/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clawhub/i })).toBeInTheDocument();
  });

  it("搜索无结果时显示空状态", async () => {
    const user = userEvent.setup();
    renderMarketplace();

    await waitFor(() => {
      expect(screen.getAllByText("volcengine-documentation").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("搜索技能...");
    await act(async () => {
      await user.type(searchInput, "nonexistent-skill-12345");
      await new Promise(r => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.getByText("未找到技能")).toBeInTheDocument();
    });
  });
});
