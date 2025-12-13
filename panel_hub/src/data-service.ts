import { file } from "bun";
import {
    AUTH_FILE_PATH,
    LOVELANCE_DASHBOARD_FILE_PATH,
    OPTIONS_PATH,
} from "./config";
import { saveConfigViaWS } from "./ha-api";
import type {
    AddonConfig,
    AppDashboardInfo,
    DashboardItem,
    DashboardsListFile,
    HADashboardConfig,
    HADashboardItem,
    HAViewVisibility,
    UpdatePayload,
} from "./types";

export const getAddonConfig = async (): Promise<AddonConfig> => {
    try {
        const f = file(OPTIONS_PATH);
        if (!(await f.exists()))
            return { ha_url: "http://homeassistant.local:8123" };
        return await f.json();
    } catch (e) {
        return { ha_url: "http://homeassistant.local:8123" };
    }
};

const get_dashboards_list = async (): Promise<DashboardItem[]> => {
    try {
        const f = file(LOVELANCE_DASHBOARD_FILE_PATH);
        if (!(await f.exists())) return [];
        const content = (await f.json()) as DashboardsListFile;
        return content.data.items;
    } catch (e) {
        return [];
    }
};

const get_dashboard_details = async (
    dashboard: HADashboardItem,
): Promise<AppDashboardInfo> => {
    const filename = `lovelace.${dashboard.id}`;
    const f = file(`/homeassistant/.storage/${filename}`);
    const result: AppDashboardInfo = {
        id: dashboard.id,
        title: dashboard.title,
        url: dashboard.url_path,
        views: [],
    };

    if (!(await f.exists())) return result;

    try {
        const content = (await f.json()) as HADashboardConfig;
        const haViews = content.data.config.views || [];

        result.views = haViews.map((view, index) => {
            const allowedUsers: string[] = [];
            let isPublic = true;
            if (view.visible && Array.isArray(view.visible)) {
                isPublic = false;
                view.visible.forEach((rule) => {
                    if (rule.user) allowedUsers.push(rule.user);
                });
            }
            return {
                title: view.title || `Tab ${index + 1}`,
                path: view.path || String(index),
                icon: view.icon || "mdi:view-dashboard",
                isPublic: isPublic,
                allowedUserIds: allowedUsers,
            };
        });
        return result;
    } catch (e) {
        return result;
    }
};

export const fetchUsersData = async () => {
    try {
        const f = file(AUTH_FILE_PATH);
        if (!(await f.exists())) return [];
        const content = await f.json();
        return content.data.users
            .filter((u: any) => u.is_active && !u.system_generated)
            .map((user: any) => ({
                name: user.name,
                id: user.id,
                role: user.is_owner ? "Owner" : "User",
            }));
    } catch (err) {
        return [];
    }
};

export const fetchDashboardsData = async () => {
    const dashboardsList = await get_dashboards_list();
    return Promise.all(dashboardsList.map((d) => get_dashboard_details(d)));
};

export const updateDashboardAccess = async (payload: UpdatePayload) => {
    const filename = `lovelace.${payload.dashId}`;
    const f = file(`/homeassistant/.storage/${filename}`);

    if (!(await f.exists()))
        return { success: false, error: "Dashboard file not found" };

    try {
        const content = (await f.json()) as HADashboardConfig;
        const views = content.data.config.views;

        if (!views)
            return { success: false, error: "No views found in dashboard" };

        const targetView = views.find((v, index) => {
            const currentPath = v.path || String(index);
            return currentPath === payload.viewPath;
        });

        if (!targetView) return { success: false, error: "View not found" };

        if (payload.type === "set_public") {
            if (payload.isPublic) {
                delete targetView.visible;
            } else {
                if (!targetView.visible || !Array.isArray(targetView.visible))
                    targetView.visible = [];
            }
        } else if (payload.type === "set_user") {
            if (!Array.isArray(targetView.visible)) targetView.visible = [];
            const targetVisible = targetView.visible as HAViewVisibility[];
            const userId = payload.userId!;

            if (payload.isAllowed) {
                if (!targetVisible.some((r) => r.user === userId))
                    targetVisible.push({ user: userId });
            } else {
                targetView.visible = targetVisible.filter(
                    (r) => r.user !== userId,
                );
            }
        }

        const success = await saveConfigViaWS(
            payload.urlPath,
            content.data.config,
        );

        if (success) return { success: true };
        else return { success: false, error: "HA refused to save config" };
    } catch (e) {
        console.error(e);
        return { success: false, error: String(e) };
    }
};
