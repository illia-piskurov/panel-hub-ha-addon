export interface DashboardItem {
    id: string;
    title: string;
    url_path: string;
    mode: string;
    icon?: string;
}
export interface DashboardsListFile {
    data: { items: DashboardItem[] };
}
export interface HADashboardItem {
    id: string;
    title: string;
    url_path: string;
    mode: string;
    icon?: string;
}
export interface HAViewVisibility {
    user?: string;
}
export interface HAView {
    title?: string;
    path?: string;
    icon?: string;
    visible?: HAViewVisibility[] | boolean;
}
export interface HADashboardConfig {
    data: { config: { title?: string; views: HAView[] } };
}
export interface AppViewInfo {
    title: string;
    path: string;
    icon: string;
    isPublic: boolean;
    allowedUserIds: string[];
}
export interface AppDashboardInfo {
    id: string;
    title: string;
    url: string;
    views: AppViewInfo[];
}
export interface UpdatePayload {
    type: "set_public" | "set_user";
    dashId: string;
    urlPath: string;
    viewPath: string;
    isPublic?: boolean;
    userId?: string;
    isAllowed?: boolean;
}
export interface AddonConfig {
    ha_url: string;
}
