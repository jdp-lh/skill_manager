import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AppConfig,
  SkillEntry,
  SkillTestResult,
  deleteSkill,
  getConfig,
  listSkills,
  readSkillFile,
  saveConfig,
  syncAll,
  testToolSkill,
  writeSkillFile,
} from "../lib/api";
import { UserRole } from "../lib/permissions";

export type AppView = "skills" | "tools" | "marketplace";

export type Notice = {
  type: "success" | "error";
  message: string;
};

type PersistConfigPayload = {
  config: AppConfig;
  successMessage: string;
};

type CreateSkillPayload = {
  path: string;
  content: string;
  successMessage: string;
};

type SaveSkillPayload = {
  path: string;
  content: string;
  successMessage: string;
};

type DeleteSkillPayload = {
  path: string;
  successMessage: string;
};

type TestSkillPayload = {
  toolId: string;
  skillName: string;
};

type WorkspaceData = {
  config: AppConfig;
  skills: SkillEntry[];
  successMessage?: string;
};

const reloadWorkspace = async (): Promise<WorkspaceData> => {
  const config = await getConfig();
  const skills = await listSkills(config.storage_path);
  return { config, skills };
};

export const loadWorkspace = createAsyncThunk("workspace/load", async () => reloadWorkspace());

export const persistWorkspaceConfig = createAsyncThunk(
  "workspace/persistConfig",
  async ({ config, successMessage }: PersistConfigPayload) => {
    await saveConfig(config);
    await syncAll();
    const data = await reloadWorkspace();
    return { ...data, successMessage };
  }
);

export const createSkillEntry = createAsyncThunk(
  "workspace/createSkill",
  async ({ path, content, successMessage }: CreateSkillPayload) => {
    await writeSkillFile(path, content);
    const data = await reloadWorkspace();
    return { ...data, successMessage };
  }
);

export const saveSkillEntry = createAsyncThunk(
  "workspace/saveSkill",
  async ({ path, content, successMessage }: SaveSkillPayload) => {
    await writeSkillFile(path, content);
    const data = await reloadWorkspace();
    return { ...data, successMessage };
  }
);

export const deleteSkillEntry = createAsyncThunk(
  "workspace/deleteSkill",
  async ({ path, successMessage }: DeleteSkillPayload) => {
    await deleteSkill(path);
    await syncAll();
    const data = await reloadWorkspace();
    return { ...data, successMessage };
  }
);

export const loadSkillContent = createAsyncThunk(
  "workspace/loadSkillContent",
  async (path: string) => {
    const content = await readSkillFile(path);
    return { path, content };
  }
);

export const runToolSkillTest = createAsyncThunk(
  "workspace/runToolSkillTest",
  async ({ toolId, skillName }: TestSkillPayload) => testToolSkill(toolId, skillName)
);

export interface WorkspaceState {
  config: AppConfig | null;
  skills: SkillEntry[];
  activeView: AppView;
  role: UserRole;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: Notice | null;
  activeSkillContent: string;
  activeSkillPath: string | null;
  lastSkillTest: SkillTestResult | null;
}

const initialState: WorkspaceState = {
  config: null,
  skills: [],
  activeView: "skills",
  role: "admin",
  loading: true,
  saving: false,
  error: null,
  notice: null,
  activeSkillContent: "",
  activeSkillPath: null,
  lastSkillTest: null,
};

const successMatcher = (action: { type: string }) =>
  action.type === loadWorkspace.fulfilled.type ||
  action.type === persistWorkspaceConfig.fulfilled.type ||
  action.type === createSkillEntry.fulfilled.type ||
  action.type === saveSkillEntry.fulfilled.type ||
  action.type === deleteSkillEntry.fulfilled.type;

const pendingMatcher = (action: { type: string }) =>
  action.type === loadWorkspace.pending.type ||
  action.type === persistWorkspaceConfig.pending.type ||
  action.type === createSkillEntry.pending.type ||
  action.type === saveSkillEntry.pending.type ||
  action.type === deleteSkillEntry.pending.type;

const rejectedMatcher = (action: { type: string }) =>
  action.type === loadWorkspace.rejected.type ||
  action.type === persistWorkspaceConfig.rejected.type ||
  action.type === createSkillEntry.rejected.type ||
  action.type === saveSkillEntry.rejected.type ||
  action.type === deleteSkillEntry.rejected.type ||
  action.type === loadSkillContent.rejected.type ||
  action.type === runToolSkillTest.rejected.type;

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<AppView>) {
      state.activeView = action.payload;
    },
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
    clearNotice(state) {
      state.notice = null;
    },
    setNotice(state, action: PayloadAction<Notice | null>) {
      state.notice = action.payload;
    },
    clearSkillTest(state) {
      state.lastSkillTest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSkillContent.fulfilled, (state, action) => {
        state.activeSkillPath = action.payload.path;
        state.activeSkillContent = action.payload.content;
      })
      .addCase(runToolSkillTest.fulfilled, (state, action) => {
        state.lastSkillTest = action.payload;
        state.notice = { type: "success", message: action.payload.message };
      })
      .addMatcher(pendingMatcher, (state, action) => {
        state.error = null;
        if (action.type === loadWorkspace.pending.type) {
          state.loading = true;
        } else {
          state.saving = true;
        }
      })
      .addMatcher(successMatcher, (state, action: PayloadAction<WorkspaceData>) => {
        state.loading = false;
        state.saving = false;
        state.config = action.payload.config;
        state.skills = action.payload.skills;
        state.error = null;
        if (action.payload.successMessage) {
          state.notice = { type: "success", message: action.payload.successMessage };
        }
      })
      .addMatcher(rejectedMatcher, (state, action: any) => {
        state.loading = false;
        state.saving = false;
        state.error = action.error.message || "操作失败";
        state.notice = {
          type: "error",
          message: action.error.message || "操作失败",
        };
      });
  },
});

export const { clearNotice, clearSkillTest, setActiveView, setNotice, setRole } =
  workspaceSlice.actions;

export default workspaceSlice.reducer;
